import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, serviceKey);

  // 1. Find the shop owner user
  const email = "nbalasurya12345@gmail.com";
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const owner = usersData.users.find(u => u.email === email);
  if (!owner) {
    console.error("Owner not found");
    return;
  }

  // 2. Find the shop
  const { data: shop } = await supabase.from("shops").select("id").eq("owner_id", owner.id).single();
  if (!shop) {
    console.error("Shop not found");
    return;
  }
  const shopId = shop.id;

  // 3. Create or find a mock student
  let studentId = "c817e09f-5c93-4107-ae85-f1cbdd45e9b6"; // reuse the first dummy user if we want
  const { data: existingStudent } = await supabase.from("profiles").select("id").eq("id", studentId).single();
  if (!existingStudent) {
    await supabase.from("profiles").insert({
      id: studentId,
      full_name: "Mock Student",
      role: "student",
      phone: "1234567890"
    });
  }

  // 4. Create a mock document
  const { data: doc, error: docErr } = await supabase.from("documents").insert({
    shop_id: shopId,
    uploaded_by: studentId,
    original_filename: "Physics_Assignment_Final.pdf",
    storage_path: "mock_path",
    mime_type: "application/pdf",
    size_bytes: 1024 * 1024 * 2,
    page_count: 15,
    status: "ready"
  }).select().single();

  if (docErr) {
    console.error("Error creating document:", docErr.message);
    return;
  }

  // 5. Create a "Pending" mock order
  const { error: order1Err } = await supabase.from("orders").insert({
    shop_id: shopId,
    student_id: studentId,
    document_id: doc.id,
    print_options: {
      colorMode: "bw",
      paperSize: "A4",
      sides: "double",
      binding: "spiral",
      copies: 2
    },
    amount_paise: 15000,
    status: "pending_payment"
  });

  // 6. Create an "Accepted" mock order
  const { error: order2Err } = await supabase.from("orders").insert({
    shop_id: shopId,
    student_id: studentId,
    document_id: doc.id,
    print_options: {
      colorMode: "color",
      paperSize: "A4",
      sides: "single",
      binding: "none",
      copies: 1
    },
    amount_paise: 4500,
    status: "accepted"
  });

  if (order1Err || order2Err) {
    console.error("Error creating orders");
    return;
  }

  console.log("SUCCESS! Mock orders created.");
}

run();
