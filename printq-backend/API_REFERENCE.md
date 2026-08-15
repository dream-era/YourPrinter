# YourPrinter API Reference — Frontend Integration Guide

Everything Antigravity (or any frontend) needs to wire up the UI without
reading route source. Grouped by feature area, in the order a user would
hit them.

## Auth conventions (read this first)

Every endpoint below expects one of three header shapes:

| Caller | Header | How to get it |
|---|---|---|
| Student / shop owner | `Authorization: Bearer <supabase_access_token>` | `supabase.auth.getSession()` client-side |
| Counter staff (PIN login) | `Authorization: Bearer <staff_jwt>` | Response from `POST /api/auth/staff-login` |
| Print agent (background service) | `X-Agent-Key: pq_agent_<id>.<secret>` | Shown once from `POST /api/shops/[shopId]/agents` |

Owner and staff tokens are **interchangeable on shop-scoped routes** — any
route using `requireShopAccess` (marked "owner or staff" below) accepts
either. Routes marked "owner only" (`requireShopOwner`) reject staff tokens.

Sign-up/login/logout/password-reset are **not backend routes** — call the
Supabase client SDK directly:
```js
await supabase.auth.signUp({ email, password });
await supabase.auth.signInWithPassword({ email, password });
await supabase.auth.resetPasswordForEmail(email);
```
Right after `signUp` succeeds, call `POST /api/profile` once to create the
YourPrinter profile row (role, name, phone).

All request/response bodies are JSON except file upload (`multipart/form-data`).
All money fields are **integer paise** (₹1 = 100). Divide by 100 to display rupees.

---

## Profile

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/api/profile` | user | `{role: "student"\|"owner", fullName, phone?}` | Call once after sign-up |
| GET | `/api/profile` | user | — | Returns `{profile}` |
| PATCH | `/api/profile` | user | `{fullName?, phone?, avatarUrl?}` | |

## Shops

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/api/shops` | owner | `{name, slug, description?, address?, latitude, longitude, businessHours?}` | Role must be 'owner'; shop starts `status: 'pending'` |
| GET | `/api/shops/[shopId]` | public | — | Returns `paymentReady: boolean` — hide "Upload & Print" if false |
| PATCH | `/api/shops/[shopId]` | owner | `{name?, description?, address?, logoUrl?, businessHours?}` | |
| GET | `/api/shops/nearby?lat=&lng=&radius=` | public | — | **The map screen's data source.** Returns `{shops: [{id, name, slug, address, logo_url, latitude, longitude, distance_meters, active_order_count, crowd_level}]}`. `crowd_level` is `"low"\|"medium"\|"high"`, computed live. |
| GET | `/api/shops/[shopId]/pricing` | public | — | Returns `{pricing}` — show before checkout |
| PUT | `/api/shops/[shopId]/pricing` | owner | `{colorRatePaise?, bwRatePaise?, stapleRatePaise?, spiralBindingRatePaise?, hardboundRatePaise?, laminationRatePaise?, urgentFeePercent?}` | |

## Payment onboarding (owner sets this up once per shop)

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/api/shops/[shopId]/payment-settings` | owner | `{merchantName, keyId, keySecret, webhookSecret}` | Verifies credentials live against Razorpay before saving. Shop can't receive orders until this returns `status: "active"`. |
| GET | `/api/shops/[shopId]/payment-settings` | owner | — | Returns status only, never secrets |

**Tell the owner to also configure their Razorpay webhook** to
`https://yourdomain.com/api/webhooks/razorpay/{shopId}` — this isn't
triggered from the frontend, it's a one-time Razorpay dashboard setting.

## Document upload

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/api/documents/upload` | student | `multipart/form-data`: `file`, `shopId` | Returns `{document, pageCountIsEstimate}`. `pageCountIsEstimate: true` for DOCX — show "~N pages" in the UI, not exact. Supported: PDF, PNG, JPG, DOCX, PPTX. Max 50MB. |
| GET | `/api/documents/[documentId]/download-url` | uploader or shop | — | Signed URL, 5 min expiry — for preview/download, not needed by the ordering flow itself |

## Ordering & payment

Checkout flow, in order:

1. `POST /api/orders` → get `razorpayOrderId` + `razorpayKeyId`
2. Open Razorpay Checkout **client-side** with those two values
3. On success, `POST /api/payments/verify` for immediate UI feedback
4. Order is now `accepted` — start polling/subscribing to order status

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/api/orders` | student | `{shopId, documentId, printOptions: {color: "color"\|"bw", sides: "single"\|"double", copies, pageRangeStart?, pageRangeEnd?, paperSize?, binding?, lamination?, urgent?, specialInstructions?}}` | Price is computed server-side — never send an amount. Returns `{orderId, razorpayOrderId, razorpayKeyId, amountPaise, priceBreakdown}` |
| POST | `/api/payments/verify` | student | `{orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature}` | Pass exactly what Razorpay Checkout's success callback gives you |
| GET | `/api/orders/[orderId]` | student or shop | — | Full order detail — powers both the customer tracking screen and staff detail view |

