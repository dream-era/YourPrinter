# YourPrinter Backend — Per-Shop Razorpay Payment Layer

This package is a **drop-in extension** to your existing Phase 0 backend. It
replaces the platform-level Razorpay Route (auto-split) model with **each
shop connecting its own Razorpay account**, per the updated PRD. Storage
stays on **Supabase Storage** — that part of Phase 0 is unchanged.

## What changed vs. the old Route model

| | Old (Route) | New (this package) |
|---|---|---|
| Razorpay account | One platform account | One account per shop |
| Split | Automatic at settlement via Route | Manual — commission tracked in `platform_commission_ledger`, billed to shops periodically |
| Secrets | One platform key pair | Encrypted per-shop key pair + webhook secret in `shop_payment_settings` |
| Webhook URL | One global endpoint | `/api/webhooks/razorpay/[shopId]` — each shop configures its own Razorpay dashboard to point here |
| Order creation | Platform Razorpay client | `getShopRazorpayClient(shopId)` — scoped per shop |

## Files in this package

```
supabase/migrations/
  0007_shop_payment_settings.sql   -- new tables: shop_payment_settings, platform_commission_ledger
  0008_orders_payment_columns.sql  -- aligns orders table columns/status enum

lib/security/encryption.ts         -- AES-256-GCM encrypt/decrypt + HMAC verify
lib/supabase/server.ts             -- service-role client (skip if you already have one)
lib/razorpay/client.ts             -- per-shop Razorpay client factory
lib/pricing/calculate.ts           -- server-side price calculation
lib/validations/payment.ts         -- zod schemas
lib/auth/require-shop-owner.ts     -- ownership check (merge with existing auth if present)
lib/auth/get-authenticated-user.ts -- generic auth check

app/api/shops/[shopId]/payment-settings/route.ts  -- connect + verify a shop's Razorpay account
app/api/orders/route.ts                            -- create order (price calc + Razorpay order)
app/api/payments/verify/route.ts                   -- client-side fast-path payment confirmation
app/api/webhooks/razorpay/[shopId]/route.ts        -- authoritative webhook handler
```

## Required environment variables

```bash
# Already in your Phase 0 project:
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# New — generate with: openssl rand -base64 32
MASTER_ENCRYPTION_KEY=...

# New — staff PIN-session tokens, generate with: openssl rand -base64 32
# Must be a DIFFERENT value from MASTER_ENCRYPTION_KEY.
STAFF_JWT_SECRET=...

# New — YourPrinter's OWN Razorpay account (separate from every shop's), used
# only to collect commission via the settlement job.
PLATFORM_RAZORPAY_KEY_ID=...
PLATFORM_RAZORPAY_KEY_SECRET=...
PLATFORM_RAZORPAY_WEBHOOK_SECRET=...

# New — shared secret the settlement cron job checks for, so the endpoint
# can't be triggered by an arbitrary request. Generate with: openssl rand -hex 32
CRON_SECRET=...

# New — email notifications via Resend (https://resend.com). Optional: if
# unset, email sending is silently skipped and everything else still works.
RESEND_API_KEY=...
EMAIL_FROM="YourPrinter <notifications@yourdomain.com>"

# New — Upstash Redis, for real (persistent, shared) staff-login rate
# limiting. Get these from your Upstash dashboard.
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# New — SMS via Twilio. Optional, same fail-open behavior as email: if
# unset, SMS sending is silently skipped.
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER="+1..."
```

`MASTER_ENCRYPTION_KEY` must be set in Vercel's environment variables
(marked sensitive), different per environment (dev/staging/prod), and never
committed. There is no key rotation built in — if you rotate it, every row
in `shop_payment_settings` must be re-encrypted in the same operation.

## Integration steps

1. **Run migrations** `0007` and `0008` against your Supabase project.
   Review `0008` carefully if your existing `orders` table already has a
   `status` CHECK constraint with different values from the old Route flow.

2. **Merge auth helpers.** `require-shop-owner.ts` and
   `get-authenticated-user.ts` are stubs — if Phase 0 already has equivalent
   helpers (per your "shop_id cross-tenant checks returning 403 on mismatch"
   convention), use those instead and delete these.

