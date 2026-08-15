/**
 * scripts/seed.js
 * Populates a local/dev Supabase project with enough data to exercise every
 * screen without manually walking through sign-up → shop creation → staff
 * invite → placing real orders every time you restart dev.
 *
 * Creates:
 *  - 1 shop owner (real Supabase Auth user) + 1 shop, status 'active'
 *  - 1 student (real Supabase Auth user)
 *  - 2 staff members (PIN login, per the staff management module)
 *  - 5 sample orders spanning every status (pending_payment through
 *    completed + one cancelled), with synthetic documents — these bypass
 *    the real upload/Storage flow since seed data doesn't need real files,
 *    just rows that make the UI render realistic states.
 *
 * Does NOT create real payment settings (no real Razorpay test keys are
 * assumed) — the seeded shop's payment_settings stays unconfigured unless
 * you set SEED_RAZORPAY_TEST_KEY_ID / SEED_RAZORPAY_TEST_KEY_SECRET /
 * SEED_RAZORPAY_TEST_WEBHOOK_SECRET env vars, in which case it'll also
 * connect payment settings for real end-to-end checkout testing.
 *
 * Run: node scripts/seed.js
 * Requires the same env vars as the app (NEXT_PUBLIC_SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY, MASTER_ENCRYPTION_KEY if seeding payment settings).
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const OWNER_EMAIL = "owner.seed@printq.test";
const OWNER_PASSWORD = "PrintQSeed123!";
const STUDENT_EMAIL = "student.seed@printq.test";
const STUDENT_PASSWORD = "PrintQSeed123!";

async function upsertAuthUser(email, password) {
  // Supabase admin API has no "create or get" — try create, fall back to
  // looking it up by listing users if it already exists, so this script
  // is safely re-runnable.
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (!error) return data.user;

  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list.users.find((u) => u.email === email);
  if (existing) return existing;
  throw new Error(`Failed to create or find user ${email}: ${error.message}`);
}

async function main() {
  console.log("Seeding YourPrinter dev data...\n");

  // --- Owner + shop ---
  const ownerUser = await upsertAuthUser(OWNER_EMAIL, OWNER_PASSWORD);
  await supabase
    .from("profiles")
    .upsert({ id: ownerUser.id, role: "owner", full_name: "Seed Owner", phone: "9000000001" });

  let { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("slug", "seed-print-shop")
    .single();

  if (!shop) {
    const { data: newShop, error: shopError } = await supabase
      .from("shops")
      .insert({
        owner_id: ownerUser.id,
        name: "Seed Print Shop",
        slug: "seed-print-shop",
        description: "A seeded shop for local development.",
        address: "123 Test Street, Coimbatore",
        latitude: 11.0168,
        longitude: 76.9558,
        status: "active", // active so it shows up in nearby search immediately
      })
      .select("id")
      .single();
    if (shopError) throw shopError;
    shop = newShop;
    await supabase.from("pricing").insert({ shop_id: shop.id });
  }
  console.log(`✓ Shop: ${shop.id} (owner login: ${OWNER_EMAIL} / ${OWNER_PASSWORD})`);

  // --- Optional: real payment settings if test Razorpay keys were provided ---
  const rzpKeyId = process.env.SEED_RAZORPAY_TEST_KEY_ID;
  const rzpKeySecret = process.env.SEED_RAZORPAY_TEST_KEY_SECRET;
  const rzpWebhookSecret = process.env.SEED_RAZORPAY_TEST_WEBHOOK_SECRET;
  if (rzpKeyId && rzpKeySecret && rzpWebhookSecret) {
    const { encryptSecret } = require("../lib/security/encryption");
    const keySecretEnc = encryptSecret(rzpKeySecret);
    const webhookSecretEnc = encryptSecret(rzpWebhookSecret);
    await supabase.from("shop_payment_settings").upsert(
      {
        shop_id: shop.id,
        razorpay_merchant_name: "Seed Print Shop",
        razorpay_key_id: rzpKeyId,
        razorpay_key_secret_enc: keySecretEnc.ciphertext,
        razorpay_key_secret_iv: keySecretEnc.iv,
        razorpay_key_secret_tag: keySecretEnc.authTag,
        razorpay_webhook_secret_enc: webhookSecretEnc.ciphertext,
        razorpay_webhook_secret_iv: webhookSecretEnc.iv,
        razorpay_webhook_secret_tag: webhookSecretEnc.authTag,
        status: "active",
        verified_at: new Date().toISOString(),
      },
      { onConflict: "shop_id" }
    );
    console.log("✓ Payment settings connected with provided test keys — real checkout will work.");
  } else {
    console.log("… Skipping payment settings (no SEED_RAZORPAY_TEST_* env vars) — checkout flow won't work until you connect real test keys via the API.");
  }

  // --- Student ---
  const studentUser = await upsertAuthUser(STUDENT_EMAIL, STUDENT_PASSWORD);
  await supabase
    .from("profiles")
    .upsert({ id: studentUser.id, role: "student", full_name: "Seed Student", phone: "9000000002" });
  console.log(`✓ Student login: ${STUDENT_EMAIL} / ${STUDENT_PASSWORD}`);

  // --- Staff (PIN login) ---
  const { hashPin } = require("../lib/security/pin");
  const staffSeeds = [
    { displayName: "Seed Manager", phone: "9000000003", role: "manager", pin: "1234" },
    { displayName: "Seed Printer Op", phone: "9000000004", role: "printer_operator", pin: "5678" },
  ];
  for (const s of staffSeeds) {
    const { data: existingStaff } = await supabase
      .from("shop_staff")
      .select("id")
      .eq("shop_id", shop.id)
      .eq("phone", s.phone)
      .single();
    if (existingStaff) continue;

    const staffUser = await upsertAuthUser(`staff.${s.phone}@printq.internal`, "unused-" + s.phone);
    await supabase.from("profiles").upsert({ id: staffUser.id, role: "staff", full_name: s.displayName, phone: s.phone });
    await supabase.from("shop_staff").insert({
      shop_id: shop.id,
      user_id: staffUser.id,
      role: s.role,
      display_name: s.displayName,
      phone: s.phone,
      pin_hash: await hashPin(s.pin),
      active: true,
    });
    console.log(`✓ Staff: ${s.displayName} — login with shopId=${shop.id}, phone=${s.phone}, pin=${s.pin}`);
  }

  // --- Synthetic documents + orders across every status ---
  const orderSpecs = [
    { status: "pending_payment" },
    { status: "accepted" },
    { status: "printing" },
    { status: "ready" },
    { status: "completed" },
    { status: "cancelled" },
  ];

  for (const spec of orderSpecs) {
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        uploaded_by: studentUser.id,
        shop_id: shop.id,
        storage_path: `seed/${shop.id}/fake-${spec.status}.pdf`, // no real file behind this — seed only
        original_filename: `assignment-${spec.status}.pdf`,
        mime_type: "application/pdf",
        size_bytes: 123456,
        page_count: 10,
        status: "ready",
      })
      .select("id")
      .single();
    if (docError) throw docError;

    const printOptions = {
      color: "bw",
      sides: "single",
      copies: 1,
      paperSize: "A4",
      binding: "none",
      lamination: false,
      urgent: false,
    };

    const now = new Date().toISOString();
    const orderRow = {
      shop_id: shop.id,
      student_id: studentUser.id,
      document_id: doc.id,
      print_options: printOptions,
      amount_paise: 1000,
      status: spec.status,
    };
    if (spec.status !== "pending_payment") orderRow.accepted_at = now;
    if (["printing", "ready", "completed"].includes(spec.status)) orderRow.printing_started_at = now;
    if (["ready", "completed"].includes(spec.status)) {
      orderRow.ready_at = now;
      orderRow.pickup_code = "123456";
    }
    if (spec.status === "completed") orderRow.completed_at = now;
    if (spec.status === "cancelled") orderRow.cancelled_at = now;

    await supabase.from("orders").insert(orderRow);
  }
  console.log(`✓ Seeded ${orderSpecs.length} orders (one per status: ${orderSpecs.map((s) => s.status).join(", ")})`);

  console.log("\nDone. Shop ID:", shop.id);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
