-- ============================================================================
-- Migration: make webhook secret optional
-- The Payment Setup UI labels "Webhook Secret" as Optional — a shop owner
-- can connect their Key ID + Key Secret and start accepting payments
-- immediately, adding the webhook secret later once they've configured
-- their Razorpay dashboard's webhook. Without it, the automatic webhook
-- confirmation path is disabled for that shop, but checkout still works
-- via the client-side /api/payments/verify path — see the payment-settings
-- route and webhook route for how each handles a missing secret.
-- ============================================================================

alter table shop_payment_settings
  alter column razorpay_webhook_secret_enc drop not null,
  alter column razorpay_webhook_secret_iv drop not null,
  alter column razorpay_webhook_secret_tag drop not null;
