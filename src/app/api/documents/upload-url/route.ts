/**
 * POST /api/documents/upload-url
 *
 * Returns a short-lived pre-signed B2 PUT URL so the client can upload a file
 * directly to Backblaze B2 without routing file bytes through the Next.js server.
 *
 * Security:
 * - User must be authenticated (Bearer token verified server-side).
 * - File type, extension, and size are validated server-side; never trust the client.
 * - shop_id is verified to exist and be active.
 * - The B2 object key is generated server-side — the client never controls the key.
 * - The upload URL expires in 15 minutes.
 * - B2 credentials are never sent to the browser.
 *
 * Flow:
 * 1. Validate auth + rate limit + input
 * 2. Verify shop exists and is active
 * 3. Generate document UUID + B2 object key
 * 4. Insert documents row (status = 'uploading', storage_provider = 'backblaze')
 * 5. Generate B2 pre-signed PUT URL
 * 6. Return { documentId, signedUrl, path } — same shape as the old Supabase route
 *    so UploadClient.tsx needs no structural changes.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { SUPPORTED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/documents/pageCount";
import { buildObjectKey, getSignedUploadUrl } from "@/lib/storage/b2";
import { checkRateLimit, getStandardLimiter } from "@/lib/security/rate-limit";

// Allowed file extensions — must match the MIME type (defence-in-depth).
const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
};

export async function POST(req: NextRequest) {
  // ── 1. Authentication ──────────────────────────────────────────────────────
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // ── 2. Rate limiting ───────────────────────────────────────────────────────
  const { allowed } = await checkRateLimit(getStandardLimiter(), `upload:${user.id}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many upload requests. Please try again later." },
      { status: 429 }
    );
  }

  // ── 3. Input validation ────────────────────────────────────────────────────
  const body = await req.json().catch(() => null);
  if (!body || !body.fileName || !body.fileType || !body.fileSize || !body.shopId || !body.pageCount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Validate MIME type
  if (!SUPPORTED_MIME_TYPES.includes(body.fileType)) {
    return NextResponse.json({ error: `Unsupported file type: ${body.fileType}` }, { status: 415 });
  }

  // Validate file extension matches declared MIME type (prevents MIME spoofing)
  const allowedExts = ALLOWED_EXTENSIONS[body.fileType] ?? [];
  const nameLower: string = body.fileName.toLowerCase();
  const extensionOk = allowedExts.some((ext: string) => nameLower.endsWith(ext));
  if (!extensionOk) {
    return NextResponse.json(
      { error: `File extension does not match declared type (${body.fileType})` },
      { status: 415 }
    );
  }

  // Validate file size
  if (typeof body.fileSize !== "number" || body.fileSize > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.` },
      { status: 413 }
    );
  }

  if (typeof body.pageCount !== "number" || body.pageCount < 1 || body.pageCount > 10000) {
    return NextResponse.json({ error: "Invalid page count" }, { status: 400 });
  }

  // ── 4. Verify shop ─────────────────────────────────────────────────────────
  const supabase = getServiceRoleClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("id, status")
    .eq("id", body.shopId)
    .single();

  if (!shop || shop.status !== "active") {
    return NextResponse.json(
      { error: "Shop not found or not accepting orders" },
      { status: 404 }
    );
  }

  // ── 5. Generate B2 object key ──────────────────────────────────────────────
  // documentId is generated server-side — the client has no control over it.
  const documentId = randomUUID();
  const storageKey = buildObjectKey(body.shopId, documentId, body.fileName);

  // ── 6. Insert document row (status = 'uploading') ─────────────────────────
  // We insert BEFORE generating the upload URL so that if URL generation fails,
  // we haven't given the client a useless URL with no corresponding DB row.
  // If the client never completes the upload, a background cleanup job can
  // delete stale 'uploading' rows after a TTL.
  const { data: document, error: insertError } = await supabase
    .from("documents")
    .insert({
      id: documentId,
      uploaded_by: user.id,
      shop_id: body.shopId,
      storage_path: storageKey,
      storage_provider: "backblaze",
      original_filename: body.fileName,
      mime_type: body.fileType,
      size_bytes: body.fileSize,
      page_count: body.pageCount,
      status: "uploading",
    })
    .select()
    .single();

  if (insertError || !document) {
    console.error("[upload-url] Failed to insert document:", insertError);
    return NextResponse.json({ error: "Failed to save document metadata" }, { status: 500 });
  }

  // ── 7. Generate B2 pre-signed PUT URL ─────────────────────────────────────
  let signedUrl: string;
  try {
    signedUrl = await getSignedUploadUrl(storageKey, body.fileType);
  } catch (err: unknown) {
    // Roll back the document row so we don't leave a stale 'uploading' record
    await supabase.from("documents").delete().eq("id", documentId);
    console.error("[upload-url] B2 URL generation failed:", err);
    return NextResponse.json(
      { error: "Storage service unavailable. Please try again." },
      { status: 503 }
    );
  }

  // ── 8. Return — same shape as the old Supabase response ───────────────────
  // signedUrl: the B2 pre-signed PUT URL (expires in 15 min)
  // path:      the B2 object key (stored in documents.storage_path)
  return NextResponse.json({
    documentId: document.id,
    signedUrl,
    path: storageKey,
  });
}
