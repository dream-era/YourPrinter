"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Menu, X, MapPin, Search, PackageCheck, Lightbulb, Code, Mail, Phone
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export default function AboutPage() {
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

      {/* MOBILE MENU */}
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

      {/* MAIN CONTENT WRAPPER */}
      <main className="flex-grow pt-32 pb-24">
        
        {/* HERO SECTION */}
        <section className="px-6 sm:px-12 max-w-4xl mx-auto text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center bg-slate-200 text-slate-700 font-bold px-4 py-1.5 rounded-full text-sm mb-6 shadow-sm border border-slate-300">
              About YourPrinter
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#0A122D] tracking-tight mb-6">
              Making Local Printing Simpler.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              YourPrinter connects people with nearby print shops, making it easier to upload documents, order prints, and pick them up when they're ready.
            </p>
            <div className="flex justify-center">
              <Link 
                href="/customer/shops"
                className="inline-flex items-center justify-center bg-blue-600 text-white font-bold px-8 py-4 rounded-xl text-lg hover:bg-blue-700 hover:scale-105 transition-all shadow-lg"
              >
                Find Print Shops
              </Link>
            </div>
          </motion.div>
        </section>

        {/* OUR IDEA */}
        <section className="px-6 sm:px-12 max-w-3xl mx-auto mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="prose prose-lg prose-slate"
          >
            <h2 className="text-3xl font-bold text-[#0A122D] mb-6 text-center">Why We Built YourPrinter</h2>
            <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <p className="text-slate-600 leading-relaxed m-0 text-lg">
                Printing is still often a time-consuming process. You have to find a shop, travel there, send your files, explain your requirements, wait, and then collect your documents.
              </p>
              <p className="text-slate-600 leading-relaxed m-0 text-lg">
                YourPrinter brings this experience online. Customers can discover nearby print shops, upload their documents, choose their printing preferences, pay securely, and collect their order when it is ready.
              </p>
            </div>
          </motion.div>
        </section>

        {/* HOW YOURPRINTER HELPS */}
        <section className="px-6 sm:px-12 max-w-6xl mx-auto mb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-[#0A122D] mb-3">Find Nearby</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Discover registered print shops around your location.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center"
            >
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-[#0A122D] mb-3">Order Online</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Upload your documents and choose your printing requirements before you arrive.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center"
            >
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <PackageCheck className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-[#0A122D] mb-3">Pick Up Easily</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Track your order and collect it when the shop has finished printing.</p>
            </motion.div>
          </div>
        </section>

        {/* OUR VISION */}
        <section className="px-6 sm:px-12 max-w-4xl mx-auto mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-[#0A122D] rounded-3xl p-10 md:p-14 text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#DFFF3E] rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
                <Lightbulb className="w-8 h-8 text-[#DFFF3E]" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">Our Vision</h2>
              <p className="text-slate-300 text-xl md:text-2xl mb-6 max-w-2xl mx-auto leading-relaxed font-medium">
                "We want to make local printing as simple and convenient as ordering anything online."
              </p>
              <p className="text-[#DFFF3E] font-bold tracking-wide uppercase text-sm">
                Less waiting. Less hassle. Smarter printing.
              </p>
            </div>
          </motion.div>
        </section>

        {/* COMPANY */}
        <section className="px-6 sm:px-12 max-w-3xl mx-auto mb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-200 rounded-full mb-6">
              <Code className="w-6 h-6 text-slate-700" />
            </div>
            <h2 className="text-2xl font-bold text-[#0A122D] mb-4">Built by Dreamera Innovations</h2>
            <p className="text-slate-600 mb-8 leading-relaxed max-w-xl mx-auto">
              YourPrinter is a product of Dreamera Innovations, a technology company focused on building practical digital products that make everyday experiences simpler.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <a href="tel:9047382788" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors">
                <Phone className="w-4 h-4" />
                9047382788
              </a>
              <a href="mailto:dreaminnovationsz@gmail.com" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors">
                <Mail className="w-4 h-4" />
                dreaminnovationsz@gmail.com
              </a>
            </div>
          </motion.div>
        </section>

        {/* FINAL CTA */}
        <section className="px-6 sm:px-12 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-blue-600 rounded-3xl p-10 md:p-14 shadow-xl shadow-blue-600/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white tracking-tight">Ready to Print Smarter?</h2>
              <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-lg mx-auto">
                Find a nearby print shop and get started with YourPrinter.
              </p>
              <Link 
                href="/customer/shops"
                className="inline-flex items-center justify-center bg-white text-blue-600 font-bold px-8 py-4 rounded-xl text-lg hover:bg-slate-50 hover:scale-105 transition-all shadow-lg"
              >
                Find Print Shops
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
