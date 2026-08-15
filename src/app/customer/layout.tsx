"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, FileText, User } from "lucide-react";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Map",
      href: "/customer/shops",
      icon: <Map className="w-6 h-6" />,
    },
    {
      name: "Orders",
      href: "/customer/orders",
      icon: <FileText className="w-6 h-6" />,
    },
    {
      name: "Profile",
      href: "/customer/profile",
      icon: <User className="w-6 h-6" />,
    },
  ];

  const hideBottomNav = pathname.match(/\/customer\/(shops\/[^/]+|upload|options|review|payment|order\/)/);

  return (
    <div className="flex flex-col h-screen w-full bg-[#F8FAFC] overflow-hidden font-sans">
      
      {/* Main Content Area */}
      <main className={`flex-1 w-full relative overflow-y-auto ${hideBottomNav ? '' : 'pb-[80px]'}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 h-[80px] bg-white border-t border-slate-100 flex items-center justify-around px-4 z-50 rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
            
            return (
              <Link 
                key={tab.name} 
                href={tab.href}
                className="relative flex flex-col items-center justify-center w-full h-full pt-1"
              >
                <div className={`transition-colors duration-200 ${isActive ? 'text-[#2563EB]' : 'text-slate-400 hover:text-slate-600'}`}>
                  {tab.icon}
                </div>
                <span className={`text-[11px] font-bold mt-1 transition-colors duration-200 ${isActive ? 'text-[#2563EB]' : 'text-slate-400'}`}>
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
      
    </div>
  );
}
