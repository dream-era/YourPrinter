/**
 * POST /api/agent/print-jobs/[jobId]/ack
 * Agent claims a job before it starts sending bytes to the printer. This
 * prevents a double-print if the agent crashes/restarts mid-job and picks
 * the same "queued" job up again — claimed/printing jobs are excluded from
 * the pending list.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { requireAgent } from "@/lib/auth/require-agent";

export async function POST(req: NextRequest, props: { params: Promise<{ jobId: string }> }) {
  const params = await props.params;
  const authResult = await requireAgent(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = getServiceRoleClient();

  // Atomic claim: only succeeds if the job is still 'queued' and belongs to
  // this agent's shop — two agents (shouldn't happen, but) can't double-claim.
  const { data: job, error } = await supabase
    .from("print_jobs")
    .update({
      status: "printing",
      claimed_by_agent_id: authResult.agentId,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", params.jobId)
    .eq("shop_id", authResult.shopId)
    .eq("status", "queued")
    .select("id, order_id, document_id, attempts")
    .single();

  if (error || !job) {
    return NextResponse.json(
      { error: "Job not found, already claimed, or belongs to a different shop" },
      { status: 409 }
    );
  }

  await supabase
    .from("print_jobs")
    .update({ attempts: (job.attempts ?? 0) + 1 })
    .eq("id", job.id);

  return NextResponse.json({ job });
}
