import React from "react";
import BusinessDashboardClient from "@/components/business/BusinessDashboardClient";
import { getServiceRoleClient, createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Orders | YourPrinter Shop",
  description: "Manage print shop orders",
};

import { redirect } from "next/navigation";

export default async function BusinessOrdersPage() {
  const supabase = getServiceRoleClient();
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single();
  if (!shop) {
    redirect("/auth/register-shop");
  }
  
  const shopId = shop.id;
  
  const { data: settings } = await supabase
    .from('shop_payment_settings')
    .select('status')
    .eq('shop_id', shopId)
    .single();
    
  const paymentSetupIncomplete = !settings || settings.status !== "active";

  return (
    <div className="flex flex-col h-full">
      {paymentSetupIncomplete && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6 mb-0 rounded shadow-sm shrink-0">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <p className="text-sm text-red-700">
              <strong className="font-bold">🚨 Payment Setup Required: </strong>
              Students cannot place paid orders until your Razorpay account is connected.
            </p>
            <Link href="/shop/settings/payment" className="ml-auto text-sm bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-1.5 px-4 rounded transition-colors">
              Complete Setup
            </Link>
          </div>
        </div>
      )}
      <BusinessDashboardClient shopId={shopId} />
    </div>
  );
}
