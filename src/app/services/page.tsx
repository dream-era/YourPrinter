"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Cloud, MapPin, Search, ShieldCheck, Smartphone, 
  CreditCard, CheckCircle2, FileText, Zap, Lock, Settings, 
  User, LayoutDashboard, Menu, X, Play, Copy, Printer, FileDown, ShoppingBag, Sliders
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export default function ServicesPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 60, damping: 20 } }
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden font-sans text-slate-900 selection:bg-blue-500/30">
      
      {/* =========================================
          NAVIGATION
      ========================================= */}
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
            <Link href="/services" className={`${scrolled ? "text-blue-600" : "text-blue-700"} border-b-2 border-blue-600 pb-1`}>Services</Link>
            <Link href="/how-it-works" className={`${scrolled ? "text-slate-600 hover:text-blue-600" : "text-[#0A122D]/70 hover:text-[#0A122D]"} transition-colors`}>How It Works</Link>
            <Link href="/pricing" className={`${scrolled ? "text-slate-600 hover:text-blue-600" : "text-[#0A122D]/70 hover:text-[#0A122D]"} transition-colors`}>Pricing</Link>
            <Link href="/about" className={`${scrolled ? "text-slate-600 hover:text-blue-600" : "text-[#0A122D]/70 hover:text-[#0A122D]"} transition-colors`}>About Us</Link>
          </nav>
          
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/customer/shops" 
              className="bg-[#0A122D] text-white font-bold px-7 py-3 rounded-[16px] hover:bg-blue-600 transition-colors duration-300 flex items-center gap-2 text-[15px] shadow-lg shadow-slate-900/10"
            >
              Find Print Shops
            </Link>
          </div>

          <button 
            className="md:hidden p-2 rounded-lg bg-white shadow-sm border border-slate-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-slate-800" /> : <Menu className="w-6 h-6 text-slate-800" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl pt-24 px-6 pb-6 flex flex-col"
          >
            <nav className="flex flex-col gap-6 text-xl font-bold text-slate-800 mb-10">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link href="/services" onClick={() => setMobileMenuOpen(false)} className="text-blue-600">Services</Link>
              <Link href="/how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link href="/about" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
            </nav>
            <Link 
              href="/customer/shops" 
              onClick={() => setMobileMenuOpen(false)}
              className="bg-blue-600 text-white font-bold px-7 py-4 rounded-[16px] text-center mt-auto shadow-lg shadow-blue-500/25"
            >
              Find Print Shops
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================
          HERO SECTION
      ========================================= */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 sm:px-12 bg-gradient-to-b from-blue-50/50 to-white overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/50 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-50/50 blur-[100px] rounded-full pointer-events-none translate-y-1/3 -translate-x-1/3"></div>
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col items-start"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-bold text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              The modern way to print
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-[44px] md:text-[64px] font-[900] text-[#0A122D] leading-[1.05] tracking-tight mb-6">
              Everything You Need to Print. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Right Near You.</span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed mb-8 max-w-[500px]">
              Find nearby print shops, upload your files, choose your options, pay online, and pick up when your order is ready.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link 
                href="/customer/shops"
                className="bg-[#0A122D] text-white font-bold text-lg px-8 py-4 rounded-[16px] hover:bg-blue-600 transition-colors shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                Find Print Shops
              </Link>
              <Link 
                href="/how-it-works"
                className="bg-white text-slate-800 border border-slate-200 font-bold text-lg px-8 py-4 rounded-[16px] hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                See How It Works
              </Link>
            </motion.div>
          </motion.div>

          {/* Hero Illustration */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative lg:h-[600px] flex items-center justify-center"
          >
            <div className="relative w-full max-w-lg aspect-square">
              {/* Central Phone Mockup */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[520px] bg-slate-900 rounded-[40px] border-[8px] border-white shadow-2xl overflow-hidden z-20">
                <div className="w-full h-full bg-[#F8FAFC] flex flex-col p-4">
                  <div className="w-32 h-6 bg-slate-200 rounded-full mx-auto mt-2 mb-6 opacity-50"></div>
                  
                  <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500"/><span className="text-xs font-bold">Campus Print Hub</span></div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">0.8 km</span>
                    </div>
                    <div className="w-full bg-blue-50 rounded-xl h-12 flex items-center justify-center"><Cloud className="w-5 h-5 text-blue-500 mr-2"/><span className="text-xs font-bold text-blue-600">Upload PDF</span></div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 flex-1">
                    <span className="text-xs font-bold text-slate-400 mb-2 block">Settings</span>
                    <div className="flex gap-2 mb-2">
                      <div className="flex-1 bg-blue-600 rounded-xl h-8"></div>
                      <div className="flex-1 bg-slate-100 rounded-xl h-8"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-12 bg-slate-100 rounded-xl h-8"></div>
                      <div className="flex-1 bg-slate-100 rounded-xl h-8"></div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-600 p-4 rounded-2xl flex justify-between items-center text-white">
                    <span className="text-sm font-bold">Pay & Print</span>
                    <span className="text-sm font-black">₹45</span>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute top-[10%] left-0 z-30 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center"><FileText className="w-5 h-5 text-orange-500"/></div>
                <div><p className="text-xs font-bold text-slate-900">Thesis.pdf</p><p className="text-[10px] text-slate-500">120 Pages</p></div>
              </motion.div>
              
              <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 5, delay: 1 }} className="absolute bottom-[20%] right-[-10%] z-30 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-emerald-500"/></div>
                <div><p className="text-xs font-bold text-slate-900">Ready for Pickup</p><p className="text-[10px] text-slate-500">Queue #1</p></div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =========================================
          WHAT IS YOURPRINTER?
      ========================================= */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 text-center">
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-[#0A122D] tracking-tight mb-6">What is YourPrinter?</h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              YourPrinter connects you with nearby print shops so you don't have to wait in line, carry files around on pendrives, or wonder if your documents are ready.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Traditional */}
            <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-8 md:p-10 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 text-red-700 font-bold text-xs mb-6">
                <X className="w-3.5 h-3.5" /> Traditional Printing
              </div>
              <ul className="space-y-4">
                {['Find a shop manually', 'Travel there with a pendrive', 'Wait in line', 'Explain print requirements verbally', 'Wait again while it prints', 'Pay in cash/UPI at counter'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600 font-medium opacity-80">
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* YourPrinter */}
            <div className="bg-[#0A122D] border border-blue-900 rounded-[32px] p-8 md:p-10 text-left shadow-2xl shadow-blue-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[80px] rounded-full pointer-events-none"></div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs mb-6 border border-blue-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> YourPrinter Way
              </div>
              <ul className="space-y-4 relative z-10">
                {[
                  { text: 'Discover nearest shops instantly', icon: MapPin },
                  { text: 'Upload files from your phone', icon: Cloud },
                  { text: 'Customize options precisely', icon: Settings },
                  { text: 'Pay securely online', icon: CreditCard },
                  { text: 'Walk in & pick up when ready', icon: ShoppingBag }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-blue-50 font-medium text-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
                      <item.icon className="w-4 h-4" />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          CORE SERVICES
      ========================================= */}
      <section className="py-24 bg-slate-50 relative border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-[#0A122D] tracking-tight mb-4">Core Services</h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl">
              Everything you can do through the YourPrinter platform.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { title: "Document Printing", desc: "Print PDFs in B&W or color with your preferred paper size.", icon: FileText, active: true },
              { title: "Bulk Printing", desc: "Send multiple copies to a shop without waiting.", icon: Copy, active: true },
              { title: "Binding & Finishing", desc: "Choose binding options for reports & projects.", icon: FileDown, active: true },
              { title: "Photo Printing", desc: "Print photos in high-quality formats.", icon: Printer, active: false },
              { title: "ID & Passport", desc: "Get application photos printed conveniently.", icon: User, active: false },
              { title: "Poster Printing", desc: "Print high-resolution materials for events.", icon: LayoutDashboard, active: false },
              { title: "Custom Printing", desc: "Submit custom requests directly.", icon: Sliders, active: false },
              { title: "Scanning", desc: "Find shops offering scanning services.", icon: Search, active: false },
            ].map((service, i) => (
              <div 
                key={i} 
                className={`p-6 rounded-[24px] border ${service.active ? 'bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group' : 'bg-slate-100/50 border-slate-200/50 opacity-70 cursor-not-allowed'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${service.active ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                    <service.icon className="w-6 h-6" />
                  </div>
                  {!service.active && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200 px-2 py-1 rounded-md">Coming Soon</span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{service.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{service.desc}</p>
                {service.active && (
                  <div className="mt-4 flex items-center gap-1 text-sm font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300">
                    Learn more <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          THE MAIN EXPERIENCE (Steps)
      ========================================= */}
      <section id="how-it-works" className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black text-[#0A122D] tracking-tight mb-6">Printing Without the Queue</h2>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            A seamless digital experience from your device to the shop counter.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-6 sm:px-12">
          <div className="relative">
            {/* Desktop Connection Line */}
            <div className="hidden md:block absolute left-[40px] top-[40px] bottom-[40px] w-0.5 bg-slate-100 z-0"></div>

            <div className="space-y-12 md:space-y-24">
              {[
                { step: "01", title: "Find a Print Shop", desc: "Open the app to see registered shops near your location.", icon: MapPin },
                { step: "02", title: "Upload Your File", desc: "Select and upload your PDF directly from your phone securely.", icon: Cloud },
                { step: "03", title: "Choose Your Options", desc: "Set color, duplex, copies, paper size, and binding preferences.", icon: Sliders },
                { step: "04", title: "Review & Pay", desc: "See the transparent price breakdown and pay securely online.", icon: CreditCard },
                { step: "05", title: "Shop Gets Your Order", desc: "The shop receives your file and instructions instantly.", icon: Zap },
                { step: "06", title: "Pick Up When Ready", desc: "Get notified when it's done. Just walk in and collect it.", icon: ShoppingBag }
              ].map((item, i) => (
                <div key={i} className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-16 items-start md:items-center group">
                  <div className="flex items-center gap-6 md:w-[150px] shrink-0">
                    <div className="w-[80px] h-[80px] rounded-[24px] bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center relative group-hover:bg-blue-50 transition-colors">
                      <span className="absolute top-2 left-2 text-[10px] font-black text-slate-300">STEP</span>
                      <span className="text-2xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">{item.step}</span>
                    </div>
                    <div className="hidden md:block h-0.5 flex-1 bg-slate-100 group-hover:bg-blue-200 transition-colors"></div>
                  </div>
                  
                  <div className="flex-1 bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 rounded-[32px] group-hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] group-hover:border-blue-100 transition-all flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                      <item.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                      <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          NEARBY DISCOVERY (Map visual)
      ========================================= */}
      <section className="py-24 bg-[#0A122D] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
        
        <div className="max-w-7xl mx-auto px-6 sm:px-12 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/50 border border-blue-700/50 text-blue-300 font-bold text-xs mb-6">
              Location Services
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">Print From a Shop Near You</h2>
            <p className="text-lg text-blue-100/70 font-medium leading-relaxed mb-10">
              YourPrinter helps you discover registered print shops around your current location. See ratings, distance, live queue status, and available services before you upload.
            </p>
            
            <ul className="space-y-4 mb-10">
              {['Real-time queue tracking', 'Accurate distance estimation', 'View shop ratings and reviews', 'Filter by open now or 24/7'].map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-white font-medium">
                  <CheckCircle2 className="w-5 h-5 text-blue-400" /> {feat}
                </li>
              ))}
            </ul>

            <Link 
              href="/customer/shops"
              className="inline-flex bg-white text-[#0A122D] font-bold px-8 py-4 rounded-[16px] hover:scale-105 transition-transform"
            >
              Find Shops Near Me
            </Link>
          </div>
          
          <div className="relative h-[400px] md:h-[500px] w-full rounded-[40px] overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
            {/* Fake Map Background */}
            <div className="absolute inset-0 bg-[#E5E9EA]">
              <Image src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop" alt="Map mockup" fill className="object-cover opacity-60 grayscale brightness-110" />
            </div>
            
            {/* UI Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-6">
              {/* Fake Shop Popup */}
              <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl relative mx-auto lg:mx-0">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rotate-45 rounded-sm hidden lg:block"></div>
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <h4 className="font-bold text-slate-900 text-lg">Campus Print Hub</h4>
                  <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg text-xs font-bold">Open</div>
                </div>
                <div className="flex gap-2 text-sm text-slate-500 font-medium mb-3 relative z-10">
                  <span>0.8 km</span> • <span>⭐ 4.8</span> • <span className="text-orange-500">Moderate Queue</span>
                </div>
                <div className="text-xs font-medium text-slate-400 mb-4 relative z-10">Document Printing • Binding • Color</div>
                <div className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-center font-bold text-sm relative z-10">Select Shop</div>
              </div>
            </div>
            
            {/* Fake Marker */}
            <div className="absolute top-[40%] left-[45%] w-12 h-12 bg-blue-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center">
              <Printer className="w-5 h-5 text-white" />
            </div>
            
            {/* Other markers */}
            <div className="absolute top-[20%] left-[20%] w-8 h-8 bg-emerald-500 rounded-full border-2 border-white shadow-xl"></div>
            <div className="absolute top-[70%] left-[80%] w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-xl"></div>
          </div>
        </div>
      </section>

      {/* =========================================
          TWO-SIDED PLATFORM (Customers & Owners)
      ========================================= */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 grid md:grid-cols-2 gap-16">
          
          {/* For Customers */}
          <div>
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">Built for People Who Need Printing Fast</h2>
            <p className="text-slate-500 font-medium mb-8">No more waiting in line or carrying pendrives.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'No waiting in line', 'Upload before reaching', 
                'See price upfront', 'Choose settings online', 
                'Track order live', 'Find nearby shops'
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-[16px] bg-slate-50 border border-slate-100 font-medium text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          {/* For Shop Owners */}
          <div>
            <div className="w-16 h-16 bg-[#0A122D] text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-slate-900/20">
              <Printer className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">YourPrinter Works for Print Shops Too</h2>
            <p className="text-slate-500 font-medium mb-8">Manage orders digitally, increase efficiency, and reach more local customers.</p>
            
            <ul className="space-y-4 mb-8">
              {['Receive online orders & view PDFs', 'Manage pricing and available services', 'Update live queue status for customers', 'Process payments seamlessly'].map((benefit, i) => (
                <li key={i} className="flex items-start gap-3 font-medium text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  {benefit}
                </li>
              ))}
            </ul>
            
            <Link 
              href="/auth/register-shop"
              className="inline-flex bg-white border-2 border-slate-200 text-slate-900 font-bold px-8 py-3.5 rounded-[16px] hover:border-slate-900 transition-colors"
            >
              Register Your Print Shop
            </Link>
          </div>
          
        </div>
      </section>

      {/* =========================================
          SECURITY
      ========================================= */}
      <section className="py-24 bg-slate-50 border-t border-slate-100 text-center">
        <div className="max-w-4xl mx-auto px-6 sm:px-12">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-slate-200/50 flex items-center justify-center mx-auto mb-8 border border-slate-100">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-6">Your Documents. Handled Securely.</h2>
          <p className="text-lg text-slate-500 font-medium leading-relaxed mb-12">
            Trust is our priority. We utilize robust cloud architecture to ensure your sensitive documents are accessible only to you and your chosen print shop.
          </p>
          
          <div className="grid sm:grid-cols-3 gap-6 text-left">
            {[
              { title: "Secure Access", desc: "Short-lived signed URLs ensure temporary and protected download access." },
              { title: "Strict Isolation", desc: "Complete data separation between different customers and print shops." },
              { title: "Safe Payments", desc: "100% secure payment processing powered by Razorpay infrastructure." }
            ].map((sec, i) => (
              <div key={i} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                <Lock className="w-6 h-6 text-slate-700 mb-4" />
                <h4 className="font-bold text-slate-900 mb-2">{sec.title}</h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{sec.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          WHY YOURPRINTER (Comparison)
      ========================================= */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <h2 className="text-3xl md:text-5xl font-black text-center text-slate-900 tracking-tight mb-16">Why Use YourPrinter?</h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Nearby", desc: "Find print shops immediately around you." },
              { title: "Convenient", desc: "Upload your files before reaching the shop." },
              { title: "Transparent", desc: "See your price before placing the order." },
              { title: "Fast", desc: "Reduce waiting and unnecessary trips." },
              { title: "Flexible", desc: "Choose your print settings digitally." },
              { title: "Connected", desc: "Customers and shops stay connected via one platform." }
            ].map((reason, i) => (
              <div key={i} className="p-8 rounded-[32px] bg-slate-50 hover:bg-blue-50 hover:scale-[1.02] transition-all duration-300 group">
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{reason.title}</h3>
                <p className="text-slate-500 font-medium">{reason.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          CALL TO ACTION
      ========================================= */}
      <section className="py-24 px-6 sm:px-12 relative overflow-hidden">
        <div className="max-w-6xl mx-auto bg-[#0A122D] rounded-[48px] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-900/20 border border-blue-900">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-800/40 via-[#0A122D] to-[#0A122D] opacity-80 pointer-events-none"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">Your Next Print Is Just a Few Clicks Away.</h2>
            <p className="text-xl text-blue-200 font-medium mb-10">
              Find a nearby print shop, upload your document, and let YourPrinter handle the rest.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/customer/shops"
                className="bg-white text-[#0A122D] font-bold text-lg px-8 py-4 rounded-[16px] hover:scale-105 transition-transform flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)]"
              >
                Find Print Shops
              </Link>
              <Link 
                href="/auth/register-shop"
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-lg px-8 py-4 rounded-[16px] hover:bg-white/20 transition-colors flex items-center justify-center"
              >
                Register Your Shop
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      
    </div>
  );
}
