import React from "react";
import SettingsClient from "@/components/shop/SettingsClient";

export const metadata = {
  title: "Settings | YourPrinter Shop",
  description: "Manage your shop details",
};

import { createClient } from "@/lib/supabase/server";

import { redirect } from "next/navigation";

export default async function ShopSettingsPage() {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  const { data: shop } = await supabaseAuth.from('shops').select('id').eq('owner_id', user.id).single();
  if (!shop) {
    redirect("/auth/register-shop");
  }
  
  const shopId = shop.id;

  return <SettingsClient shopId={shopId} />;
}
