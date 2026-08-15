"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  Printer, 
  Menu,
  CheckCircle2, 
  Settings,
  HelpCircle,
  Users,
  BarChart3
} from "lucide-react";

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Orders", href: "/shop/orders", icon: Menu },
    { name: "History", href: "/shop/history", icon: CheckCircle2 },
    { name: "Employees", href: "/shop/staff", icon: Users },
    { name: "Settings", href: "/shop/settings", icon: Settings },
    { name: "Reports", href: "/shop/reports", icon: BarChart3 },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#fcfcfd] overflow-hidden font-sans text-slate-800">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative w-[28px] h-[28px] rounded-lg overflow-hidden">
            <Image src="/logo.png" alt="YourPrinter" fill className="object-contain bg-white" />
          </div>
          <span className="text-[16px] font-bold tracking-tight text-slate-800">YourPrinter</span>
        </div>
      </div>

      {/* Left Sidebar (Desktop, hidden on mobile) */}
      <aside className="hidden md:flex w-[260px] h-full bg-white border-r border-slate-100 flex-col z-20 shrink-0">
        
        {/* Brand Header */}
        <div className="h-20 flex items-center px-8 border-b border-transparent">
          <div className="flex items-center gap-3">
            <div className="relative w-[32px] h-[32px] rounded-lg overflow-hidden">
              <Image src="/logo.png" alt="YourPrinter" fill className="object-contain bg-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[17px] font-bold tracking-tight text-slate-800">YourPrinter</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 flex flex-col gap-1.5 overflow-y-auto hide-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href}>
                <div className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-[#FFF2F0] text-[#FF6B57] font-semibold" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium"
                }`}>
                  <item.icon className={`w-5 h-5 ${isActive ? "text-[#FF6B57]" : "text-slate-400"}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[15px]">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Applications Link */}
        <div className="p-4 mt-auto mb-4">
          <div className="px-4 text-[11px] font-bold text-slate-400 mb-3 tracking-wider uppercase">Applications</div>
          <Link href="/help">
            <div className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer">
              <HelpCircle className="w-5 h-5 text-slate-400" />
              <span className="text-[15px] font-medium">Help Center</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-[#F9FAFB] pb-[80px] md:pb-0 overflow-y-auto">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[80px] bg-white border-t border-slate-100 flex items-center justify-around px-2 z-50 rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className="relative flex flex-col items-center justify-center w-full h-full pt-1"
            >
              <div className={`transition-colors duration-200 ${isActive ? 'text-[#FF6B57]' : 'text-slate-400 hover:text-slate-600'}`}>
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold mt-1 transition-colors duration-200 ${isActive ? 'text-[#FF6B57]' : 'text-slate-400'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
