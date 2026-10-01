/**
 * POST /api/documents/[documentId]/process
 *
 * Called by the client immediately after a successful file upload to B2.
 * Verifies that the file actually landed in B2, then marks the document as 'ready'.
 *
 * This prevents phantom documents (DB row exists but no actual file in B2).
 *
 * Security:
 * - Only the uploader can call this endpoint.
 * - The document must currently be in 'uploading' status.
 * - We verify the file exists in B2 before marking it ready.
 * - If B2 verification fails, the document stays 'uploading' so the client
 *   can retry rather than getting a silent fake-success.
 */

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { exists as b2Exists } from "@/lib/storage/b2";

export async function POST(
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
  const { data: document, error: fetchError } = await supabase
    .from("documents")
    .select("id, uploaded_by, storage_path, storage_provider, status")
    .eq("id", params.documentId)
    .single();

  if (fetchError || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // ── 3. Authorization — only the uploader can finalize their own upload ─────
  if (document.uploaded_by !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // ── 4. Idempotency — already processed ────────────────────────────────────
  if (document.status === "ready") {
    const { data: readyDoc } = await supabase
      .from("documents")
      .select("*")
      .eq("id", document.id)
      .single();
    return NextResponse.json({ document: readyDoc, message: "Already processed" });
  }

  // ── 5. Verify the file actually exists in B2 (for backblaze uploads) ───────
  if (document.storage_provider === "backblaze") {
    let fileFound: boolean;
    try {
      fileFound = await b2Exists(document.storage_path);
    } catch (err) {
      console.error("[process] B2 existence check failed:", err);
      return NextResponse.json(
        { error: "Storage verification unavailable. Please retry in a moment." },
        { status: 503 }
      );
    }

    if (!fileFound) {
      // The client's PUT hasn't completed or failed. Return 409 so the client
      // knows to retry uploading rather than treating this as a success.
      return NextResponse.json(
        {
          error:
            "File not found in storage. " +
            "The upload may still be in progress or it failed. Please retry.",
          retryUpload: true,
        },
        { status: 409 }
      );
    }
  }

  // ── 6. Mark document as ready ──────────────────────────────────────────────
  try {
    const { data: updatedDoc, error: updateError } = await supabase
      .from("documents")
      .update({ status: "ready" })
      .eq("id", document.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      document: updatedDoc,
      pageCountIsEstimate: false,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase
      .from("documents")
      .update({ status: "failed", processing_error: message })
      .eq("id", document.id);

    return NextResponse.json(
      { error: "Failed to finalize document processing", details: message },
      { status: 500 }
    );
  }
}
