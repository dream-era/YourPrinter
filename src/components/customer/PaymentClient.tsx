"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, X, Check, CreditCard, Building } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Extract all params
  const shopId = searchParams.get("shopId") || "shop-1";
  const documentId = searchParams.get("documentId") || "";
  const fileName = searchParams.get("file") || "Document.pdf";
  const pages = parseInt(searchParams.get("pages") || "1");
  const copies = parseInt(searchParams.get("copies") || "1");
  const colorMode = searchParams.get("colorMode") || "bw";
  const duplex = searchParams.get("duplex") === "true";
  const binding = searchParams.get("binding") || "None (Loose Sheets)";
  const paperSize = searchParams.get("paperSize") || "A4";
  const totalAmount = parseFloat(searchParams.get("total") || "0");
  
  const [selectedMethod, setSelectedMethod] = useState<string>("gpay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Load Razorpay Script
    const loadScript = () => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
    };
    loadScript();
  }, []);

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create Order on Backend
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          documentId,
          printOptions: {
            color: colorMode,
            sides: duplex ? "double" : "single",
            copies,
            paperSize,
            binding,
          }
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      if (!scriptLoaded) {
        throw new Error("Razorpay SDK not loaded");
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: data.razorpayKeyId || "",
        amount: data.amountPaise,
        currency: "INR",
        name: "YourPrinter Student",
        description: `Printing ${fileName}`,
        order_id: data.razorpayOrderId,
        theme: { color: "#2563EB" },
        handler: async function (response: any) {
          // 3. Verify Payment
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: data.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              toast.success("Payment Successful!");
              router.push(`/customer/order/${data.orderId}`);
            } else {
              toast.error(verifyData.error || "Payment Verification Failed!");
              setIsProcessing(false);
            }
          } catch (err) {
            toast.error("An error occurred during verification.");
            setIsProcessing(false);
          }
        },
        prefill: {
          name: "Student User",
          email: "student@example.com",
          contact: "9999999999",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            toast.error("Payment Cancelled");
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong.");
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    { id: "gpay", label: "GPay", icon: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg", type: "upi" },
    { id: "phonepe", label: "PhonePe", icon: "https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg", type: "upi" },
    { id: "paytm", label: "Paytm", icon: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Paytm_logo.svg", type: "upi" },
    { id: "upi_qr", label: "UPI ID / QR", icon: null, type: "upi" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-[120px] font-sans relative">
      {/* Header */}
      <header className="bg-slate-50 px-4 pt-6 pb-4 flex items-center sticky top-0 z-40 max-w-3xl mx-auto w-full">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 transition -ml-2"
        >
          <ArrowLeft className="w-6 h-6 text-slate-900" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 ml-2">Payment</h1>
      </header>

      <div className="px-5 space-y-6 max-w-3xl mx-auto w-full">
        
        {/* Total Amount Card */}
        <div className="bg-[#F8FAFC] border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Amount</p>
          <div className="flex items-end justify-between">
            <h2 className="text-4xl font-extrabold text-slate-900">₹{totalAmount.toFixed(2)}</h2>
            <button 
              onClick={() => setShowDetails(true)}
              className="text-blue-600 text-sm font-bold hover:underline mb-1"
            >
              View Details
            </button>
          </div>
        </div>

        {/* UPI Payment Methods */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {paymentMethods.map((method, index) => {
            const isSelected = selectedMethod === method.id;
            return (
              <div 
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`flex items-center justify-between p-5 cursor-pointer transition-colors ${
                  index !== paymentMethods.length - 1 ? "border-b border-slate-100" : ""
                } ${isSelected ? "bg-blue-50/50" : "hover:bg-slate-50"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center">
                    {method.icon ? (
                      <img src={method.icon} alt={method.label} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><path d="M22 6l-10 7L2 6"></path></svg>
                      </div>
                    )}
                  </div>
                  <span className="font-semibold text-slate-800">{method.label}</span>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300"
                }`}>
                  {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Other Methods */}
        <div>
          <h3 className="text-[15px] font-bold text-slate-900 mb-3 ml-1">Other Methods</h3>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            
            <div 
              onClick={() => setSelectedMethod("card")}
              className={`flex items-center justify-between p-5 cursor-pointer border-b border-slate-100 transition-colors ${selectedMethod === 'card' ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-4">
                <CreditCard className="w-6 h-6 text-slate-500" />
                <span className="font-semibold text-slate-800">Card</span>
              </div>
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </div>

            <div 
              onClick={() => setSelectedMethod("netbanking")}
              className={`flex items-center justify-between p-5 cursor-pointer transition-colors ${selectedMethod === 'netbanking' ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-4">
                <Building className="w-6 h-6 text-slate-500" />
                <span className="font-semibold text-slate-800">Net Banking</span>
              </div>
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </div>

          </div>
        </div>

        {/* Secured By */}
        <div className="flex items-center justify-center gap-2 mt-8 pb-4 opacity-70">
          <span className="text-sm font-medium text-slate-500">Secured by</span>
          <div className="flex items-center gap-1 font-bold text-[#0A2540] text-lg tracking-tighter">
            <span className="w-0.5 h-4 bg-blue-600 rotate-12 -mr-0.5"></span>
            Razorpay
          </div>
        </div>
      </div>

      {/* Floating Pay Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 pb-safe z-40 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-[20px] shadow-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay ₹${totalAmount.toFixed(2)}`}
          </motion.button>
        </div>
      </div>

      {/* Bottom Sheet for Details */}
      <AnimatePresence>
        {showDetails && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:max-w-2xl bg-white rounded-t-3xl z-50 p-6 pb-safe shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Order Details</h3>
                <button 
                  onClick={() => setShowDetails(false)}
                  className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="text-slate-500">File Name</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[200px]">{fileName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Total Pages</span>
                  <span className="font-semibold text-slate-900">{pages}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Copies</span>
                  <span className="font-semibold text-slate-900">{copies}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Color Mode</span>
                  <span className="font-semibold text-slate-900 uppercase">{colorMode}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Print Sides</span>
                  <span className="font-semibold text-slate-900">{duplex ? "Double Sided" : "Single Sided"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Binding</span>
                  <span className="font-semibold text-slate-900">{binding}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="font-bold text-slate-900 text-lg">Total</span>
                  <span className="font-bold text-blue-600 text-lg">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={() => setShowDetails(false)}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-[20px]"
              >
                Close
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
