require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function upsertAuthUser(email, password, role, fullName, phone) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, full_name: fullName, phone }
  });
  
  if (!error) return data.user;

  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list.users.find((u) => u.email === email);
  if (existing) return existing;
  throw new Error(`Failed to create or find user ${email}: ${error?.message}`);
}

async function main() {
  console.log("Seeding Phase 2 YourPrinter dev data...\n");

  // --- Create 3 Owners and 3 Shops ---
  const shopsData = [
    { email: "owner1@printq.test", pass: "PrintQSeed123!", name: "Downtown Prints", slug: "downtown-prints", lat: 11.0168, lng: 76.9558 },
    { email: "owner2@printq.test", pass: "PrintQSeed123!", name: "Campus Copy", slug: "campus-copy", lat: 11.0200, lng: 76.9600 },
    { email: "owner3@printq.test", pass: "PrintQSeed123!", name: "QuickPrint Station", slug: "quickprint-station", lat: 11.0100, lng: 76.9500 },
  ];

  const createdShops = [];

  for (const [idx, s] of shopsData.entries()) {
    const owner = await upsertAuthUser(s.email, s.pass, "owner", `Owner ${idx+1}`, `900000010${idx}`);
    await supabase.from("profiles").upsert({ id: owner.id, role: "owner", full_name: `Owner ${idx+1}`, phone: `900000010${idx}` });

    let { data: shop } = await supabase.from("shops").select("id").eq("slug", s.slug).single();
    if (!shop) {
      const { data: newShop, error } = await supabase.from("shops").insert({
        owner_id: owner.id,
        name: s.name,
        slug: s.slug,
        description: `Description for ${s.name}`,
        address: `${idx+1} Main St, Coimbatore`,
        latitude: s.lat,
        longitude: s.lng,
        status: "active"
      }).select("id").single();
      if (error) throw error;
      shop = newShop;
      await supabase.from("pricing").insert({ shop_id: shop.id });
    }
    createdShops.push(shop);
    console.log(`✓ Shop: ${s.name} (${s.email})`);
  }

  // --- Create 25 Students ---
  const createdStudents = [];
  for (let i = 1; i <= 25; i++) {
    const email = `student${i}@printq.test`;
    const student = await upsertAuthUser(email, "PrintQSeed123!", "student", `Student ${i}`, `80000000${i.toString().padStart(2, '0')}`);
    await supabase.from("profiles").upsert({ id: student.id, role: "student", full_name: `Student ${i}`, phone: `80000000${i.toString().padStart(2, '0')}` });
    createdStudents.push(student);
  }
  console.log(`✓ Seeded 25 students`);

  // --- Synthetic documents + 15 orders ---
  const orderSpecs = [
    "pending_payment", "accepted", "printing", "ready", "completed",
    "pending_payment", "accepted", "printing", "ready", "completed",
    "cancelled", "pending_payment", "printing", "ready", "completed"
  ];

  for (let i = 0; i < 15; i++) {
    const specStatus = orderSpecs[i];
    const shop = createdShops[i % 3];
    const student = createdStudents[i % 25];

    const { data: doc, error: docError } = await supabase.from("documents").insert({
      uploaded_by: student.id,
      shop_id: shop.id,
      storage_path: `seed/${shop.id}/fake-${specStatus}-${i}.pdf`,
      original_filename: `assignment-${i}.pdf`,
      mime_type: "application/pdf",
      size_bytes: 123456 + i * 100,
      page_count: 5 + i,
      status: "ready",
    }).select("id").single();

    if (docError) throw docError;

    const now = new Date().toISOString();
    const orderRow = {
      shop_id: shop.id,
      student_id: student.id,
      document_id: doc.id,
      print_options: { color: "bw", sides: "single", copies: 1, paperSize: "A4", binding: "none", lamination: false, urgent: false },
      amount_paise: 1000 + i * 50,
      status: specStatus,
    };

    if (specStatus !== "pending_payment") orderRow.accepted_at = now;
    if (["printing", "ready", "completed"].includes(specStatus)) orderRow.printing_started_at = now;
    if (["ready", "completed"].includes(specStatus)) {
      orderRow.ready_at = now;
      orderRow.pickup_code = `1234${i.toString().padStart(2, '0')}`;
    }
    if (specStatus === "completed") orderRow.completed_at = now;
    if (specStatus === "cancelled") orderRow.cancelled_at = now;

    await supabase.from("orders").insert(orderRow);
  }
  console.log(`✓ Seeded 15 orders across 3 shops`);

  console.log("\nDone seeding Phase 2 data!");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
