"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  MapPin, Upload, Settings, CreditCard, CheckCircle2,
  Menu, X, ArrowRight
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export default function HowItWorksPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const steps = [
    {
      id: 1,
      icon: <MapPin className="w-8 h-8 text-blue-500" />,
      title: "Find a Shop",
      description: "Allow YourPrinter to access your location and discover registered print shops near you.",
    },
    {
      id: 2,
      icon: <Upload className="w-8 h-8 text-indigo-500" />,
      title: "Upload Your File",
      description: "Upload your PDF or supported document securely.",
    },
    {
      id: 3,
      icon: <Settings className="w-8 h-8 text-purple-500" />,
      title: "Choose Your Options",
      description: "Select color, copies, paper size, sides, binding and other available options.",
    },
    {
      id: 4,
      icon: <CreditCard className="w-8 h-8 text-rose-500" />,
      title: "Review & Pay",
      description: "Review your order and pay securely online.",
    },
    {
      id: 5,
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-500" />,
      title: "Pick Up",
      description: "The shop processes your order. Track the status and collect it when it's ready.",
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden font-sans text-slate-900 selection:bg-blue-500/30 flex flex-col">
      
      {/* NAVIGATION */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
          scrolled ? "bg-white/80 backdrop-blur-xl border-b border-slate-100 py-4 shadow-sm" : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-[36px] h-[36px] rounded-xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-300">
              <Image src="/logo.png" alt="YourPrinter Logo" fill className="object-contain bg-white" />
            </div>
            <span className={`font-extrabold text-2xl tracking-tight ${scrolled ? "text-slate-900" : "text-[#0A122D]"}`}>YourPrinter</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-10 font-bold text-[15px]">
            <Link href="/" className={`${scrolled ? "text-slate-600 hover:text-blue-600" : "text-[#0A122D]/70 hover:text-[#0A122D]"} transition-colors`}>Home</Link>
            <Link href="/services" className={`${scrolled ? "text-slate-600 hover:text-blue-600" : "text-[#0A122D]/70 hover:text-[#0A122D]"} transition-colors`}>Services</Link>
            <Link href="/how-it-works" className={`${scrolled ? "text-blue-600" : "text-blue-700"} border-b-2 border-blue-600 pb-1`}>How It Works</Link>
            <Link href="/pricing" className={`${scrolled ? "text-slate-600 hover:text-blue-600" : "text-[#0A122D]/70 hover:text-[#0A122D]"} transition-colors`}>Pricing</Link>
            <Link href="/about" className={`${scrolled ? "text-slate-600 hover:text-blue-600" : "text-[#0A122D]/70 hover:text-[#0A122D]"} transition-colors`}>About Us</Link>
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

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-24 px-6 pb-6 flex flex-col md:hidden overflow-y-auto">
          <nav className="flex flex-col gap-6 text-xl font-bold text-slate-800 mb-8">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link href="/services" onClick={() => setMobileMenuOpen(false)}>Services</Link>
            <Link href="/how-it-works" className="text-blue-600" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
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

      {/* MAIN CONTENT WRAPPER */}
      <main className="flex-grow pt-32 pb-24">
        
        {/* HERO SECTION */}
        <section className="px-6 sm:px-12 max-w-4xl mx-auto text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#0A122D] tracking-tight mb-6">
              How It Works
            </h1>
            <p className="text-xl md:text-2xl font-bold text-blue-600 mb-6">
              Print smarter in just a few simple steps.
            </p>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Find a nearby print shop, upload your document, choose your print options, and pick it up when it's ready.
            </p>
            <Link 
              href="/customer/shops"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-bold px-8 py-4 rounded-xl text-lg hover:bg-blue-700 hover:scale-105 transition-all shadow-xl shadow-blue-500/20"
            >
              Find Print Shops
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </section>

        {/* WORKFLOW SECTION */}
        <section className="px-6 sm:px-12 max-w-7xl mx-auto mb-24 relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0A122D]">From Upload to Pickup</h2>
          </div>

          <div className="relative">
            {/* Desktop Connecting Line */}
            <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-1 bg-slate-200 rounded-full" />
            {/* Mobile Connecting Line */}
            <div className="block lg:hidden absolute top-8 bottom-8 left-12 w-1 bg-slate-200 rounded-full" />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-6 relative">
              {steps.map((step, index) => (
                <motion.div 
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="flex flex-row lg:flex-col items-center lg:items-start text-left lg:text-center gap-6 lg:gap-4 relative group"
                >
                  <div className="relative flex-shrink-0 z-10">
                    <div className="w-24 h-24 lg:w-24 lg:h-24 mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/50 flex items-center justify-center border border-slate-100 group-hover:scale-110 group-hover:border-blue-200 transition-all duration-300">
                      {step.icon}
                    </div>
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#0A122D] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                      {step.id}
                    </div>
                  </div>
                  
                  <div className="flex-1 lg:mt-4">
                    <h3 className="text-xl font-bold text-[#0A122D] mb-2">{step.title}</h3>
                    <p className="text-slate-600 leading-relaxed text-[15px]">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FOR SHOP OWNERS */}
        <section className="px-6 sm:px-12 max-w-3xl mx-auto text-center mb-20 bg-slate-100 rounded-3xl p-10 border border-slate-200">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-2xl font-bold text-[#0A122D] mb-4">Are you a Print Shop Owner?</h3>
            <p className="text-slate-600 mb-8 max-w-xl mx-auto">
              Register your shop on YourPrinter, receive online orders, manage printing requests and keep your customers updated.
            </p>
            <Link 
              href="/auth/register-shop"
              className="inline-flex items-center justify-center bg-[#0A122D] text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
            >
              Register Your Shop
            </Link>
          </motion.div>
        </section>

        {/* FINAL CTA */}
        <section className="px-6 sm:px-12 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-blue-600 rounded-3xl p-10 md:p-14 text-white shadow-2xl shadow-blue-500/20"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Ready to print smarter?</h2>
            <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-lg mx-auto">
              Find a nearby print shop and place your first order.
            </p>
            <Link 
              href="/customer/shops"
              className="inline-flex items-center justify-center bg-white text-blue-600 font-bold px-8 py-4 rounded-xl text-lg hover:bg-blue-50 hover:scale-105 transition-all shadow-lg"
            >
              Find Print Shops
            </Link>
          </motion.div>
        </section>

      </main>

      {/* GLOBAL FOOTER */}
      <Footer />
    </div>
  );
}
