import React, { Suspense } from "react";
import UploadClient from "@/components/customer/UploadClient";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Upload PDF | YourPrinter",
  description: "Upload your PDF document for printing.",
};

export default function UploadPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-white">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <UploadClient />
    </Suspense>
  );
}
