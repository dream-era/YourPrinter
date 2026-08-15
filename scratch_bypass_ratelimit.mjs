import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceKey) {
    console.error("Missing env vars");
    return;
  }

  const supabaseService = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const email = "nbalasurya12345@gmail.com";
  const password = "Password123!";

  console.log(`1. Creating user ${email} via admin API (bypassing rate limits)...`);
  
  const { data: authData, error: authErr } = await supabaseService.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto confirm to skip email
    user_metadata: {
      business_name: "surya",
      full_name: "surya",
      city: "Thiruvarur",
      role: "owner"
    }
  });

  if (authErr) {
    if (authErr.message.includes("already registered")) {
      console.log("User already exists. We will try to fetch the ID instead.");
      // Just list users and find them if they exist
      const { data: usersData } = await supabaseService.auth.admin.listUsers();
      const existingUser = usersData.users.find(u => u.email === email);
      if (existingUser) {
          authData.user = existingUser;
      } else {
          console.error("Could not find existing user.");
          return;
      }
    } else {
      console.error("Auth Error:", authErr.message);
      return;
    }
  }
  
  const userId = authData.user.id;
  console.log("User ID:", userId);

  console.log("2. Upserting into profiles...");
  const { error: profErr } = await supabaseService.from("profiles").upsert({
    id: userId,
    role: "owner",
    full_name: "surya",
    phone: "8778620977"
  });

  if (profErr) {
    console.error("Profile Error:", profErr.message);
  } else {
    console.log("Profile created/updated!");
  }

  console.log("3. Upserting into shops...");
  // Check if shop already exists for this owner
  const { data: existingShop } = await supabaseService.from("shops").select("id").eq("owner_id", userId).single();
  
  if (!existingShop) {
    const { error: shopErr } = await supabaseService.from("shops").insert({
      owner_id: userId,
      name: "surya",
      slug: `surya-shop-${Date.now()}`,
      address: "Thiruvarur",
      latitude: 10.7725,
      longitude: 79.6368
    });

    if (shopErr) {
      console.error("Shop Error:", shopErr.message);
    } else {
      console.log("Shop created successfully!");
    }
  } else {
    console.log("Shop already exists for this owner, skipping insertion.");
  }
  
  console.log("--- REGISTRATION COMPLETE ---");
  console.log("You can now login with:");
  console.log("Email:", email);
  console.log("Password:", password);
}

run();
