import * as React from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  
  
  
  Cloud, 
  Sliders, 
  Map, 
  ShoppingBag,
  
  Building2,
  ShieldCheck,
  
} from "lucide-react";
import HeroSection from "@/components/landing/HeroSection";
import { Footer } from "@/components/layout/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background-brand overflow-hidden selection:bg-accent-lime selection:text-text-dark font-sans">
      
      {/* 1. HERO SECTION (Client Component) */}
      <HeroSection />


      {/* 3. ABOUT & STATISTICS SECTION */}
      <section id="about" className="py-24 px-4 sm:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Header Text */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-primary-brand"></span>
              <span className="text-primary-brand font-bold text-xs tracking-widest uppercase">About YourPrinter</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-extrabold text-text-dark tracking-tight leading-[1.15] mb-6">
              Your trusted printing partner, delivering quality prints <span className="text-primary-brand">smarter</span> and <span className="text-[#aacc00]">faster.</span>
            </h2>
            
            <p className="text-gray-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">
              We combine technology and trust to deliver the best printing experience near you.
            </p>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Blue */}
            <div className="bg-primary-brand rounded-[2rem] p-8 text-white relative overflow-hidden flex flex-col justify-between group shadow-xl shadow-primary-brand/20 h-[380px]">
              <div>
                <h3 className="text-6xl font-black tracking-tighter mb-2">120+</h3>
                <p className="font-bold text-lg leading-tight mb-1">Print Shops</p>
                <p className="text-white/80 text-sm">Across your city</p>
              </div>
              
              <div className="mt-8 relative z-10 bg-white/10 p-4 rounded-2xl backdrop-blur border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-brand">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">YourPrinter Hub</div>
                    <div className="text-white/70 text-xs">Partner Store</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 w-full p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                <Link href="/auth/login?type=business" className="bg-white text-primary-brand font-bold text-sm px-6 py-3 rounded-full flex items-center justify-between w-full shadow-lg">
                  Join as a Shop
                  <div className="w-6 h-6 bg-primary-brand/10 rounded-full flex items-center justify-center">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              </div>
            </div>

            {/* Card 2: White */}
            <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 flex flex-col justify-between h-[380px] shadow-sm hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 text-primary-brand rounded-2xl flex items-center justify-center">
                  <Sliders className="w-6 h-6 rotate-90" />
                </div>
                <div className="text-xs font-bold text-gray-500 max-w-[100px] text-right leading-tight">Commitment to Excellence</div>
              </div>
              
              <div>
                <h3 className="text-6xl font-black tracking-tighter text-text-dark mb-2">99.9%</h3>
                <p className="font-medium text-gray-600 text-sm max-w-[140px]">Orders delivered on time</p>
              </div>
              
              <div className="mt-auto pt-6 border-t border-gray-200">
                <div className="flex -space-x-2 mb-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-blue-500 font-bold text-[10px] overflow-hidden">
                      U{i}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-text-dark text-white flex items-center justify-center text-xs font-bold">
                    +
                  </div>
                </div>
                <p className="text-sm font-medium text-text-dark leading-snug">"YourPrinter makes our campus work so much easier!"</p>
                <p className="text-xs text-primary-brand font-bold mt-1">— Student Union</p>
              </div>
            </div>

            {/* Card 3: Lime */}
            <div className="bg-accent-lime rounded-[2rem] p-8 flex flex-col justify-between h-[380px] shadow-lg shadow-accent-lime/20 hover:scale-[1.02] transition-transform duration-300">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-text-dark text-accent-lime rounded-2xl flex items-center justify-center shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <div className="text-sm font-bold text-text-dark leading-tight mt-1">Happy<br/>Customers</div>
              </div>
              
              <div className="mt-auto">
                <h3 className="text-6xl font-black tracking-tighter text-text-dark mb-4">250K+</h3>
                <p className="font-medium text-text-dark/80 text-sm max-w-[180px] mb-8">Students & professionals trust us</p>
                
                <div className="flex -space-x-3">
                  {[5, 6, 7, 8].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-accent-lime bg-lime-100 flex items-center justify-center text-lime-700 font-bold text-xs overflow-hidden shadow-sm">
                      U{i}
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-accent-lime bg-text-dark text-accent-lime flex items-center justify-center text-sm font-bold shadow-sm z-10 relative">
                    +
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Dark */}
            <div className="bg-text-dark rounded-[2rem] p-8 text-white relative overflow-hidden h-[380px] shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
              
              <div className="relative z-10 flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-white/10 backdrop-blur text-primary-brand rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold leading-tight mt-1">Secure<br/>Payments</div>
              </div>
              
              <div className="relative z-10 mt-auto">
                <h3 className="text-6xl font-black tracking-tighter mb-4">100%</h3>
                <p className="font-medium text-gray-400 text-sm max-w-[180px]">Safe, encrypted & reliable transactions</p>
              </div>

              {/* Decorative shield illustration */}
              <div className="absolute -bottom-10 -right-10 w-48 h-48 opacity-20 pointer-events-none">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full text-primary-brand"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
              <div className="absolute bottom-6 right-6 w-16 h-16 bg-primary-brand/20 blur-2xl rounded-full"></div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section className="py-12 px-4 sm:px-8 bg-background-brand">
        <div className="max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            
            <div className="flex flex-col items-center text-center px-4 pt-4 md:pt-0">
              <div className="w-16 h-16 bg-blue-50 text-primary-brand rounded-2xl flex items-center justify-center mb-6">
                <Cloud className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-text-dark mb-2">Easy Upload</h4>
              <p className="text-sm text-gray-500 font-medium">Drag & drop your documents securely to the cloud</p>
            </div>

            <div className="flex flex-col items-center text-center px-4 pt-8 md:pt-0">
              <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-6">
                <Sliders className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-text-dark mb-2">Custom Options</h4>
              <p className="text-sm text-gray-500 font-medium">Choose print settings, color, copies & binding</p>
            </div>

            <div className="flex flex-col items-center text-center px-4 pt-8 md:pt-0">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                <Map className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-text-dark mb-2">Track Orders</h4>
              <p className="text-sm text-gray-500 font-medium">Real-time updates at every step of printing</p>
            </div>

            <div className="flex flex-col items-center text-center px-4 pt-8 md:pt-0">
              <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-6">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-text-dark mb-2">Quick Pickup</h4>
              <p className="text-sm text-gray-500 font-medium">Skip the queue and collect prints in minutes</p>
            </div>

          </div>
        </div>
      </section>

      <Footer />

    </div>
  );
}
