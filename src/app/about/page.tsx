import React from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  MapPin, Search, PackageCheck, Lightbulb, Code, Mail, Phone
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { AboutHeader } from "./AboutHeader";

export default function AboutPage() {

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden font-sans text-slate-900 selection:bg-blue-500/30 flex flex-col">
      
      {/* NAVIGATION */}
      <AboutHeader />

      {/* MAIN CONTENT WRAPPER */}
      <main className="flex-grow pt-32 pb-24">
        
        {/* HERO SECTION */}
        <section className="px-6 sm:px-12 max-w-4xl mx-auto text-center mb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
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
          </div>
        </section>

        {/* OUR IDEA */}
        <section className="px-6 sm:px-12 max-w-3xl mx-auto mb-24">
          <div
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
          </div>
        </section>

        {/* HOW YOURPRINTER HELPS */}
        <section className="px-6 sm:px-12 max-w-6xl mx-auto mb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-[#0A122D] mb-3">Find Nearby</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Discover registered print shops around your location.</p>
            </div>
            
            <div 
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center"
            >
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-[#0A122D] mb-3">Order Online</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Upload your documents and choose your printing requirements before you arrive.</p>
            </div>

            <div 
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center"
            >
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <PackageCheck className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-[#0A122D] mb-3">Pick Up Easily</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Track your order and collect it when the shop has finished printing.</p>
            </div>
          </div>
        </section>

        {/* OUR VISION */}
        <section className="px-6 sm:px-12 max-w-4xl mx-auto mb-24">
          <div
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
          </div>
        </section>

        {/* COMPANY */}
        <section className="px-6 sm:px-12 max-w-3xl mx-auto mb-24 text-center">
          <div
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
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="px-6 sm:px-12 max-w-4xl mx-auto text-center">
          <div
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
          </div>
        </section>

      </main>

      {/* GLOBAL FOOTER */}
      <Footer />
    </div>
  );
}
