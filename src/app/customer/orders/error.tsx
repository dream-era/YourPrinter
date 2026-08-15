"use client";

import React from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex h-full w-full bg-[#F9FAFB] items-center justify-center p-8">
      <div className="bg-white border border-slate-100 rounded-3xl p-8 max-w-md w-full text-center shadow-sm">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to load your orders</h2>
        <p className="text-slate-500 font-medium leading-relaxed mb-8">
          {error.message || "An unexpected error occurred while fetching your orders. Please try again."}
        </p>
        <button
          onClick={() => reset()}
          className="w-full bg-[#FF6B57] text-white font-bold py-3.5 rounded-xl hover:bg-[#F25C47] transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
