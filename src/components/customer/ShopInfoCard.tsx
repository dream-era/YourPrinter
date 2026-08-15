"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Cloud, Clock, MapPin } from "lucide-react";
import type { MapShop } from "@/features/discovery/use-map-shops";

interface ShopInfoCardProps {
  shop: MapShop | null;
  onClose: () => void;
}

export default function ShopInfoCard({ shop, onClose }: ShopInfoCardProps) {
  const router = useRouter();

  if (!shop) return null;

  const handleUpload = () => {
    // Navigate to upload page and pass the shop ID
    router.push(`/customer/upload?shopId=${shop.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Quiet": return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "Moderate": return "text-orange-600 bg-orange-50 border-orange-100";
      case "Busy": return "text-red-600 bg-red-50 border-red-100";
      case "24/7": return "text-blue-600 bg-blue-50 border-blue-100";
      default: return "text-gray-600 bg-gray-50 border-gray-100";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="absolute bottom-24 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[400px] bg-white rounded-3xl shadow-2xl p-4 border border-slate-100 z-40"
      >
        <div className="flex gap-4">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-slate-100 cursor-pointer" onClick={() => router.push(`/customer/shops/${shop.id}`)}>
            {shop.image ? (
              <Image src={shop.image} alt={shop.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                <span className="text-slate-400 font-medium">No Image</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0 py-1 cursor-pointer" onClick={() => router.push(`/customer/shops/${shop.id}`)}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-lg text-slate-900 truncate">{shop.name}</h3>
              <div className="flex items-center gap-1 shrink-0 bg-blue-50 px-2 py-0.5 rounded-lg">
                <Star className="w-3.5 h-3.5 text-[#2563EB] fill-[#2563EB]" />
                <span className="text-sm font-bold text-slate-900">{shop.rating}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {shop.distanceKm} km away</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Ready in {shop.estimatedWaitMins} min</span>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusColor(shop.queueStatus)}`}>
                {shop.queueStatus === "Quiet" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>}
                {shop.queueStatus}
              </span>
              <span className="text-xs font-medium text-slate-500">
                Open until {shop.openUntil}
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={handleUpload}
          className="w-full mt-4 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
        >
          <Cloud className="w-5 h-5" />
          Upload & Print
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
