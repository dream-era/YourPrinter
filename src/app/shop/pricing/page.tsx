import React from "react";
import PricingClient from "@/components/shop/PricingClient";

export const metadata = {
  title: "Pricing & Services | YourPrinter Shop",
  description: "Manage pricing for every service available in your print shop.",
};

import { createClient } from "@/lib/supabase/server";

import { redirect } from "next/navigation";

export default async function ShopPricingPage() {
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

  return <PricingClient shopId={shopId} />;
}
