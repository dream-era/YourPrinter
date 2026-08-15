/**
 * GET /api/documents/[documentId]/download-url
 * Returns a short-lived signed URL from Supabase Storage. This is what your
 * "Start Print" button / local print agent should call to actually fetch
 * the file bytes for printing — never expose the raw storage path directly,
 * since the bucket is private.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

const DOCUMENTS_BUCKET = "documents";
const SIGNED_URL_EXPIRY_SECONDS = 300; // 5 minutes — regenerate if the print agent needs a retry

export async function GET(req: NextRequest, props: { params: Promise<{ documentId: string }> }) {
  const params = await props.params;
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getServiceRoleClient();
  const { data: document, error } = await supabase
    .from("documents")
    .select("id, storage_path, uploaded_by, shop_id, status")
    .eq("id", params.documentId)
    .single();

  if (error || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Access allowed if: the uploader themself, the shop owner, or shop staff.
  const isUploader = document.uploaded_by === user.id;
  let hasShopAccess = false;
  if (!isUploader) {
    const { data: shop } = await supabase
      .from("shops")
      .select("owner_id")
      .eq("id", document.shop_id)
      .single();
    if (shop?.owner_id === user.id) {
      hasShopAccess = true;
    } else {
      const { data: staffRow } = await supabase
        .from("shop_staff")
        .select("id")
        .eq("shop_id", document.shop_id)
        .eq("user_id", user.id)
        .eq("active", true)
        .single();
      hasShopAccess = !!staffRow;
    }
  }

  if (!isUploader && !hasShopAccess) {
    return NextResponse.json({ error: "You do not have access to this document" }, { status: 403 });
  }

  if (document.status !== "ready") {
    return NextResponse.json({ error: `Document is not ready (status: ${document.status})` }, { status: 409 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(document.storage_path, SIGNED_URL_EXPIRY_SECONDS);

  if (signError || !signed) {
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
  }

  return NextResponse.json({
    url: signed.signedUrl,
    expiresInSeconds: SIGNED_URL_EXPIRY_SECONDS,
  });
}
