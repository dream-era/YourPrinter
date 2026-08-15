"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, FileText, CheckCircle2, Clock, 
  CreditCard, Smartphone, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { calculatePrintCost } from "@/features/documents/pdf-utils";

interface ShopDetails {
  id: string;
  name: string;
  queueStatus: string;
  estimatedWaitMins: number;
}

export default function ReviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Extract query params for state
  const shopId = searchParams.get("shopId") || "";
  const file = searchParams.get("file") || "document.pdf";
  const pages = parseInt(searchParams.get("pages") || "10", 10);
  const copies = parseInt(searchParams.get("copies") || "1", 10);
  const colorMode = (searchParams.get("colorMode") || "bw") as "bw" | "color";
  const duplex = searchParams.get("duplex") === "true";
  const paperSize = (searchParams.get("paperSize") || "A4") as "A4" | "A3" | "A5" | "Letter" | "Legal";

  const [shop, setShop] = useState<ShopDetails | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!shopId) {
      toast.error("No shop selected. Redirecting...");
      router.push("/customer/shops");
      return;
    }

    const fetchShop = async () => {
      try {
        const res = await fetch(`/api/shops/${shopId}`);
        if (!res.ok) throw new Error("Shop not found");
        const data = await res.json();
        setShop(data);
      } catch (e) {
        toast.error("Failed to load shop details.");
      } finally {
        setLoadingShop(false);
      }
    };
    fetchShop();
  }, [shopId, router]);

  // Calculate pricing
  const pricing = calculatePrintCost({
    pageCount: pages,
    copies,
    paperSize,
    colorMode,
    duplex,
  });

  const handleProceedToPay = async () => {
    setProcessing(true);
    try {
      // We pass the configuration to the Payment page, where the order will actually be created before Razorpay checkout!
      
      toast.success("Order confirmed! Redirecting to payment...");
      // Prepare all params to pass to the payment page
      const url = new URLSearchParams({
        shopId,
        file: file,
        pages: pages.toString(),
        colorMode,
        copies: copies.toString(),
        duplex: duplex.toString(),
        binding: "None",
        total: pricing.total.toString(),
      });
      
      // Navigate to Payment step
      router.push(`/customer/payment?${url.toString()}`);

    } catch (e: any) {
      toast.error(e.message || "An error occurred during checkout.");
      setProcessing(false);
    }
  };

  const getQueueColor = (status: string) => {
    if (status?.toLowerCase() === "busy") return "bg-rose-100 text-rose-600";
    if (status?.toLowerCase() === "moderate") return "bg-orange-100 text-orange-600";
    return "bg-emerald-100 text-emerald-600";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-[120px] font-sans">
      
      {/* Header */}
      <header className="bg-white px-4 pt-6 pb-4 flex items-center shadow-sm sticky top-0 z-40 max-w-3xl mx-auto w-full">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition -ml-2"
        >
          <ArrowLeft className="w-6 h-6 text-slate-800" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 ml-2">Review & Pay</h1>
      </header>

      <div className="max-w-3xl mx-auto w-full">
      {/* Stepper */}
      <div className="bg-white px-6 pb-6 pt-2 rounded-b-3xl shadow-sm mb-6 flex justify-between items-center relative">
        <div className="absolute top-1/2 left-10 right-10 h-[2px] bg-slate-100 -z-10 -translate-y-1/2"></div>
        
        <div className="flex flex-col items-center gap-2 bg-white px-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center border-2 border-white shadow-sm text-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-500">Upload</span>
        </div>
        
        <div className="flex flex-col items-center gap-2 bg-white px-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center border-2 border-white shadow-sm text-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-500">Options</span>
        </div>
        
        <div className="flex flex-col items-center gap-2 bg-white px-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center border-2 border-white shadow-sm text-sm">
            3
          </div>
          <span className="text-xs font-bold text-blue-600">Review</span>
        </div>
      </div>

      <div className="px-5 space-y-6">
        
        {/* Order Summary */}
        <section>
          <h2 className="text-[15px] font-bold text-slate-900 mb-3 ml-1">Order Summary</h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex gap-4 items-center pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-slate-900 truncate text-[15px]">{file}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{shop?.name || "Loading shop..."}</p>
              </div>
            </div>
            
            <div className="pt-4 grid grid-cols-2 gap-y-4 gap-x-2">
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Pages</span>
                <span className="font-semibold text-slate-800">{pages} <span className="text-slate-400 text-sm font-normal">× {copies}</span></span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Color Mode</span>
                <span className="font-semibold text-slate-800">{colorMode === "bw" ? "B&W" : "Color"}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Sides</span>
                <span className="font-semibold text-slate-800">{duplex ? "Double-sided" : "Single-sided"}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Paper</span>
                <span className="font-semibold text-slate-800">{paperSize}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Estimated Ready Time */}
        {!loadingShop && shop && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-start gap-3"
          >
            <div className="mt-0.5 shrink-0">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-[15px]">Estimated Ready Time</h3>
              <p className="text-sm text-slate-600 mt-1 leading-snug">
                Ready in approximately <strong className="text-slate-800">{shop.estimatedWaitMins + Math.ceil(pages/10)} mins</strong> after payment based on current queue.
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-white shadow-sm">
                <span className={`w-1.5 h-1.5 rounded-full ${getQueueColor(shop.queueStatus).split(' ')[0]}`}></span>
                <span className="text-slate-700">{shop.queueStatus} Queue</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment Methods */}
        <section>
          <h2 className="text-[15px] font-bold text-slate-900 mb-3 ml-1">Payment Method</h2>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setPaymentMethod("upi")}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                paymentMethod === "upi" 
                  ? "border-blue-600 bg-blue-50/50 shadow-sm" 
                  : "border-slate-100 bg-white hover:border-slate-200"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === "upi" ? "bg-blue-100 text-blue-600" : "bg-slate-50 text-slate-500"}`}>
                <Smartphone className="w-5 h-5" />
              </div>
              <span className={`font-semibold text-sm ${paymentMethod === "upi" ? "text-blue-900" : "text-slate-600"}`}>UPI (GPay, PhonePe)</span>
              {paymentMethod === "upi" && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                </div>
              )}
            </button>

            <button 
              onClick={() => setPaymentMethod("card")}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 relative ${
                paymentMethod === "card" 
                  ? "border-blue-600 bg-blue-50/50 shadow-sm" 
                  : "border-slate-100 bg-white hover:border-slate-200"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === "card" ? "bg-blue-100 text-blue-600" : "bg-slate-50 text-slate-500"}`}>
                <CreditCard className="w-5 h-5" />
              </div>
              <span className={`font-semibold text-sm ${paymentMethod === "card" ? "text-blue-900" : "text-slate-600"}`}>Debit / Credit Card</span>
              {paymentMethod === "card" && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                </div>
              )}
            </button>
          </div>
          
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% Secure Payments via Razorpay
          </div>
        </section>

        {/* Price Breakdown */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-8">
          <h2 className="text-[15px] font-bold text-slate-900 mb-4">Price Breakdown</h2>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal ({pages * copies} pages)</span>
              <span className="font-semibold text-slate-800">₹{pricing.subtotal.toFixed(2)}</span>
            </div>
            
            {pricing.duplexDiscount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Duplex Discount (10%)</span>
                <span className="font-semibold">-₹{pricing.duplexDiscount.toFixed(2)}</span>
              </div>
            )}
            
            {pricing.bulkDiscount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Bulk Discount (15%)</span>
                <span className="font-semibold">-₹{pricing.bulkDiscount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-slate-600">
              <span>GST (18%)</span>
              <span className="font-semibold text-slate-800">₹{pricing.tax.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="font-bold text-slate-900">Total Amount</span>
            <span className="text-xl font-black text-blue-600">₹{pricing.total.toFixed(2)}</span>
          </div>
        </section>

      </div>
      </div>

      {/* Sticky Bottom Primary Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-3xl mx-auto">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={handleProceedToPay}
            disabled={processing || loadingShop}
            className="w-full bg-blue-600 disabled:bg-blue-400 text-white font-bold text-lg py-4 rounded-[20px] shadow-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <>Processing...</>
            ) : (
              <>Proceed to Pay ₹{pricing.total.toFixed(2)}</>
            )}
          </motion.button>
        </div>
      </div>

    </div>
  );
}