3. **Shop owner onboarding UI.** Build a settings page where an owner enters
   their Razorpay Merchant Name, Key ID, Key Secret, and Webhook Secret,
   which POSTs to `/api/shops/[shopId]/payment-settings`. Until that route
   returns `status: "active"`, the shop cannot receive orders — enforce this
   in the shop landing page (hide/disable "Upload & Print" if payment
   settings aren't active).

4. **Tell each shop owner to configure their Razorpay webhook.** In their
   Razorpay dashboard → Webhooks, they add:
   `https://yourdomain.com/api/webhooks/razorpay/{their-shop-id}`
   subscribed to `payment.captured` and `payment.failed`, using the same
   webhook secret they entered in step 3.

5. **Client-side checkout.** After calling `POST /api/orders`, use the
   returned `razorpayOrderId` and `razorpayKeyId` to open Razorpay's
   Checkout widget client-side. On success, call
   `POST /api/payments/verify` for immediate UI feedback — but remember the
   webhook is the source of truth if that call never fires.

6. **Commission settlement.** `platform_commission_ledger` accumulates what
   each shop owes the platform per order. This package does not include a
   billing/settlement job — you'll need to decide the cadence (e.g. weekly
   invoice, or a Razorpay Payment Link sent to each shop) and mark rows
   `settled = true` once collected.

## Shops, documents, order lifecycle & notifications (added in this batch)

These modules are genuinely new — run `0009_core_schema.sql` **before**
`0007`/`0008` from the payment layer, since those assume `shops` and `orders`
already exist.

```
supabase/migrations/0009_core_schema.sql   -- profiles, shops (PostGIS), shop_staff,
                                               pricing, documents, orders, order_status_history,
                                               notifications, RLS, shops_nearby() function

lib/orders/state-machine.ts        -- the ONLY place that decides which status
                                       transitions are legal (pending_payment -> accepted
                                       -> printing -> ready -> completed, + cancelled/failed)
lib/orders/pickup-code.ts          -- 6-digit code + QR payload encode/decode
lib/documents/pageCount.ts         -- PDF (exact) / images (=1) / PPTX (exact, slide count)
                                       / DOCX (ESTIMATE — word count / 500)
lib/notifications/create.ts        -- inserts into `notifications`; Realtime subscribers
                                       (student on their own row, staff via notifyShopTeam)
                                       pick it up client-side, no extra backend needed
lib/auth/require-shop-access.ts    -- like require-shop-owner but also allows shop_staff

app/api/shops/route.ts                          -- POST create shop (role must be 'owner')
app/api/shops/[shopId]/route.ts                 -- GET details, PATCH (owner)
app/api/shops/nearby/route.ts                   -- GET ?lat&lng&radius — the map screen's data source
app/api/shops/[shopId]/pricing/route.ts         -- GET (public), PUT (owner)
app/api/documents/upload/route.ts               -- POST multipart upload + page-count extraction
app/api/documents/[documentId]/download-url/route.ts -- signed URL for staff/print-agent to fetch the file
app/api/shops/[shopId]/orders/queue/route.ts    -- GET staff dashboard queue, grouped by status
app/api/orders/[orderId]/route.ts               -- GET single order (student or shop access)
app/api/orders/[orderId]/status/route.ts        -- PATCH — the "Start Printing / Mark Ready / Mark Picked Up" buttons
app/api/orders/pickup/verify/route.ts           -- POST — scan QR or type code to complete pickup
app/api/notifications/route.ts                  -- GET list, PATCH mark-read
```

### How the pieces connect

- **Crowd level** on the map isn't a separate cron job — `shops_nearby()`
  computes it live from `count(orders where status in (accepted, printing))`
  per shop, so it's always accurate to the second.
- **"Start Printing" button** → `PATCH /api/orders/[id]/status {status: "printing"}`.
  This is the same event your print-agent architecture (discussed earlier)
  should listen for if you want the agent to fire automatically instead of
  the human clicking print manually on their OS.
- **Pickup code** is generated the moment an order moves to `ready` and
  shown to the student via the `order_ready` notification body. Render it as
  a QR using `buildQrPayload(orderId, pickupCode)` — any QR library (e.g.
  `qrcode` npm package) on the frontend can encode that string directly.
- **DOCX page counts are estimates**, not exact — surface this in the UI
  ("~12 pages, confirmed by shop on printing") if your pricing model can't
  tolerate the imprecision. PDF and PPTX are exact.

### Still stubbed / not built yet

