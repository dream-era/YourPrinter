/**
 * GET /api/documents/[documentId]/download-url
 *
 * Returns a short-lived signed URL from the appropriate storage provider:
 * - Backblaze B2 (new documents — storage_provider = 'backblaze')
 * - Supabase Storage (legacy documents — storage_provider = 'supabase')
 *
 * The dual-provider fallback ensures that existing orders created before the
 * B2 migration continue to work without any data migration required.
 *
 * Security:
 * - User must be authenticated.
 * - Only the uploader, the shop owner, or active shop staff may request a URL.
 * - shop_id and document ownership are verified server-side — never trust the client.
 * - The document must be in 'ready' status.
 * - URLs expire in 5 minutes. No permanent public URLs are ever generated.
 * - B2 credentials are never sent to the browser.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { getSignedDownloadUrl as b2GetSignedDownloadUrl, DOWNLOAD_URL_EXPIRY_SECONDS } from "@/lib/storage/b2";

const LEGACY_SUPABASE_BUCKET = "documents";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ documentId: string }> }
) {
  const params = await props.params;

  // ── 1. Authentication ──────────────────────────────────────────────────────
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = getServiceRoleClient();

  // ── 2. Fetch document ──────────────────────────────────────────────────────
  const { data: document, error } = await supabase
    .from("documents")
    .select("id, storage_path, storage_provider, uploaded_by, shop_id, status")
    .eq("id", params.documentId)
    .single();

  if (error || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // ── 3. Authorization ───────────────────────────────────────────────────────
  // Allowed: the original uploader OR the shop owner OR active shop staff.
  // This mirrors the Supabase RLS policy but enforced server-side to cover
  // the B2 layer as well.
  const isUploader = document.uploaded_by === user.id;
  let hasShopAccess = false;

  if (!isUploader) {
    // Check if user is the shop owner
    const { data: shop } = await supabase
      .from("shops")
      .select("owner_id")
      .eq("id", document.shop_id)
      .single();

    if (shop?.owner_id === user.id) {
      hasShopAccess = true;
    } else {
      // Check if user is active staff at this shop
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
    // Return 404 rather than 403 to avoid confirming that a document ID exists
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // ── 4. Status check ────────────────────────────────────────────────────────
  if (document.status !== "ready") {
    return NextResponse.json(
      { error: `Document is not ready (status: ${document.status})` },
      { status: 409 }
    );
  }

  // ── 5. Generate signed URL — provider-specific ────────────────────────────
  const provider = document.storage_provider ?? "supabase"; // default for legacy rows without the column

  if (provider === "backblaze") {
    // ── B2 signed download URL (new documents) ──────────────────────────────
    try {
      const url = await b2GetSignedDownloadUrl(document.storage_path, DOWNLOAD_URL_EXPIRY_SECONDS);
      return NextResponse.json({ url, expiresInSeconds: DOWNLOAD_URL_EXPIRY_SECONDS });
    } catch (err) {
      console.error("[download-url] B2 signed URL generation failed:", err);
      return NextResponse.json(
        { error: "Failed to generate download URL. Please try again." },
        { status: 500 }
      );
    }
  } else {
    // ── Supabase Storage signed URL (legacy documents) ──────────────────────
    const { data: signed, error: signError } = await supabase.storage
      .from(LEGACY_SUPABASE_BUCKET)
      .createSignedUrl(document.storage_path, DOWNLOAD_URL_EXPIRY_SECONDS);

    if (signError || !signed) {
      console.error("[download-url] Supabase Storage signed URL failed:", signError);
      return NextResponse.json(
        { error: "Failed to generate download URL. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: signed.signedUrl, expiresInSeconds: DOWNLOAD_URL_EXPIRY_SECONDS });
  }
}
