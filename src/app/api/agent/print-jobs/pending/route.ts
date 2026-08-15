/**
 * GET /api/agent/print-jobs/pending
 * Agent-authenticated (X-Agent-Key header). Returns queued jobs for this
 * agent's shop. The agent should poll this periodically (e.g. every 5-10s)
 * — polling was chosen over Realtime here specifically so agents never need
 * a Supabase key distributed to a shop PC, only their own scoped agent key.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { requireAgent } from "@/lib/auth/require-agent";

export async function GET(req: NextRequest) {
  const authResult = await requireAgent(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = getServiceRoleClient();
  const { data: jobs, error } = await supabase
    .from("print_jobs")
    .select(
      `id, order_id, document_id, status, attempts, created_at,
       order:orders (print_options),
       document:documents (original_filename, mime_type)`
    )
    .eq("shop_id", authResult.shopId)
    .eq("status", "queued")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to load print jobs" }, { status: 500 });
  }

  return NextResponse.json({ jobs });
}
