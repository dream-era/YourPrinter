"use client";

import dynamic from "next/dynamic";

const MapScreenDynamic = dynamic(() => import("./MapScreen"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#2563EB] animate-spin mb-4" />
      <p className="text-slate-500 font-medium">Loading Map...</p>
    </div>
  )
});

export default MapScreenDynamic;
