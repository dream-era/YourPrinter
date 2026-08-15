import React, { Suspense } from "react";
import ReviewClient from "@/components/customer/ReviewClient";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Review & Pay | YourPrinter",
  description: "Review your print job details and proceed to payment.",
};

export default function ReviewPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <ReviewClient />
    </Suspense>
  );
}
