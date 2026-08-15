import React, { Suspense } from "react";
import PaymentClient from "@/components/customer/PaymentClient";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Payment | YourPrinter",
  description: "Secure payment for your print order.",
};

export default function PaymentPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-white">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <PaymentClient />
    </Suspense>
  );
}
