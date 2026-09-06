import React from "react";
import BusinessDashboardClient from "@/components/business/BusinessDashboardClient";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { PaymentStatusWidget } from "@/components/shop/PaymentStatusWidget";

export const metadata = {
  title: "Orders | YourPrinter Shop",
  description: "Manage print shop orders",
};

import { redirect } from "next/navigation";

export default async function BusinessOrdersPage() {
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
  
  const { data: settings } = await supabaseAuth
    .from('shop_payment_settings')
    .select('status, last_verification_error, razorpay_webhook_secret_enc')
    .eq('shop_id', shopId)
    .single();
    
  const status = settings?.status || "not_configured";
  const lastError = settings?.last_verification_error || null;
  const webhookConfigured = !!settings?.razorpay_webhook_secret_enc;

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6">
        <PaymentStatusWidget status={status as any} lastError={lastError} webhookConfigured={webhookConfigured} />
      </div>
      <BusinessDashboardClient shopId={shopId} />
    </div>
  );
}
