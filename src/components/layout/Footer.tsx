import Link from "next/link";
import Image from "next/image";
import { Instagram, Linkedin, Twitter, Github, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#0A2540] text-white pt-20 pb-8 mt-12 rounded-t-[2.5rem] md:rounded-t-[3rem]">
      {/* =========================================
          TOP FOOTER CTA
      ========================================= */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 flex flex-col items-center text-center border-b border-white/10 pb-16 mb-16">
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">Ready to print smarter?</h2>
        <p className="text-slate-300 text-lg max-w-2xl mb-8">
          Find a nearby print shop, upload your documents, and get your printing done without the wait.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link 
            href="/customer/shops"
            className="w-full sm:w-auto bg-[#D9FF47] text-[#0A2540] font-bold px-8 py-4 rounded-full hover:bg-white transition-colors text-center text-lg"
          >
            Find Print Shops
          </Link>
          <Link 
            href="/auth/register-shop"
            className="w-full sm:w-auto bg-white/10 text-white font-bold px-8 py-4 rounded-full hover:bg-white/20 transition-colors border border-white/10 text-center text-lg"
          >
            Register Your Shop
          </Link>
        </div>
      </div>

      {/* =========================================
          FOOTER COLUMNS
      ========================================= */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* COLUMN 1 — YOURPRINTER */}
          <div className="lg:col-span-4 flex flex-col">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl overflow-hidden relative shadow-sm bg-white/10 p-1 flex items-center justify-center">
                <Image src="/logo.png" alt="YourPrinter Logo" width={32} height={32} className="object-contain" />
              </div>
              <span className="font-extrabold text-2xl text-white tracking-tight">YourPrinter</span>
            </Link>
            <p className="text-slate-400 font-medium leading-relaxed mb-4 max-w-sm">
              YourPrinter connects you with nearby print shops so you can upload your documents, customize your order, pay securely, and pick up when it’s ready.
            </p>
            <p className="text-slate-300 font-semibold mb-8">Built by Dreamera Innovations</p>
            
            <div className="flex items-center gap-4">
              <Link href="#" aria-label="Instagram" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/20 transition-all">
                <Instagram className="w-5 h-5" />
              </Link>
              <Link href="#" aria-label="LinkedIn" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/20 transition-all">
                <Linkedin className="w-5 h-5" />
              </Link>
              <Link href="#" aria-label="X (Twitter)" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/20 transition-all">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" aria-label="GitHub" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/20 transition-all">
                <Github className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* COLUMN 2 — FOR CUSTOMERS */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-white mb-6 text-lg">For Customers</h4>
            <ul className="space-y-4">
              <li><Link href="/customer/shops" className="text-slate-400 font-medium hover:text-[#D9FF47] transition-colors">Find Print Shops</Link></li>
              <li><Link href="/how-it-works" className="text-slate-400 font-medium hover:text-[#D9FF47] transition-colors">How It Works</Link></li>
              <li><Link href="/services" className="text-slate-400 font-medium hover:text-[#D9FF47] transition-colors">Services</Link></li>
              <li><Link href="/pricing" className="text-slate-400 font-medium hover:text-[#D9FF47] transition-colors">Pricing</Link></li>
              <li><Link href="/customer/orders" className="text-slate-400 font-medium hover:text-[#D9FF47] transition-colors">My Orders</Link></li>
              <li><span className="text-slate-500 font-medium cursor-not-allowed">Help Center (Soon)</span></li>
            </ul>
          </div>

          {/* COLUMN 3 — FOR SHOP OWNERS */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-white mb-6 text-lg">For Shop Owners</h4>
            <ul className="space-y-4">
              <li><Link href="/auth/register-shop" className="text-slate-400 font-medium hover:text-[#D9FF47] transition-colors">Register Your Shop</Link></li>
              <li><Link href="/shop/dashboard" className="text-slate-400 font-medium hover:text-[#D9FF47] transition-colors">Shop Dashboard</Link></li>
              <li><Link href="/shop/orders" className="text-slate-400 font-medium hover:text-[#D9FF47] transition-colors">Manage Orders</Link></li>
              <li><Link href="/shop/pricing" className="text-slate-400 font-medium hover:text-[#D9FF47] transition-colors">Pricing & Services</Link></li>
              <li><Link href="/shop/settings/payment" className="text-slate-400 font-medium hover:text-[#D9FF47] transition-colors">Payment Setup</Link></li>
              <li><span className="text-slate-500 font-medium cursor-not-allowed">Help & Support (Soon)</span></li>
            </ul>
          </div>

          {/* COLUMN 4 — COMPANY */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-white mb-6 text-lg">Company</h4>
            <ul className="space-y-4">
              <li><Link href="/about" className="text-slate-400 font-medium hover:text-[#D9FF47] transition-colors">About Us</Link></li>
              <li><Link href="#" className="text-slate-400 font-medium hover:text-[#D9FF47] transition-colors">Contact</Link></li>
              <li><Link href="#" className="text-slate-400 font-medium hover:text-[#D9FF47] transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-slate-400 font-medium hover:text-[#D9FF47] transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-slate-400 font-medium hover:text-[#D9FF47] transition-colors">Cancellation Policy</Link></li>
            </ul>
          </div>

          {/* COLUMN 5 — CONTACT */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-white mb-6 text-lg">Contact</h4>
            <ul className="space-y-5">
              <li className="text-slate-300 font-medium">Dreamera Innovations</li>
              <li>
                <a href="tel:9047382788" className="flex items-center gap-3 text-slate-400 font-medium hover:text-white transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  9047382788
                </a>
              </li>
              <li>
                <a href="mailto:dreaminnovationsz@gmail.com" className="flex items-center gap-3 text-slate-400 font-medium hover:text-white transition-colors group break-all">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  dreaminnovationsz<br/>@gmail.com
                </a>
              </li>
            </ul>
          </div>
          
        </div>

        {/* =========================================
            FOOTER BOTTOM BAR
        ========================================= */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col gap-1">
            <p className="text-slate-400 text-sm font-medium">© 2026 YourPrinter. All rights reserved.</p>
            <p className="text-slate-500 text-sm">YourPrinter is a product of Dreamera Innovations.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400 font-medium">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
