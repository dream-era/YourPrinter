"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function AboutHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
          scrolled ? "bg-white/80 backdrop-blur-xl border-b border-slate-100 py-4 shadow-sm" : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-[36px] h-[36px] rounded-xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-300">
              <Image src="/logo.webp" alt="YourPrinter Logo" fill className="object-contain bg-white" />
            </div>
            <span className={`font-extrabold text-2xl tracking-tight ${scrolled ? "text-slate-900" : "text-[#0A122D]"}`}>YourPrinter</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-10 font-bold text-[15px]">
            <Link href="/" className={`${scrolled ? "text-slate-600 hover:text-blue-600" : "text-[#0A122D]/70 hover:text-[#0A122D]"} transition-colors`}>Home</Link>
            <Link href="/services" className={`${scrolled ? "text-slate-600 hover:text-blue-600" : "text-[#0A122D]/70 hover:text-[#0A122D]"} transition-colors`}>Services</Link>
            <Link href="/how-it-works" className={`${scrolled ? "text-slate-600 hover:text-blue-600" : "text-[#0A122D]/70 hover:text-[#0A122D]"} transition-colors`}>How It Works</Link>
            <Link href="/pricing" className={`${scrolled ? "text-slate-600 hover:text-blue-600" : "text-[#0A122D]/70 hover:text-[#0A122D]"} transition-colors`}>Pricing</Link>
            <Link href="/about" className={`${scrolled ? "text-blue-600" : "text-blue-700"} border-b-2 border-blue-600 pb-1`}>About Us</Link>
          </nav>
          
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/auth/signup?type=student" 
              className={`${scrolled ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md" : "bg-[#0A122D] text-white hover:bg-blue-600 shadow-lg"} font-bold px-6 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 text-[15px]`}
            >
              Sign Up
            </Link>
          </div>

          <button 
            className={`md:hidden p-2 rounded-lg ${scrolled ? "text-slate-600 hover:bg-slate-100" : "text-[#0A122D] hover:bg-black/5"}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-24 px-6 pb-6 flex flex-col md:hidden overflow-y-auto">
          <nav className="flex flex-col gap-6 text-xl font-bold text-slate-800 mb-8">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link href="/services" onClick={() => setMobileMenuOpen(false)}>Services</Link>
            <Link href="/how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/about" className="text-blue-600" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
          </nav>
          <div className="mt-auto flex flex-col gap-4">
            <Link 
              href="/auth/signup?type=student" 
              className="bg-blue-600 text-white font-bold py-4 rounded-xl text-center text-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
