import React from "react";

export default function OrdersLoading() {
  return (
    <div className="flex h-full w-full">
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="flex items-center justify-between px-4 sm:px-8 py-6 shrink-0 bg-[#F9FAFB]">
          <div className="h-8 w-32 bg-slate-200 rounded animate-pulse"></div>
          <div className="flex items-center gap-6">
            <div className="w-6 h-6 bg-slate-200 rounded-full animate-pulse"></div>
            <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse"></div>
          </div>
        </header>

        <div className="px-4 sm:px-8 pb-6 shrink-0 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex gap-4 w-full lg:flex-1">
            <div className="h-10 w-full sm:w-[320px] bg-slate-200 rounded-xl animate-pulse"></div>
            <div className="h-10 w-24 bg-slate-200 rounded-xl animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>

        <div className="flex-1 px-4 sm:px-8 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-[24px] p-6 border border-slate-100">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 animate-pulse"></div>
                    <div>
                      <div className="h-5 w-32 bg-slate-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 w-20 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-slate-200 rounded animate-pulse"></div>
                </div>
                
                <div className="h-4 w-full bg-slate-100 rounded mb-6"></div>
                <div className="h-4 w-3/4 bg-slate-100 rounded mb-6"></div>
                
                <div className="flex gap-3">
                  <div className="h-12 flex-1 bg-slate-100 rounded-xl animate-pulse"></div>
                  <div className="h-12 flex-1 bg-slate-200 rounded-xl animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
