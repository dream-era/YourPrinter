"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Bell, Search, TrendingUp,
  FileText, Clock, CreditCard,
  Calendar as CalendarIcon,
  ChevronDown, Download
} from "lucide-react";

export default function ReportsClient({ shopId }: { shopId: string }) {
  const [dateRange, setDateRange] = useState("This Week");

  return (
    <div className="flex h-full w-full bg-[#F9FAFB] overflow-hidden">
      
      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Header Row */}
        <header className="flex items-center justify-between px-8 py-6 shrink-0 bg-[#F9FAFB]">
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Reports & Analytics</h1>
          
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FFB5A7] text-[#FF6B57] font-bold flex items-center justify-center text-sm">
                SA
              </div>
              <div className="flex flex-col hidden sm:flex">
                <span className="text-[14px] font-bold text-slate-800 leading-tight">Shop Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Filters Row */}
        <div className="px-8 pb-6 shrink-0 flex items-center justify-between gap-4">
          <div className="relative">
            <div className="flex items-center gap-2 pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer shadow-sm">
              <CalendarIcon className="w-4 h-4 text-[#FF6B57]" />
              <span className="text-[14px] font-bold text-slate-700">{dateRange}</span>
            </div>
            <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-[14px] shadow-sm transition-all active:scale-95 disabled:opacity-50" disabled>
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Scrollable Dashboard */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 hide-scrollbar flex items-center justify-center">
          
          {/* Empty State */}
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No reports available yet</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              Reports and analytics will appear here once your shop starts processing orders. Check back later!
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
