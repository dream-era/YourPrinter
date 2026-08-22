/**
 * GET /api/agent/documents/[documentId]/download-url
 *
 * Agent-authenticated version of the download URL endpoint.
 * Returns a short-lived signed URL from the appropriate storage provider:
 * - Backblaze B2 (storage_provider = 'backblaze') for new documents
 * - Supabase Storage (storage_provider = 'supabase') for legacy documents
 *
 * Security:
 * - Only an authenticated agent for the document's shop may request the URL.
 * - Agent for Shop A cannot access documents belonging to Shop B.
 * - The document must be in 'ready' status.
 * - URLs expire in 5 minutes.
 * - B2 credentials are never sent to the agent/browser.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { requireAgent } from "@/lib/auth/require-agent";
import { getSignedDownloadUrl as b2GetSignedDownloadUrl, DOWNLOAD_URL_EXPIRY_SECONDS } from "@/lib/storage/b2";

const LEGACY_SUPABASE_BUCKET = "documents";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ documentId: string }> }
) {
  const params = await props.params;

  // ── 1. Agent authentication ────────────────────────────────────────────────
  const authResult = await requireAgent(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = getServiceRoleClient();

  // ── 2. Fetch document ──────────────────────────────────────────────────────
  const { data: document, error } = await supabase
    .from("documents")
    .select("id, storage_path, storage_provider, shop_id, status")
    .eq("id", params.documentId)
    .single();

  if (error || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // ── 3. Authorization — agent can only access its own shop's documents ───────
  if (document.shop_id !== authResult.shopId) {
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
  const provider = document.storage_provider ?? "supabase";

  if (provider === "backblaze") {
    // ── B2 signed download URL ──────────────────────────────────────────────
    try {
      const url = await b2GetSignedDownloadUrl(document.storage_path, DOWNLOAD_URL_EXPIRY_SECONDS);
      return NextResponse.json({ url, expiresInSeconds: DOWNLOAD_URL_EXPIRY_SECONDS });
    } catch (err) {
      console.error("[agent/download-url] B2 signed URL generation failed:", err);
      return NextResponse.json(
        { error: "Failed to generate download URL. Please try again." },
        { status: 500 }
      );
    }
  } else {
    // ── Legacy Supabase Storage signed URL ──────────────────────────────────
    const { data: signed, error: signError } = await supabase.storage
      .from(LEGACY_SUPABASE_BUCKET)
      .createSignedUrl(document.storage_path, DOWNLOAD_URL_EXPIRY_SECONDS);

    if (signError || !signed) {
      console.error("[agent/download-url] Supabase Storage signed URL failed:", signError);
      return NextResponse.json(
        { error: "Failed to generate download URL. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: signed.signedUrl, expiresInSeconds: DOWNLOAD_URL_EXPIRY_SECONDS });
  }
}
