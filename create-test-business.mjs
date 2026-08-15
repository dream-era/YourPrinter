import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const email = 'test_business_owner@example.com';
  const password = 'Password123!';
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error("Error creating user:", error);
    if (error.message.includes("already exists")) {
       console.log("User already exists, proceeding to login...");
    } else {
       process.exit(1);
    }
  } else {
    const user = data.user;
    console.log("Created user:", user.id);
    
    // Create Profile
    await supabase.from("profiles").insert({
      id: user.id,
      role: 'owner',
      full_name: 'Test Business Owner',
      phone: '9876543210'
    });

    // Create Shop
    await supabase.from("shops").insert({
      owner_id: user.id,
      name: 'Test Print Shop',
      slug: 'test-print-shop',
      address: '123 Test Ave, Tech City',
      latitude: 0,
      longitude: 0,
      contact_email: email,
      contact_phone: '9876543210'
    });
    console.log("Seeded profile and shop!");
  }
}

main();
