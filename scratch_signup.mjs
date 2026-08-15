import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabaseAuth = createClient(url, anonKey);
  const supabaseService = createClient(url, serviceKey);

  console.log("1. Signing up user...");
  const email = `testbiz_${Date.now()}@testmail.com`;
  
  const { data: authData, error: authErr } = await supabaseAuth.auth.signUp({
    email,
    password: "Password123!",
    options: {
      data: {
        business_name: "Automator Shop",
        full_name: "Auto Bot",
        city: "Mumbai",
        role: "owner"
      }
    }
  });

  if (authErr) {
    console.error("Auth Error:", authErr.message);
    return;
  }
  
  const userId = authData.user.id;
  console.log("User created! ID:", userId);

  console.log("2. Inserting into profiles...");
  const { error: profErr } = await supabaseService.from("profiles").insert({
    id: userId,
    role: "owner",
    full_name: "Auto Bot",
    phone: "9876543210"
  });

  if (profErr) {
    console.error("Profile Error:", profErr.message);
    return;
  }
  console.log("Profile created!");

  console.log("3. Inserting into shops...");
  const { error: shopErr } = await supabaseService.from("shops").insert({
    owner_id: userId,
    name: "Automator Shop",
    slug: `automator-shop-${Date.now()}`,
    address: "Mumbai",
    latitude: 19.076,
    longitude: 72.877
  });

  if (shopErr) {
    console.error("Shop Error:", shopErr.message);
    return;
  }
  console.log("Shop created successfully!");
  console.log("--- REGISTRATION TEST COMPLETE ---");
}

run();
