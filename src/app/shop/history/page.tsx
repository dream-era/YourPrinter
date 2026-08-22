import React from "react";
import { createClient } from "@/lib/supabase/server";
import ShopHistoryClient from "@/components/shop/ShopHistoryClient";

export const metadata = {
  title: "Order History | YourPrinter Shop",
  description: "View and filter all print orders",
};

import { redirect } from "next/navigation";

export default async function ShopHistoryPage() {
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
  
  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC]">
      <ShopHistoryClient shopId={shopId} />
    </div>
  );
}
