"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";

interface AuthContainerProps {
  children: React.ReactNode;
  type: "student" | "business";
}

export function AuthContainer({ children, type }: AuthContainerProps) {
  const isStudent = type === "student";

  return (
    <div className="min-h-screen w-full flex bg-[#F8FAFC] font-sans">
      
      {/* LEFT PANEL - Hidden on mobile */}
      <AnimatePresence mode="wait">
        <motion.div
          key={type}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className={`hidden lg:flex flex-col justify-between w-[40%] max-w-[500px] p-12 text-white relative overflow-hidden ${
            isStudent ? "bg-gradient-to-br from-[#2563EB] to-[#1d4ed8]" : "bg-gradient-to-br from-[#7C3AED] to-[#5b21b6]"
          }`}
        >
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

          <div className="relative z-10">
            <Link href="/" className="flex items-center gap-2 mb-16 group w-fit">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg transition-transform group-hover:scale-105 bg-white">
                <Image src="/logo.png" alt="YourPrinter Logo" fill className="object-contain" />
              </div>
              <span className="text-white font-extrabold text-2xl tracking-tight">YourPrinter</span>
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight">
                {isStudent ? (
                  <>Welcome to <span className="text-[#D9FF47]">YourPrinter</span></>
                ) : (
                  <>Grow your print business with <span className="text-[#D9FF47]">YourPrinter</span></>
                )}
              </h1>
              <p className="text-white/80 text-lg mb-10 max-w-sm leading-relaxed font-medium">
                {isStudent 
                  ? "Your one-stop solution for all your printing needs."
                  : "The smart way to manage orders, automate printing and grow revenue."}
              </p>

              <div className="space-y-6">
                {isStudent ? (
                  <>
                    <FeatureItem icon={<CloudUploadIcon />} title="Upload" desc="Upload your documents in seconds" />
                    <FeatureItem icon={<PrinterIcon />} title="Print" desc="High quality prints from trusted print shops" />
                    <FeatureItem icon={<MapPinIcon />} title="Pickup" desc="Pick up your prints near you" />
                  </>
                ) : (
                  <>
                    <FeatureItem icon={<BarChartIcon />} title="Manage Orders" desc="Receive and manage orders in real-time" />
                    <FeatureItem icon={<PrinterIcon />} title="AutoPrint" desc="One-click printing and automated queue" />
                    <FeatureItem icon={<PieChartIcon />} title="Analytics" desc="Track revenue, performance and top products" />
                    <FeatureItem icon={<UsersIcon />} title="Staff Management" desc="Add staff and manage access easily" />
                  </>
                )}
              </div>
            </motion.div>
          </div>

          <div className="relative z-10 mt-12 w-full max-w-[300px] mx-auto aspect-square self-center flex-shrink-0 animate-float">
             <Image 
                src={isStudent ? "/student_auth_illustration.png" : "/business_auth_illustration.png"} 
                alt="Illustration" 
                fill 
                className="object-contain drop-shadow-2xl" 
             />
          </div>

          <div className="relative z-10 mt-auto pt-8 border-t border-white/20">
            <div className="flex items-center gap-4 text-sm font-medium text-white/90">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#D9FF47]"/> Secure</span>
              <span className="w-1 h-1 rounded-full bg-white/50"></span>
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-[#D9FF47]"/> Fast</span>
              <span className="w-1 h-1 rounded-full bg-white/50"></span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#D9FF47]"/> Reliable</span>
            </div>
            <p className="text-white/70 text-xs mt-3">
              Trusted by 250,000+ {isStudent ? "users" : "businesses"} across India
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* RIGHT PANEL - Form Area */}
      <div className="flex-1 flex flex-col relative w-full h-full min-h-screen overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-6">
           <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-md bg-white">
                <Image src="/logo.png" alt="YourPrinter Logo" fill className="object-contain" />
              </div>
              <span className="font-extrabold text-xl text-slate-800">YourPrinter</span>
            </Link>
            <div className="text-sm font-medium text-slate-500">English ▾</div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex absolute top-8 right-12 text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer transition-colors">
          🌐 English ▾
        </div>

        {/* Main Form Content */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 w-full max-w-2xl mx-auto my-auto">
           {children}
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-sm mb-0.5">{title}</h4>
        <p className="text-white/70 text-xs leading-relaxed max-w-[200px]">{desc}</p>
      </div>
    </div>
  );
}

// Icons
function CloudUploadIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m8 16 4-4 4 4"></path></svg>;
}
function PrinterIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"></path><rect x="6" y="14" width="12" height="8" rx="1"></rect></svg>;
}
function MapPinIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
}
function BarChartIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>;
}
function PieChartIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>;
}
function UsersIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
}
