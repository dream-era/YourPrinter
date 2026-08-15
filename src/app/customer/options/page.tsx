import React, { Suspense } from "react";
import OptionsClient from "@/components/customer/OptionsClient";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Print Options | YourPrinter",
  description: "Configure your print options.",
};

export default function OptionsPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-white">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <OptionsClient />
    </Suspense>
  );
}
