"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Minus, Plus, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export default function OptionsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shopId") || "";
  const documentId = searchParams.get("documentId") || "";
  const fileName = searchParams.get("file") || "Document.pdf";
  const initialPages = parseInt(searchParams.get("pages") || "1");

  const [isLoading, setIsLoading] = useState(true);
  const [shop, setShop] = useState<any>(null);

  // Form State
  const [colorMode, setColorMode] = useState<"bw" | "color">("bw");
  const [sides, setSides] = useState<"single" | "double">("single");
  const [copies, setCopies] = useState<number>(1);
  const [pageRange, setPageRange] = useState<string>("");
  const [paperSize, setPaperSize] = useState<"A4" | "A3" | "A5" | "Letter" | "Legal">("A4");
  const [paperQuality, setPaperQuality] = useState<string>("Standard");
  const [bindingType, setBindingType] = useState<string>("None (Loose Sheets)");
  
  // Additional Options
  const [addOptions, setAddOptions] = useState({
    autoBothSides: false,
    pageNumbering: false,
    transparentCover: false,
    highQuality: false,
  });

  const [priceBreakdown, setPriceBreakdown] = useState<any>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    const fetchShop = async () => {
      try {
        const res = await fetch(`/api/shops/${shopId}`);
        if (!res.ok) throw new Error("Failed to fetch shop");
        const data = await res.json();
        setShop(data);
      } catch (err) {
        toast.error("Could not load shop details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchShop();
  }, [shopId]);

  // Handle increment/decrement
  const updateCopies = (val: number) => {
    const newVal = copies + val;
    if (newVal >= 1 && newVal <= 100) setCopies(newVal);
  };

  // Live Price Calculation via Backend
  useEffect(() => {
    if (!shopId || !documentId) return;

    const timer = setTimeout(async () => {
      setIsCalculatingPrice(true);
      try {
        const res = await fetch("/api/pricing/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopId,
            documentId,
            printOptions: {
              color: colorMode,
              sides: sides,
              copies: copies,
              binding: bindingType === "None (Loose Sheets)" ? "none" : bindingType === "Spiral Binding" ? "spiral" : bindingType === "Stapled" ? "staple" : "hardbound",
              lamination: addOptions.transparentCover,
              urgent: false // Add urgent logic here if needed
            }
          })
        });
        if (res.ok) {
          const data = await res.json();
          setPriceBreakdown(data);
        }
      } catch (err) {
        console.error("Price calc failed", err);
      } finally {
        setIsCalculatingPrice(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [shopId, documentId, colorMode, sides, copies, bindingType, addOptions.transparentCover]);

  const finalTotal = priceBreakdown ? (priceBreakdown.totalAmountPaise / 100) : 0;
  const subtotal = priceBreakdown ? (priceBreakdown.baseAmountPaise / 100) : 0;
  const bindingFee = priceBreakdown ? (priceBreakdown.bindingAmountPaise / 100) : 0;
  const laminationFee = priceBreakdown ? (priceBreakdown.laminationAmountPaise / 100) : 0;
  const tax = priceBreakdown ? (finalTotal * 0.18) : 0; // Assuming tax is computed or shown externally

  const handleContinue = () => {
    if (!shopId) {
      toast.error("Missing shop context.");
      return;
    }
    
    // Save state and push to review
    // We pass the config via URL for the sake of this demo flow
    const url = new URLSearchParams({
      shopId,
      documentId,
      file: fileName,
      pages: initialPages.toString(),
      colorMode,
      copies: copies.toString(),
      duplex: (sides === "double").toString(),
      paperSize,
      binding: bindingType,
      total: finalTotal.toString(),
    });

    router.push(`/customer/review?${url.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-[240px] font-sans">
      {/* Header */}
      <header className="bg-white px-4 pt-6 pb-4 flex items-center shadow-sm sticky top-0 z-40 max-w-3xl mx-auto w-full">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition -ml-2"
        >
          <ArrowLeft className="w-6 h-6 text-slate-900" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 ml-2">Print Options</h1>
      </header>

      <div className="max-w-3xl mx-auto w-full">
      {/* Stepper */}
      <div className="bg-white px-6 pb-6 pt-2 shadow-sm mb-6 flex justify-between items-center relative rounded-b-3xl">
        <div className="absolute top-1/2 left-10 right-10 h-[2px] bg-slate-100 -z-10 -translate-y-1/2"></div>
        
        <div className="flex flex-col items-center gap-2 bg-white px-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center border-2 border-white shadow-sm text-sm">
            1
          </div>
          <span className="text-xs font-semibold text-slate-500">Upload</span>
        </div>
        
        <div className="flex flex-col items-center gap-2 bg-white px-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center border-2 border-white shadow-sm text-sm">
            2
          </div>
          <span className="text-xs font-bold text-blue-600">Options</span>
        </div>
        
        <div className="flex flex-col items-center gap-2 bg-white px-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center border-2 border-white shadow-sm text-sm">
            3
          </div>
          <span className="text-xs font-semibold text-slate-500">Review</span>
        </div>
      </div>

      {/* Options Form */}
      <div className="px-5 space-y-8">
        
        {/* Color Mode */}
        <section>
          <h2 className="text-[15px] font-bold text-slate-900 mb-3 ml-1">Color Mode</h2>
          <div className="flex gap-3">
            <button 
              onClick={() => setColorMode("bw")}
              className={`flex-1 py-3.5 rounded-xl font-semibold transition-all ${
                colorMode === "bw" 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "bg-[#F8FAFC] text-slate-600 border border-slate-200"
              }`}
            >
              B&W
            </button>
            <button 
              onClick={() => setColorMode("color")}
              className={`flex-1 py-3.5 rounded-xl font-semibold transition-all ${
                colorMode === "color" 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "bg-[#F8FAFC] text-slate-600 border border-slate-200"
              }`}
            >
              Color
            </button>
          </div>
        </section>

        {/* Sides */}
        <section>
          <h2 className="text-[15px] font-bold text-slate-900 mb-3 ml-1">Sides</h2>
          <div className="flex gap-3">
            <button 
              onClick={() => setSides("single")}
              className={`flex-1 py-3.5 rounded-xl font-semibold transition-all ${
                sides === "single" 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "bg-[#F8FAFC] text-slate-600 border border-slate-200"
              }`}
            >
              Single
            </button>
            <button 
              onClick={() => setSides("double")}
              className={`flex-1 py-3.5 rounded-xl font-semibold transition-all ${
                sides === "double" 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "bg-[#F8FAFC] text-slate-600 border border-slate-200"
              }`}
            >
              Double
            </button>
          </div>
        </section>

        {/* Copies */}
        <section>
          <h2 className="text-[15px] font-bold text-slate-900 mb-3 ml-1">Copies</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => updateCopies(-1)}
              className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center bg-white text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="flex-1 h-12 rounded-xl border border-slate-200 flex items-center justify-center bg-white font-bold text-lg text-slate-900">
              {copies}
            </div>
            <button 
              onClick={() => updateCopies(1)}
              className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center bg-white text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Page Range */}
        <section>
          <h2 className="text-[15px] font-bold text-slate-900 mb-3 ml-1">Page Range (Optional)</h2>
          <input 
            type="text" 
            placeholder="e.g. 1-5, 8, 11-12"
            value={pageRange}
            onChange={(e) => setPageRange(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          <p className="text-xs text-slate-500 mt-2 ml-1">Leave blank for all pages</p>
        </section>

        {/* Binding Type */}
        <section>
          <h2 className="text-[15px] font-bold text-slate-900 mb-3 ml-1">Binding Type</h2>
          <div className="relative">
            <select 
              value={bindingType}
              onChange={(e) => setBindingType(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-[#F8FAFC] text-slate-900 appearance-none focus:outline-none focus:border-blue-500 transition-all font-medium"
            >
              <option>None (Loose Sheets)</option>
              <option>Spiral Binding</option>
              <option>Comb Binding</option>
              <option>Stapled</option>
              <option>Hardcover</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        </section>

        {/* Paper Size */}
        <section>
          <h2 className="text-[15px] font-bold text-slate-900 mb-3 ml-1">Paper Size</h2>
          <div className="relative">
            <select 
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as any)}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-[#F8FAFC] text-slate-900 appearance-none focus:outline-none focus:border-blue-500 transition-all font-medium"
            >
              <option value="A4">A4</option>
              <option value="A3">A3</option>
              <option value="A5">A5</option>
              <option value="Letter">Letter</option>
              <option value="Legal">Legal</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        </section>

        {/* Paper Quality */}
        <section>
          <h2 className="text-[15px] font-bold text-slate-900 mb-3 ml-1">Paper Quality</h2>
          <div className="relative">
            <select 
              value={paperQuality}
              onChange={(e) => setPaperQuality(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-[#F8FAFC] text-slate-900 appearance-none focus:outline-none focus:border-blue-500 transition-all font-medium"
            >
              <option>Standard</option>
              <option>Premium</option>
              <option>Glossy</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        </section>

        {/* Additional Options */}
        <section className="pb-4">
          <h2 className="text-[15px] font-bold text-slate-900 mb-3 ml-1">Additional Options</h2>
          <div className="space-y-3">
            {[
              { id: "highQuality", label: "High Quality Printing" },
              { id: "autoBothSides", label: "Print Both Sides Automatically" },
              { id: "pageNumbering", label: "Page Numbering" },
              { id: "transparentCover", label: "Add Transparent Cover Page" },
            ].map((opt) => (
              <label key={opt.id} className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-white shadow-sm cursor-pointer hover:border-slate-200 transition-all">
                <input 
                  type="checkbox" 
                  checked={(addOptions as any)[opt.id]}
                  onChange={(e) => setAddOptions({...addOptions, [opt.id]: e.target.checked})}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-700 text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </section>
      </div>
      </div>

      {/* Sticky Bottom Area: Live Price + Continue */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 pb-safe z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
        <div className="p-5 space-y-4 max-w-3xl mx-auto">
          
          {/* Live Price Summary */}
          <div className="space-y-2 relative">
            {isCalculatingPrice && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              </div>
            )}
            <div className="flex justify-between text-sm font-medium text-slate-600">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {bindingFee > 0 && (
              <div className="flex justify-between text-sm font-medium text-slate-600">
                <span>Binding Fee</span>
                <span>₹{bindingFee.toFixed(2)}</span>
              </div>
            )}
            {laminationFee > 0 && (
              <div className="flex justify-between text-sm font-medium text-slate-600">
                <span>Lamination/Cover Fee</span>
                <span>₹{laminationFee.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-100 flex justify-between items-end">
              <span className="font-bold text-slate-900">Total Amount</span>
              <span className="text-xl font-black text-blue-600">₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={handleContinue}
            className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-[20px] shadow-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            Continue
          </motion.button>
        </div>
      </div>

    </div>
  );
}