- `handle_new_user()` trigger for auto-creating `profiles` rows on sign-up
  is written but commented out in `0009_core_schema.sql` — enable it or
  wire profile creation into your existing auth sign-up route, but not both.
- Staff invite/PIN-login flow (the `shop_staff` table exists and is checked
  by every access-control route, but nothing populates it yet — you'll add
  rows manually or build the invite flow next).

## Auth/profiles & staff management (added in this batch)

```
supabase/migrations/0010_staff_management.sql  -- adds pin_hash, display_name, phone,
                                                    invited_by, last_login_at to shop_staff

lib/security/pin.ts            -- bcrypt hash/verify for 4-6 digit staff PINs
lib/auth/staff-jwt.ts          -- signs/verifies a 12h staff PIN-session JWT
lib/auth/require-shop-access.ts -- UPDATED: now tries Supabase Auth first, then
                                    falls back to a staff JWT — no other route changed

app/api/profile/route.ts                          -- GET/POST/PATCH own profile row
app/api/shops/[shopId]/staff/route.ts              -- GET list, POST invite (owner only)
app/api/shops/[shopId]/staff/[staffId]/route.ts    -- PATCH (role/active/reset PIN), DELETE (soft)
app/api/auth/staff-login/route.ts                  -- POST { shopId, phone, pin } -> staff JWT
```

### The auth model, end to end

- **Students & owners** use Supabase Auth directly from the frontend
  (`supabase.auth.signUp` / `signInWithPassword` / `resetPasswordForEmail`)
  — no custom backend route needed for that part. Right after sign-up
  succeeds client-side, call `POST /api/profile` once to create the
  `profiles` row with their role.
- **Staff** never get an email/password login. The owner invites them via
  `POST /api/shops/[shopId]/staff` (name, phone, role, initial PIN), which
  creates a synthetic Supabase Auth user behind the scenes purely so
  `profiles.id` / `changed_by` / `assigned_staff_id` foreign keys stay
  consistent — nobody ever authenticates with that synthetic email.
  Staff log in for real via `POST /api/auth/staff-login` with
  `{shopId, phone, pin}`, getting back a 12-hour JWT.
- **Every shop-scoped route already works with both.** `requireShopAccess`
  was updated to accept either token type, so `orders/[id]/status`,
  `orders/pickup/verify`, and the queue route need no changes — they just
  work whether the `Authorization: Bearer` header holds a Supabase session
  or a staff PIN session.
- **Reset PIN / disable staff take effect immediately** — `requireShopAccess`
  re-checks `shop_staff.active` on every request rather than trusting the
  JWT blindly, so revoking access doesn't wait for the token to expire.

### Known gap here

The staff-login rate limiter is in-memory (documented in the route's doc
comment) — fine for a first deploy, but swap it for Upstash Redis (already
in your stack per the PRD) before you have real counter traffic, since
in-memory state resets on every serverless cold start / doesn't share
across instances.

## Refunds, disputes & commission settlement (added in this batch)

These close out the two gaps flagged at the end of the payment-layer README.

```
supabase/migrations/0011_refunds_disputes.sql   -- refunds, disputes tables + orders.refund_status
supabase/migrations/0012_settlement_batches.sql -- settlement_batches table

lib/razorpay/refund.ts             -- issues a refund via the SHOP'S OWN account (same
                                       account that received the payment)
lib/razorpay/platform-client.ts    -- YourPrinter's OWN separate Razorpay account, used only
                                       to collect commission

app/api/orders/[orderId]/refund/route.ts        -- shop-initiated full/partial refund
app/api/orders/[orderId]/dispute/route.ts        -- student raises a dispute (order must be ready/completed)
app/api/shops/[shopId]/disputes/route.ts         -- owner/staff view open disputes
app/api/disputes/[disputeId]/resolve/route.ts    -- owner/staff approves (refund) or rejects
app/api/cron/settle-commissions/route.ts         -- weekly job: invoices each shop's unsettled commission
app/api/webhooks/razorpay-platform/route.ts      -- marks a settlement paid once the shop pays the invoice
vercel.json.snippet                              -- cron schedule to merge into your vercel.json
```

### How settlement actually works

Since per-shop accounts mean there's no more automatic Route split, YourPrinter
needs its own way to collect commission:

1. Every paid order writes a row to `platform_commission_ledger` (this
   already happened in the payment-layer package — `orders/route.ts`
   inserts it at order-creation time).
