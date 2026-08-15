/**
 * GET /api/agent/documents/[documentId]/download-url
 * Same idea as the staff-facing signed-URL route, but agent-authenticated
 * and scoped to the agent's own shop — an agent for Shop A can never fetch
 * a document belonging to Shop B, even if it somehow learned the id.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { requireAgent } from "@/lib/auth/require-agent";

const DOCUMENTS_BUCKET = "documents";
const SIGNED_URL_EXPIRY_SECONDS = 300;

export async function GET(req: NextRequest, props: { params: Promise<{ documentId: string }> }) {
  const params = await props.params;
  const authResult = await requireAgent(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = getServiceRoleClient();
  const { data: document, error } = await supabase
    .from("documents")
    .select("id, storage_path, shop_id, status")
    .eq("id", params.documentId)
    .single();

  if (error || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (document.shop_id !== authResult.shopId) {
    return NextResponse.json({ error: "This document does not belong to your shop" }, { status: 403 });
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

  return NextResponse.json({ url: signed.signedUrl, expiresInSeconds: SIGNED_URL_EXPIRY_SECONDS });
}
