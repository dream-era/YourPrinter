import { PaymentSetupForm } from "@/components/shop/PaymentSetupForm";
import { redirect } from "next/navigation";
import { getServiceRoleClient, createClient } from "@/lib/supabase/server";

export default async function PaymentSetupPage() {
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

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 font-sans min-h-screen">
      <div className="mb-10">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Payment Setup</h1>
        <p className="text-slate-500 font-medium text-[15px]">
          Connect your Razorpay Business Account to securely receive payments from students.
        </p>
      </div>

      <PaymentSetupForm shopId={shopId} />
    </div>
  );
}
