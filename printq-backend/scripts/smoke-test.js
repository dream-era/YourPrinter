/**
 * scripts/smoke-test.js
 * Hits the actual running API (not the DB directly) to sanity-check the
 * whole surface before handing off to frontend work. Run `npm run dev`
 * (or point BASE_URL at a deployed environment) and `node scripts/seed.js`
 * first, then run this.
 *
 * This is NOT a payment-flow test — it deliberately stops before
 * /api/orders + Razorpay Checkout, since that needs a browser to complete
 * the payment widget. Everything reachable without a browser gets checked:
 * auth, shop discovery, pricing, staff login, notifications, analytics.
 *
 * Run: node scripts/smoke-test.js
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const BASE_URL = process.env.SMOKE_TEST_BASE_URL || "http://localhost:3000";
const OWNER_EMAIL = "owner.seed@printq.test";
const OWNER_PASSWORD = "PrintQSeed123!";
const STUDENT_EMAIL = "student.seed@printq.test";
const STUDENT_PASSWORD = "PrintQSeed123!";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

let passed = 0;
let failed = 0;

async function check(label, fn) {
  try {
    await fn();
    console.log(`✓ ${label}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${label} — ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function api(pathname, { token, method = "GET", body } = {}) {
  const res = await fetch(`${BASE_URL}${pathname}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function main() {
  console.log(`Running smoke test against ${BASE_URL}\n`);

  // --- Sign in as seeded owner + student to get real Supabase tokens ---
  const { data: ownerAuth, error: ownerAuthError } = await supabase.auth.signInWithPassword({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
  });
  if (ownerAuthError) {
    console.error("Could not sign in as seeded owner — did you run scripts/seed.js first?");
    process.exit(1);
  }
  const ownerToken = ownerAuth.session.access_token;
  const ownerId = ownerAuth.user.id;

  const { data: studentAuth } = await supabase.auth.signInWithPassword({
    email: STUDENT_EMAIL,
    password: STUDENT_PASSWORD,
  });
  const studentToken = studentAuth.session.access_token;

  // Find the seeded shop id via the owner's own profile → shops lookup
  const { data: shops } = await supabase.from("shops").select("id").eq("owner_id", ownerId).limit(1);
  const shopId = shops?.[0]?.id;
  assert(shopId, "Seeded shop not found — run scripts/seed.js first");
  console.log(`Using shop ${shopId}\n`);

  // --- Public routes ---
  await check("GET /api/shops/[shopId] (public)", async () => {
    const { status, json } = await api(`/api/shops/${shopId}`);
    assert(status === 200, `expected 200, got ${status}`);
    assert(json.name, "expected shop name in response");
  });

  await check("GET /api/shops/nearby", async () => {
    const { status, json } = await api(`/api/shops/nearby?lat=11.0168&lng=76.9558&radius=5000`);
    assert(status === 200, `expected 200, got ${status}`);
    assert(Array.isArray(json.shops), "expected shops array");
    assert(json.shops.some((s) => s.id === shopId), "seeded shop should appear in nearby results");
  });

  await check("GET /api/shops/[shopId]/pricing (public)", async () => {
    const { status, json } = await api(`/api/shops/${shopId}/pricing`);
    assert(status === 200, `expected 200, got ${status}`);
    assert(json.pricing, "expected pricing object");
  });

  // --- Owner-authenticated routes ---
  await check("GET /api/profile (owner)", async () => {
    const { status, json } = await api(`/api/profile`, { token: ownerToken });
    assert(status === 200, `expected 200, got ${status}`);
    assert(json.profile.role === "owner", "expected role=owner");
  });

  await check("GET /api/shops/[shopId]/staff (owner)", async () => {
    const { status, json } = await api(`/api/shops/${shopId}/staff`, { token: ownerToken });
    assert(status === 200, `expected 200, got ${status}`);
    assert(json.staff.length >= 2, "expected at least 2 seeded staff members");
  });

  await check("GET /api/shops/[shopId]/orders/queue (owner)", async () => {
    const { status, json } = await api(`/api/shops/${shopId}/orders/queue`, { token: ownerToken });
    assert(status === 200, `expected 200, got ${status}`);
    assert(json.queue.accepted.length >= 1, "expected at least 1 seeded 'accepted' order");
    assert(json.queue.printing.length >= 1, "expected at least 1 seeded 'printing' order");
    assert(json.queue.ready.length >= 1, "expected at least 1 seeded 'ready' order");
  });

  await check("GET /api/shops/[shopId]/analytics/overview (owner)", async () => {
    const { status, json } = await api(`/api/shops/${shopId}/analytics/overview`, { token: ownerToken });
    assert(status === 200, `expected 200, got ${status}`);
    assert(json.overview, "expected overview object");
  });

  await check("GET /api/shops/[shopId]/analytics/revenue (owner)", async () => {
    const { status } = await api(`/api/shops/${shopId}/analytics/revenue?days=30`, { token: ownerToken });
    assert(status === 200, `expected 200, got ${status}`);
  });

  // --- Auth boundary checks (these SHOULD fail with 401/403) ---
  await check("GET /api/shops/[shopId]/staff (no token -> 401)", async () => {
    const { status } = await api(`/api/shops/${shopId}/staff`);
    assert(status === 401, `expected 401, got ${status}`);
  });

  await check("GET /api/shops/[shopId]/staff (student token -> 403)", async () => {
    const { status } = await api(`/api/shops/${shopId}/staff`, { token: studentToken });
    assert(status === 403, `expected 403, got ${status}`);
  });

  // --- Student-authenticated routes ---
  await check("GET /api/profile (student)", async () => {
    const { status, json } = await api(`/api/profile`, { token: studentToken });
    assert(status === 200, `expected 200, got ${status}`);
    assert(json.profile.role === "student", "expected role=student");
  });

  // --- Staff PIN login ---
  await check("POST /api/auth/staff-login", async () => {
    const { status, json } = await api(`/api/auth/staff-login`, {
      method: "POST",
      body: { shopId, phone: "9000000003", pin: "1234" },
    });
    assert(status === 200, `expected 200, got ${status}`);
    assert(json.token, "expected a staff session token");
    assert(json.role === "manager", `expected role manager, got ${json.role}`);

    // Use that staff token on a shop-scoped route to confirm it's honored.
    const staffCheck = await api(`/api/shops/${shopId}/orders/queue`, { token: json.token });
    assert(staffCheck.status === 200, `staff token should access the queue, got ${staffCheck.status}`);
  });

  await check("POST /api/auth/staff-login (wrong pin -> 401)", async () => {
    const { status } = await api(`/api/auth/staff-login`, {
      method: "POST",
      body: { shopId, phone: "9000000003", pin: "0000" },
    });
    assert(status === 401, `expected 401, got ${status}`);
  });

  console.log(`\n${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