**Order status values:** `pending_payment → accepted → printing → ready → completed`, with `cancelled`/`failed` as terminal off-ramps. Never write status directly from the frontend except via the staff-only route below.

## Staff dashboard (order queue + status)

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| GET | `/api/shops/[shopId]/orders/queue` | owner or staff | — | Returns `{queue: {accepted: [...], printing: [...], ready: [...]}}` — the kanban columns |
| PATCH | `/api/orders/[orderId]/status` | owner or staff | `{status: "printing"\|"ready"\|"completed"\|"cancelled", note?}` | **This is every dashboard button.** "Start Printing" → `printing` (also queues a real print job for the agent). "Mark Ready" → `ready` (generates the pickup code, shown in the response as `order.pickup_code`). "Mark Picked Up" → `completed`. |
| POST | `/api/orders/pickup/verify` | owner or staff | `{qrPayload}` OR `{orderId, pickupCode}` | Scan or manual-entry pickup confirmation. Prefer this over the generic status route for pickup specifically — it validates the code matches. |

## Notifications

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| GET | `/api/notifications?limit=30&unreadOnly=true` | user | — | Initial list load |
| PATCH | `/api/notifications` | user | `{notificationIds: [...]}` | Marks read |

**For live push, don't poll — subscribe to Realtime directly:**
```js
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => { /* new notification arrived */ })
  .subscribe();
```
Same pattern works for live order status on the staff dashboard — subscribe
to `orders` filtered by `shop_id=eq.<id>` instead of polling the queue route.

## Refunds & disputes

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/api/orders/[orderId]/refund` | owner or staff | `{amountPaise?, reason?}` | Omit `amountPaise` for full refund of whatever's unrefunded |
| POST | `/api/orders/[orderId]/dispute` | student | `{reason}` (min 10 chars) | Only allowed once order is `ready` or `completed` |
| GET | `/api/shops/[shopId]/disputes?status=open` | owner or staff | — | |
| POST | `/api/disputes/[disputeId]/resolve` | owner or staff | `{action: "refund"\|"reject", amountPaise?, note?}` | |

## Staff management (owner only)

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| GET | `/api/shops/[shopId]/staff` | owner | — | |
| POST | `/api/shops/[shopId]/staff` | owner | `{displayName, phone, role: "manager"\|"printer_operator"\|"cashier", pin}` (4-6 digit pin) | |
| PATCH | `/api/shops/[shopId]/staff/[staffId]` | owner | `{role?, active?, newPin?, displayName?}` | Setting `active: false` or `newPin` invalidates existing sessions immediately |
| DELETE | `/api/shops/[shopId]/staff/[staffId]` | owner | — | Soft-delete |
| POST | `/api/auth/staff-login` | none (public) | `{shopId, phone, pin}` | Returns `{token, role, expiresIn: "12h"}` — this `token` is the staff bearer token for every other request during the shift |

## Print agents (owner only)

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| GET | `/api/shops/[shopId]/agents` | owner | — | |
| POST | `/api/shops/[shopId]/agents` | owner | `{name}` | Returns the plaintext agent key **once** — show it in a "copy this now, it won't be shown again" modal |
| DELETE | `/api/shops/[shopId]/agents/[agentId]` | owner | — | Revokes immediately |

(The agent itself — `printq-print-agent` — is a separate background service, not a frontend concern. Its endpoints under `/api/agent/*` are called by that service, not the UI.)

## Analytics (owner dashboard)

All owner or staff. All accept `?days=N` where noted (defaults shown).

| Method | Path | Returns |
|---|---|---|
| GET | `/api/shops/[shopId]/analytics/overview` | Today's counts + revenue — the summary cards at the top of the dashboard |
| GET | `/api/shops/[shopId]/analytics/revenue?days=30` | `{revenue: [{day, revenue_paise, order_count}]}` — feed straight into a line chart |
| GET | `/api/shops/[shopId]/analytics/peak-hours?days=30` | `{peakHours: [{hour_of_day, order_count}]}` — bar chart, 24 buckets |
| GET | `/api/shops/[shopId]/analytics/popular-services?days=90` | Counts by color/bw, sides, binding type, lamination, urgent |
| GET | `/api/shops/[shopId]/analytics/repeat-customers?minOrders=2&limit=20` | `{repeatCustomers: [{student_id, full_name, order_count, total_spent_paise, last_order_at}]}` |

## Error shape

Every error response is `{error: string, details?: object}`. HTTP status
codes are meaningful — `401` (not authenticated), `403` (authenticated but
not allowed), `404`, `409` (conflict, e.g. invalid state transition), `422`
(valid request, business-rule rejection), `429` (rate limited), `500`. Show
`error` to the user for 4xx; treat 5xx as "something went wrong, try again."

## What's NOT a frontend concern

- `/api/webhooks/*` — Razorpay calls these directly, configured in Razorpay's dashboard
- `/api/cron/settle-commissions` — triggered by Vercel Cron, not the UI
- `/api/agent/*` — called by the print-agent background service, not the browser
