import { Metadata } from "next";
import StaffClient from "@/components/business/StaffClient";
import { redirect } from "next/navigation";
import { getServiceRoleClient, createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Employees | YourPrinter Shop",
  description: "Manage your shop staff",
};

export default async function StaffPage() {
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

  return <StaffClient shopId={shop.id} />;
}