2. Weekly, `settle-commissions` sums each shop's unsettled rows and creates
   a **Razorpay Payment Link on YourPrinter's own account** (`PLATFORM_RAZORPAY_*`
   env vars — genuinely separate credentials from any shop's) for that
   total, and marks those ledger rows with a `settlement_batch_id`.
3. The shop owner pays the link. Razorpay fires `payment_link.paid` to
   `/api/webhooks/razorpay-platform`, which marks the batch (and its ledger
   rows) `settled = true`.
4. `settlement_batches` gives you (and the shop owner, via RLS) a full
   history of what was invoiced and when it was paid.

This is invoicing, not automatic deduction — Razorpay's per-shop model
doesn't give you a way to pull money out of a shop's account automatically.
If that friction becomes a problem at scale, the alternative is Razorpay
Route after all (shops would need to onboard as "linked accounts" under
your platform account instead of fully independent accounts) — worth
revisiting only if manual settlement collection becomes painful.

### Refunds vs. disputes

- **Direct refund** (`orders/[id]/refund`): shop staff decide unilaterally
  to refund — no customer action required.
- **Dispute** (`orders/[id]/dispute` → `disputes/[id]/resolve`): customer
  flags a problem first; shop approves (which calls the same refund logic)
  or rejects with a note. Both paths write to the same `refunds` table, so
  your analytics don't need to know which route a refund came from.
- A refund force-cancels the order unless it's already `completed` (picked
  up) — you can't "un-print" something, so a post-pickup refund just
  refunds the money without changing order status.

## Print agent backend (added in this batch)

The API side of unattended printing — see the separate `printq-print-agent`
package for the actual background service that runs on a shop's PC.

```
supabase/migrations/0013_print_agents.sql   -- shop_agents (device credentials), print_jobs

lib/security/agent-key.ts          -- generates/hashes the pq_agent_<id>.<secret> device key
lib/auth/require-agent.ts          -- verifies the X-Agent-Key header

app/api/shops/[shopId]/agents/route.ts             -- POST register (key shown ONCE), GET list
app/api/shops/[shopId]/agents/[agentId]/route.ts   -- DELETE revoke
app/api/agent/print-jobs/pending/route.ts          -- GET — agent polls this
app/api/agent/print-jobs/[jobId]/ack/route.ts      -- POST — agent claims before printing
app/api/agent/print-jobs/[jobId]/complete/route.ts -- POST — agent reports success/failure, auto-retries up to 3x
app/api/agent/documents/[documentId]/download-url/route.ts -- agent-scoped signed URL
```

Wired into the existing order flow: `PATCH orders/[id]/status` now inserts
a `print_jobs` row whenever staff transitions an order to `printing` — no
change needed to that route's request/response shape, it just does one
more thing.

### Why a separate device credential instead of reusing staff auth

An agent is a machine sitting on a shop PC, not a person on a shift — it
shouldn't expire every 12 hours like a staff PIN session, and losing/
reissuing it (device replaced, PC wiped) shouldn't be tangled up with
staff turnover. `shop_agents` keys are long-lived and revoked explicitly
(`DELETE .../agents/[id]`), independent of everything in the staff module.

### Known gap here

Non-PDF documents (DOCX/PPTX/images) are rejected by the agent with a
clear error rather than mis-printed — see the print-agent README's
"Current limitations" section. Auto-converting those to PDF first needs a
rendering engine (e.g. headless LibreOffice) that isn't wired in yet.

## Analytics & email notifications (added in this batch)

```
supabase/migrations/0014_analytics_functions.sql  -- 5 read-only SQL functions, no new tables

app/api/shops/[shopId]/analytics/overview/route.ts           -- today's counts + revenue (dashboard summary cards)
app/api/shops/[shopId]/analytics/revenue/route.ts             -- daily revenue timeseries
app/api/shops/[shopId]/analytics/peak-hours/route.ts           -- order volume by hour-of-day
app/api/shops/[shopId]/analytics/popular-services/route.ts     -- color/bw, binding, lamination, urgent breakdown
app/api/shops/[shopId]/analytics/repeat-customers/route.ts     -- students with 2+ orders, ranked by count/spend

lib/notifications/email.ts   -- sends via Resend's HTTP API (no SDK dep — one fetch call)
lib/notifications/create.ts  -- UPDATED: now also emails for new_order/order_ready/
                                 order_completed/order_cancelled (not every internal status
                                 blip); automatically skips synthetic staff addresses
```

