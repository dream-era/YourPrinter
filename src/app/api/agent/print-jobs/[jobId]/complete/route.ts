/**
 * POST /api/agent/print-jobs/[jobId]/complete
 * Body: { success: boolean, error?: string }
 * On failure, the job goes back to 'queued' (so it's retried on the next
 * poll) unless it's already been attempted MAX_ATTEMPTS times, in which
 * case it's marked 'failed' permanently and someone needs to look at it —
 * a print job that silently retries forever on a jammed printer is worse
 * than one that gives up and surfaces the problem.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { requireAgent } from "@/lib/auth/require-agent";
import { createNotification } from "@/lib/notifications/create";

const MAX_ATTEMPTS = 3;

const bodySchema = z.object({
  success: z.boolean(),
  error: z.string().max(500).optional(),
});

export async function POST(req: NextRequest, props: { params: Promise<{ jobId: string }> }) {
  const params = await props.params;
  const authResult = await requireAgent(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = getServiceRoleClient();
  const { data: job, error: fetchError } = await supabase
    .from("print_jobs")
    .select("id, order_id, shop_id, attempts, status")
    .eq("id", params.jobId)
    .eq("shop_id", authResult.shopId)
    .single();

  if (fetchError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (parsed.data.success) {
    await supabase
      .from("print_jobs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", job.id);

    return NextResponse.json({ status: "completed" });
  }

  // Failure path
  const willRetry = job.attempts < MAX_ATTEMPTS;
  await supabase
    .from("print_jobs")
    .update({
      status: willRetry ? "queued" : "failed",
      last_error: parsed.data.error ?? "Unknown print failure",
    })
    .eq("id", job.id);

  if (!willRetry) {
    // Surface this to shop staff — a print job that gave up needs a human,
    // e.g. printer offline/out of paper/toner.
    const { data: order } = await supabase
      .from("orders")
      .select("shop_id")
      .eq("id", job.order_id)
      .single();
    if (order) {
      const { data: shop } = await supabase
        .from("shops")
        .select("owner_id")
        .eq("id", order.shop_id)
        .single();
      if (shop?.owner_id) {
        await createNotification({
          userId: shop.owner_id,
          orderId: job.order_id,
          type: "order_printing",
          title: "A print job failed and needs attention",
          body: parsed.data.error ?? "The print agent reported repeated failures.",
        });
      }
    }
  }

  return NextResponse.json({ status: willRetry ? "queued" : "failed" });
}
