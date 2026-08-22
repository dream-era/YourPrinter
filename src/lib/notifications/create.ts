/**
 * lib/notifications/create.ts
 * Inserts a notification row. Clients subscribe to Supabase Realtime on the
 * `notifications` table filtered by `user_id=eq.<their id>` for live push —
 * no extra websocket/broadcast code needed on the backend beyond this insert.
 *
 * Also sends an email for the notification types where that's genuinely
 * useful (order ready, new order) — not every internal status blip. Skips
 * synthetic staff addresses (@printq.internal) automatically, since those
 * accounts exist only to satisfy foreign keys and don't correspond to a
 * real inbox.
 */

import { getServiceRoleClient } from "@/lib/supabase/admin";
import { sendEmail, isSyntheticEmail } from "@/lib/notifications/email";
import { sendSms, toE164India } from "@/lib/notifications/sms";

export type NotificationType =
  | "new_order"
  | "order_accepted"
  | "order_printing"
  | "order_ready"
  | "order_completed"
  | "order_cancelled";

// Only these types trigger an email — the rest are in-app/Realtime only.
// A staff member doesn't need an email every time an order moves to
// "printing"; a student DOES want to know their order is ready.
const EMAIL_NOTIFICATION_TYPES: NotificationType[] = [
  "new_order",
  "order_ready",
  "order_completed",
  "order_cancelled",
];

// SMS is reserved for the one notification where a delay genuinely costs
// the person something — "your order is ready" is the moment a student is
// most likely to be away from the app entirely (in class, walking over).
// Everything else stays email/in-app to avoid SMS fatigue and cost.
const SMS_NOTIFICATION_TYPES: NotificationType[] = ["order_ready"];

export async function createNotification(params: {
  userId: string;
  orderId?: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}) {
  const supabase = getServiceRoleClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    order_id: params.orderId ?? null,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    data: params.data ?? null,
  });
  if (error) {
    // Notifications are best-effort — don't fail the parent operation
    // (e.g. an order status update) just because a notification insert failed.
    console.error("Failed to create notification:", error.message);
  }

  if (EMAIL_NOTIFICATION_TYPES.includes(params.type)) {
    // Fire-and-forget: email delivery shouldn't block or fail the caller
    // (e.g. an order status transition). Errors are logged inside sendEmail.
    sendNotificationEmail(params.userId, params.title, params.body).catch((err: Error) =>
      console.error("Failed to send notification email:", err.message)
    );
  }

  if (SMS_NOTIFICATION_TYPES.includes(params.type)) {
    sendNotificationSms(params.userId, params.title, params.body).catch((err: Error) =>
      console.error("Failed to send notification SMS:", err.message)
    );
  }
}

async function sendNotificationSms(userId: string, title: string, body?: string) {
  const supabase = getServiceRoleClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", userId)
    .single();

  if (!profile?.phone) return;

  await sendSms({
    to: toE164India(profile.phone),
    body: body ? `${title} — ${body}` : title,
  });
}

async function sendNotificationEmail(userId: string, title: string, body?: string) {
  const supabase = getServiceRoleClient();
  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  const email = userData?.user?.email;

  if (!email || isSyntheticEmail(email)) return;

  await sendEmail({
    to: email,
    subject: title,
    html: `<p>${title}</p>${body ? `<p>${body}</p>` : ""}`,
  });
}

/** Notify every active staff member + the owner of a shop (e.g. on new order). */
export async function notifyShopTeam(params: {
  shopId: string;
  orderId: string;
  type: NotificationType;
  title: string;
  body?: string;
}) {
  const supabase = getServiceRoleClient();

  const { data: shop } = await supabase
    .from("shops")
    .select("owner_id")
    .eq("id", params.shopId)
    .single();

  const { data: staff } = await supabase
    .from("shop_staff")
    .select("user_id")
    .eq("shop_id", params.shopId)
    .eq("active", true);

  const recipientIds = new Set<string>();
  if (shop?.owner_id) recipientIds.add(shop.owner_id);
  for (const s of staff ?? []) recipientIds.add(s.user_id);

  await Promise.all(
    Array.from(recipientIds).map((userId) =>
      createNotification({
        userId,
        orderId: params.orderId,
        type: params.type,
        title: params.title,
        body: params.body,
      })
    )
  );
}