All five analytics functions are plain SQL (`stable`, read-only) rather
than TypeScript aggregation — Postgres does this kind of `GROUP BY`/`FILTER`
work far more efficiently than pulling rows into the API layer and summing
in JS, and it's the same pattern already established by `shops_nearby()`.

Email is intentionally opt-in at the infra level: if `RESEND_API_KEY` isn't
set, `sendEmail()` logs a warning and no-ops rather than throwing — so
deploying without email configured doesn't break order flow, it just means
students only get in-app/Realtime notifications until you add a key.

## Dev scripts (added in this batch)

```
scripts/seed.js        -- populates a dev Supabase project: 1 owner, 1 shop (active),
                           1 student, 2 staff (PIN login), and 5 orders spanning every
                           status, so the UI has real states to render on day one
scripts/smoke-test.js  -- hits the actual running API (not the DB) across ~15 checks:
                           public routes, owner routes, student routes, staff PIN login,
                           and auth-boundary checks (confirms a student token correctly
                           gets 403'd off an owner-only route, etc.)
```

Run in order, against a running dev server:
```bash
node scripts/seed.js
npm run dev   # in another terminal
node scripts/smoke-test.js
```

Both are safely re-runnable — `seed.js` looks up existing seeded users/shop
by email/slug before creating anything new, so running it twice doesn't
duplicate data.

**What smoke-test.js deliberately doesn't cover:** the actual payment flow
(`POST /api/orders` → Razorpay Checkout → `/api/payments/verify`) needs a
real browser to complete Razorpay's widget, so it's out of scope for a
script. If you want to test that path, set `SEED_RAZORPAY_TEST_KEY_ID` /
`SEED_RAZORPAY_TEST_KEY_SECRET` / `SEED_RAZORPAY_TEST_WEBHOOK_SECRET` env
vars before running `seed.js` (uses Razorpay's test-mode keys) — it'll
connect real payment settings on the seeded shop, and you can complete
checkout manually through the UI once the frontend exists.

## Known gaps / next steps

- ~~Realtime notifications~~ — built in the shops/orders batch (`lib/notifications/create.ts`, wired into both the webhook and client-verify payment paths).
- ~~Refund flow~~ — built (`lib/razorpay/refund.ts` + the refund/dispute routes).
- ~~QR pickup generation~~ — built (`lib/orders/pickup-code.ts`); render `buildQrPayload()`'s output as a QR on the frontend with any QR library.
- ~~Analytics dashboards~~ — built, see the analytics section above.
- ~~Email notifications~~ — built, see the analytics/email section above.
- ~~DOCX/PPTX auto-printing~~ — built via LibreOffice conversion in the print agent.
- ~~Staff-login rate limiting~~ — now Upstash Redis-backed (`lib/security/rate-limit.ts`), replacing the earlier in-memory version.
- ~~Windows image auto-printing~~ — closed via LibreOffice conversion (`printq-print-agent/src/convert.js` now covers PNG/JPG too, not just DOCX/PPTX).
- ~~True 24/7 autoprint~~ — built (`lib/orders/auto-advance.ts` + `PATCH /api/shops/[shopId]/autoprint`). An autoprint-enabled shop skips the manual "Start Printing" click entirely — payment confirmation auto-queues the print job.
- ~~SMS notifications~~ — built (`lib/notifications/sms.ts`, via Twilio), deliberately scoped to just `order_ready` — the one notification where a delay genuinely costs the student something. Not applied to every type, to avoid SMS fatigue/cost.

### Two things intentionally left as tradeoffs, not code gaps

- **Automatic commission deduction.** Closing this "for real" means shops
  onboarding as Razorpay Route linked accounts instead of fully independent
  accounts — which is the exact per-shop-account model this whole payment
  layer was built to move away from. Invoicing via `settle-commissions` is
  the correct tradeoff for that architecture, not an unfinished corner of it.
  Revisit only if manual settlement collection becomes genuinely painful
  at scale.
- **`lib/auth/require-shop-owner.ts` and `get-authenticated-user.ts`.**
  These were always flagged as stubs *for your existing Phase 0 auth code*,
  not placeholders I forgot to finish. If Phase 0 already has equivalent
  helpers, use those and delete these — building a "more finished" version
  of a stand-in for code I can't see would just be guessing.
