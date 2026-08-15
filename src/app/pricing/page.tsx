"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Calculator, User, Store, ShieldCheck, 
  Settings, Menu, X, ArrowRight,
  FileText, Palette, Copy, Maximize, BookOpen, MapPin
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export default function PricingPage() {
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
            <Link href="/how-it-works" className={`${scrolled ? "text-slate-600 hover:text-blue-600" : "text-[#0A122D]/70 hover:text-[#0A122D]"} transition-colors`}>How It Works</Link>
            <Link href="/pricing" className={`${scrolled ? "text-blue-600" : "text-blue-700"} border-b-2 border-blue-600 pb-1`}>Pricing</Link>
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
            <Link href="/how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
            <Link href="/pricing" className="text-blue-600" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
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
        <section className="px-6 sm:px-12 max-w-4xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center bg-blue-100 text-blue-700 font-bold px-4 py-1.5 rounded-full text-sm mb-6 shadow-sm border border-blue-200">
              Pricing Coming Soon
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#0A122D] tracking-tight mb-6">
              Simple & Transparent Pricing
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              We're working on a pricing model that keeps printing affordable for customers while creating real value for local print shops.
            </p>
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-xl shadow-slate-200/50 flex items-center justify-center border border-slate-100">
                <Calculator className="w-10 h-10 text-blue-500" />
              </div>
            </div>
          </motion.div>
        </section>

        {/* PRICING STATUS */}
        <section className="px-6 sm:px-12 max-w-4xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-[#0A122D] rounded-3xl p-10 md:p-14 text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">Our Pricing Is Coming Soon</h2>
              <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                We're currently finalizing the pricing structure for YourPrinter. Our goal is to keep prices transparent, fair and competitive for both customers and print shop owners.
              </p>
              <div className="inline-flex items-center justify-center bg-[#DFFF3E] text-[#0A122D] font-black px-6 py-3 rounded-xl tracking-wider text-sm shadow-[0_0_20px_rgba(223,255,62,0.3)]">
                COMING SOON
              </div>
            </div>
          </motion.div>
        </section>

        {/* WHAT WE ARE WORKING TOWARDS */}
        <section className="px-6 sm:px-12 max-w-6xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0A122D]">Built Around Fair Pricing</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <User className="w-8 h-8 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold text-[#0A122D] mb-3">For Customers</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Clear pricing before you place an order, with no unexpected charges.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <Store className="w-8 h-8 text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold text-[#0A122D] mb-3">For Print Shops</h3>
              <p className="text-slate-600 text-sm leading-relaxed">A pricing model designed to help local print shops grow through online orders.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <ShieldCheck className="w-8 h-8 text-purple-500 mb-4" />
              <h3 className="text-xl font-bold text-[#0A122D] mb-3">Transparent</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Know what you're paying for before confirming your order.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <Settings className="w-8 h-8 text-indigo-500 mb-4" />
              <h3 className="text-xl font-bold text-[#0A122D] mb-3">Flexible</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Pricing will reflect the printing options and services you actually choose.</p>
            </motion.div>
          </div>
        </section>

        {/* WHAT WILL AFFECT YOUR ORDER PRICE */}
        <section className="px-6 sm:px-12 max-w-4xl mx-auto mb-20 text-center">
          <h2 className="text-3xl font-bold text-[#0A122D] mb-4">Your Order Price Will Depend On</h2>
          <p className="text-slate-600 max-w-2xl mx-auto mb-10">
            YourPrinter will calculate the order price based on the options available at your selected print shop.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { icon: <FileText className="w-5 h-5 text-slate-500" />, text: "Number of pages" },
              { icon: <Palette className="w-5 h-5 text-blue-500" />, text: "Color or Black & White" },
              { icon: <Copy className="w-5 h-5 text-emerald-500" />, text: "Number of copies" },
              { icon: <Maximize className="w-5 h-5 text-indigo-500" />, text: "Paper size" },
              { icon: <BookOpen className="w-5 h-5 text-purple-500" />, text: "Binding & finishing" },
              { icon: <MapPin className="w-5 h-5 text-rose-500" />, text: "Print shop and available services" }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
                {item.icon}
                <span className="font-medium text-slate-700">{item.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* MESSAGES (CUSTOMER / SHOP OWNER) */}
        <section className="px-6 sm:px-12 max-w-5xl mx-auto mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-blue-50 p-8 md:p-10 rounded-3xl border border-blue-100"
            >
              <h3 className="text-2xl font-bold text-[#0A122D] mb-4">Want to know when pricing is live?</h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                We're getting YourPrinter ready for launch. Pricing details will be announced once our pricing model is finalized.
              </p>
              <div className="inline-flex items-center justify-center font-bold text-blue-600 bg-white px-6 py-2.5 rounded-xl border border-blue-200">
                Stay Tuned
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-emerald-50 p-8 md:p-10 rounded-3xl border border-emerald-100"
            >
              <h3 className="text-2xl font-bold text-[#0A122D] mb-4">For Print Shop Owners</h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                We're also designing a flexible pricing model that allows print shops to configure the services and rates they offer through YourPrinter.
              </p>
              <Link 
                href="/auth/register-shop"
                className="inline-flex items-center justify-center font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                Register Your Shop
              </Link>
            </motion.div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="px-6 sm:px-12 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl p-10 md:p-14 border border-slate-200 shadow-xl shadow-slate-200/50"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#0A122D] tracking-tight">Ready to Print Smarter?</h2>
            <p className="text-slate-600 text-lg md:text-xl mb-10 max-w-lg mx-auto">
              Explore nearby print shops and get ready to place your first order.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/customer/shops"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-blue-600 text-white font-bold px-8 py-4 rounded-xl text-lg hover:bg-blue-700 hover:scale-105 transition-all shadow-lg"
              >
                Find Print Shops
              </Link>
              <Link 
                href="/how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-slate-100 text-[#0A122D] font-bold px-8 py-4 rounded-xl text-lg hover:bg-slate-200 transition-all border border-slate-200"
              >
                How It Works
              </Link>
            </div>
          </motion.div>
        </section>

      </main>

      {/* GLOBAL FOOTER */}
      <Footer />
    </div>
  );
}
