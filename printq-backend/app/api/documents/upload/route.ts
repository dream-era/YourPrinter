/**
 * POST /api/documents/upload
 * multipart/form-data: file, shopId
 *
 * Uploads to the private 'documents' bucket in Supabase Storage, extracts
 * page count synchronously (fine for typical print-shop file sizes; move
 * this to a background job/queue if you start seeing large decks/scans
 * that make the request slow), and inserts the documents row that
 * lib/pricing/calculate.ts and the order-creation route both depend on.
 */

export const runtime = "nodejs"; // needed for Buffer + pdf-parse/adm-zip/mammoth

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import {
  extractPageCount,
  SUPPORTED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/documents/pageCount";

const DOCUMENTS_BUCKET = "documents";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("file");
  const shopId = formData.get("shopId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (typeof shopId !== "string" || !shopId) {
    return NextResponse.json({ error: "Missing shopId" }, { status: 400 });
  }
  if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}. Supported: ${SUPPORTED_MIME_TYPES.join(", ")}` },
      { status: 415 }
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File too large. Max ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.` },
      { status: 413 }
    );
  }

  const supabase = getServiceRoleClient();

  // Confirm the target shop exists and is active before accepting an upload for it.
  const { data: shop } = await supabase
    .from("shops")
    .select("id, status")
    .eq("id", shopId)
    .single();
  if (!shop || shop.status !== "active") {
    return NextResponse.json({ error: "Shop not found or not currently accepting orders" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = `${shopId}/${user.id}/${randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "Failed to upload file", details: uploadError.message },
      { status: 500 }
    );
  }

  // Insert the row first as 'processing' in case page-count extraction throws.
  const { data: document, error: insertError } = await supabase
    .from("documents")
    .insert({
      uploaded_by: user.id,
      shop_id: shopId,
      storage_path: storagePath,
      original_filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      status: "processing",
    })
    .select()
    .single();

  if (insertError || !document) {
    // Clean up the orphaned storage object since the DB row failed.
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
    return NextResponse.json({ error: "Failed to save document metadata" }, { status: 500 });
  }

  try {
    const { pageCount, isEstimate } = await extractPageCount(buffer, file.type);
    await supabase
      .from("documents")
      .update({ page_count: pageCount, status: "ready" })
      .eq("id", document.id);

    return NextResponse.json({
      document: { ...document, page_count: pageCount, status: "ready" },
      pageCountIsEstimate: isEstimate,
    });
  } catch (err: any) {
    await supabase
      .from("documents")
      .update({ status: "failed", processing_error: err.message })
      .eq("id", document.id);

    return NextResponse.json(
      { error: "Uploaded, but could not determine page count", details: err.message },
      { status: 422 }
    );
  }
}
