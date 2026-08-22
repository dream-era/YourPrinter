import { Metadata } from "next";
import ReportsClient from "@/components/business/ReportsClient";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Reports & Analytics | YourPrinter Shop",
  description: "View shop analytics and financial reports",
};

export default async function ReportsPage() {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  const { data: shop } = await supabaseAuth.from('shops').select('id').eq('owner_id', user.id).single();
  if (!shop) {
    redirect("/auth/register-shop");
  }

  return <ReportsClient shopId={shop.id} />;
}
