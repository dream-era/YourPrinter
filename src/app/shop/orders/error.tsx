"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function OrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Orders Dashboard Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#F9FAFB] p-8 text-center">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-red-100 max-w-md w-full flex flex-col items-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
        <p className="text-slate-500 mb-8 text-sm">
          We encountered an unexpected error while loading the orders dashboard.
          {error?.message ? (
            <span className="block mt-2 font-mono text-xs text-red-400 bg-red-50 p-2 rounded">
              {error.message}
            </span>
          ) : null}
        </p>
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 bg-[#FF6B57] hover:bg-[#F25C47] text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm shadow-[#FF6B57]/20"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  );
}
