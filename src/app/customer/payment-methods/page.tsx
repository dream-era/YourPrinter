"use client";

import React from "react";
import { ArrowLeft, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PaymentMethodsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-[120px] font-sans">
      <header className="bg-white px-4 pt-6 pb-4 flex items-center sticky top-0 z-40 border-b border-slate-100 shadow-sm">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition -ml-2"
        >
          <ArrowLeft className="w-6 h-6 text-slate-900" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 ml-2">Payment Methods</h1>
      </header>
      
      <div className="px-5 mt-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
          <CreditCard className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Saved Cards & Wallets</h2>
        <p className="text-slate-500 font-medium max-w-xs mb-8">
          This section allows students to save their payment methods for faster checkout. It is currently under construction.
        </p>
        <button 
          onClick={() => router.back()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
