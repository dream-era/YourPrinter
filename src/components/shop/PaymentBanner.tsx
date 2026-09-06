"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function PaymentBanner() {
  const [needsSetup, setNeedsSetup] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function checkStatus() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).single();
        if (!shop) return;
        
        if (mounted) setShopId(shop.id);

        const res = await fetch(`/api/shops/${shop.id}/payment-settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.status !== "active") {
            if (mounted) setNeedsSetup(true);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    checkStatus();
    return () => { mounted = false; };
  }, []);

  if (!needsSetup) return null;

  return (
    <div className="bg-rose-500 text-white px-4 py-3 flex flex-col md:flex-row items-center justify-center gap-3 w-full shadow-sm z-50 shrink-0">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span className="font-semibold text-sm md:text-base">Payment Setup Required</span>
      </div>
      <p className="text-rose-100 text-sm hidden md:block">Your shop cannot accept orders until you connect your Razorpay account.</p>
      <Link href="/shop/settings/payment" className="flex items-center gap-1 bg-white text-rose-600 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-rose-50 transition shadow-sm">
        Connect Now <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
