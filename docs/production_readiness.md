# Production Readiness & Security Operations Playbook — YourPrinter

This document outlines the architecture, security hardening, database backup procedures, performance optimizations, and Vercel deployment checklist for **YourPrinter**.

---

## 🔒 1. Security Architecture & Hardening

### A. Authentication & Role-Based Access Control (RBAC)
- **Supabase Auth Integration**: All user sessions are tokenized using `@supabase/ssr` cookies.
- **Middleware Route Protection** ([src/middleware.ts](file:///d:/Programs/YourPrinter/src/middleware.ts)):
  - `/customer/*` -> Requires `customer` or `admin` role.
  - `/shop/*` -> Requires `shop_owner`, `shop_staff`, or `admin` role.
  - `/admin/*` -> Requires `admin` role.

### B. Security HTTP Headers
Configured in [next.config.ts](file:///d:/Programs/YourPrinter/next.config.ts):
- `Strict-Transport-Security`: HSTS enforced (`max-age=63072000; includeSubDomains; preload`).
- `X-Frame-Options`: Set to `DENY` to mitigate Clickjacking attacks.
- `X-Content-Type-Options`: Set to `nosniff` to prevent MIME-sniffing.
- `Referrer-Policy`: Set to `strict-origin-when-cross-origin`.

### C. Rate Limiting & Input Validation
- Upstash Redis Rate Limiter ([src/lib/rate-limit.ts](file:///d:/Programs/YourPrinter/src/lib/rate-limit.ts)) caps API request bursts.
- Cryptographic Razorpay Webhook verification ([src/features/billing/webhook-verifier.ts](file:///d:/Programs/YourPrinter/src/features/billing/webhook-verifier.ts)) via HMAC-SHA256.
- Zod schema validation for all API payloads and environment variables ([src/lib/env.ts](file:///d:/Programs/YourPrinter/src/lib/env.ts)).

---

## 🗄 2. Database Indexing & Backup Strategy

### PostgreSQL (Supabase + Drizzle ORM)
- **Primary & Foreign Key Indexing**: Indexes configured on `users.id`, `shops.id`, `orders.shop_id`, `orders.user_id`, and `documents.order_id`.
- **Row Level Security (RLS)**: Enforced via `drizzle/rls_policies.sql`.
- **Automated Backup Policy**:
  - Point-In-Time Recovery (PITR) enabled on Supabase PostgreSQL (7-day physical WAL archives).
  - Nightly logical database dumps backed up to isolated AWS S3 storage buckets.

---

## ⚡ 3. Performance & Monitoring

- **Health Check API**: Live system status at `/api/health`.
- **Sentry Integration**: Centralized telemetry logger ([src/lib/monitoring.ts](file:///d:/Programs/YourPrinter/src/lib/monitoring.ts)).
- **Static Page Optimization**: Next.js 15 App Router compiles 40 routes into static prerendered HTML and dynamic edge server functions.

---

## 🚀 4. Deployment Checklist

1. **Environment Variables**: Configure environment keys in Vercel settings (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_SECRET`, `AWS_S3_BUCKET`).
2. **Build Verification**: Run `npm run build` locally prior to production tag creation.
3. **Domain & SSL**: Attach custom domain with HTTPS TLS 1.3 certificate.
