# Razorpay Payment Settings — Update

Fixes two things: matches the actual UI (Webhook Secret is optional, not
required), and matches the encryption convention already live in your
Vercel deployment (`ENCRYPTION_KEY`, hex, not the original
`MASTER_ENCRYPTION_KEY` base64 version).

## Files here, and what to do with each

```
src/lib/security/encryption.ts   -> REPLACE your existing file at this path
src/lib/razorpay/client.ts       -> REPLACE your existing file at this path
src/app/api/shops/[shopId]/payment-settings/route.ts  -> REPLACE
supabase/migrations/0016_webhook_secret_optional.sql  -> ADD as a new migration, run it
```

## What changed and why

1. **Encryption is now hex, not base64** — matches your `ENCRYPTION_KEY`
   env var and the `openssl rand -hex 32` generation command from your
   error message. If you already generated a key this way, this file will
   work with it immediately — no key regeneration needed, since Antigravity's
   fix already established this convention correctly.

2. **Webhook Secret is now genuinely optional**, not just optional in the
   UI's label while the backend silently required it. A shop owner can
   save Key ID + Key Secret alone and go live immediately. Without a
   webhook secret, that shop's automatic webhook-based order confirmation
   is disabled — but checkout still works, because `/api/payments/verify`
   (the client-side confirmation called right after Razorpay Checkout
   succeeds) doesn't depend on the webhook at all. The response from
   `POST .../payment-settings` includes a `note` field when this applies —
   surface it in the UI as a non-blocking tip, not an error.

3. **Run the migration** (`0016_webhook_secret_optional.sql`) before
   deploying these route changes — the database columns need to allow
   NULL before the code stops requiring them, or you'll get a NOT NULL
   constraint violation on the first save without a webhook secret.

## After deploying

Test the exact flow from your screenshot:
1. Enter Business Name + Key ID + Key Secret only, leave Webhook Secret blank
2. Save — should succeed, `status: "active"`, with the `note` about webhook confirmation being disabled
3. Go back and add a Webhook Secret later — should update the same row, `webhookConfigured: true`
4. Try obviously invalid credentials — should return `422` with `status: "failed"` and the real Razorpay rejection reason, not a generic error

If you still see "ENCRYPTION_KEY is not set" after deploying this, the
env var itself is missing from Vercel (not a code issue) — check Settings
→ Environment Variables for all three environments (Production, Preview,
Development), same as the earlier Vercel build fix.
