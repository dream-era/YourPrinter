/**
 * lib/orders/auto-advance.ts
 * Called right after an order is marked 'accepted' (from both the payment
 * webhook and the client-side verify route). If the shop has autoprint
 * enabled, this skips the "staff clicks Start Printing" step entirely —
 * transitions straight to 'printing' and queues the print job, same as
 * PATCH orders/[id]/status does manually, just system-triggered.
 *
 * This is deliberately the ONLY new logic true 24/7 autoprint needed — the
 * print agent, print_jobs table, and conversion pipeline were already
 * built for the manual trigger. Autoprint is a different trigger for the
 * same pipeline, not a different pipeline.
 */

import { getServiceRoleClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/create";

export async function maybeAutoAdvanceToPrinting(params: {
  orderId: string;
  shopId: string;
  documentId: string;
  studentId: string;
}): Promise<void> {
  const supabase = getServiceRoleClient();

  const { data: shop } = await supabase
    .from("shops")
    .select("autoprint_enabled")
    .eq("id", params.shopId)
    .single();

  if (!shop?.autoprint_enabled) return;

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: "printing", printing_started_at: now })
    .eq("id", params.orderId)
    .eq("status", "accepted"); // guard: only advance if still exactly where we expect

  if (updateError) {
    console.error("Autoprint: failed to advance order to printing:", updateError.message);
    return;
  }

  await supabase.from("order_status_history").insert({
    order_id: params.orderId,
    from_status: "accepted",
    to_status: "printing",
    changed_by: null, // null = system-triggered, per the column's convention
    note: "Auto-advanced: shop has 24/7 autoprint enabled",
  });

  await supabase.from("print_jobs").insert({
    order_id: params.orderId,
    shop_id: params.shopId,
    document_id: params.documentId,
    status: "queued",
  });

  await createNotification({
    userId: params.studentId,
    orderId: params.orderId,
    type: "order_printing",
    title: "Your print job has started",
    body: "This shop prints automatically — no staff action needed.",
  });
}
