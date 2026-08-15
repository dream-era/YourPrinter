"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Share, Heart, MapPin, Star, Phone, Navigation,
  Clock, Zap, FileText, Palette, Book, Layers, ScanFace
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ShopDetails {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  rating: number;
  rating_count: number;
  distanceKm: number;
  estimatedWaitMins: number;
  queueStatus: string;
  openUntil: string;
  description: string;
  coverImages: string[];
  services: string[];
  autoPrintEnabled: boolean;
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  "B&W": <FileText className="w-6 h-6 text-slate-700" />,
  "Color": <Palette className="w-6 h-6 text-blue-500" />,
  "Binding": <Book className="w-6 h-6 text-purple-500" />,
  "Lamination": <Layers className="w-6 h-6 text-emerald-500" />,
  "Spiral Bind": <Book className="w-6 h-6 text-orange-500" />,
  "Scanning": <ScanFace className="w-6 h-6 text-indigo-500" />,
  "Photocopy": <FileText className="w-6 h-6 text-slate-500" />,
  "Passport Photos": <ScanFace className="w-6 h-6 text-rose-500" />,
};

export default function ShopDetailsClient({ shopId }: { shopId: string }) {
  const router = useRouter();
  const [shop, setShop] = useState<ShopDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchShop = async () => {
      try {
        const res = await fetch(`/api/shops/${shopId}`);
        if (!res.ok) throw new Error("Shop not found");
        const data = await res.json();
        if (mounted) setShop(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchShop();

    // Subscribe to realtime queue_status updates
    const supabase = createClient();
    const channel = supabase
      .channel(`shop-${shopId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "shops", filter: `id=eq.${shopId}` }, (payload) => {
        if (mounted) {
          setShop((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              queueStatus: payload.new.queue_status === "busy" ? "Busy" : payload.new.queue_status === "moderate" ? "Moderate" : "Quiet"
            };
          });
        }
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [shopId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4 animate-pulse">
        <div className="h-10 w-full bg-slate-100 rounded-lg mb-6"></div>
        <div className="h-48 w-full bg-slate-100 rounded-3xl mb-6"></div>
        <div className="h-8 w-2/3 bg-slate-100 rounded mb-4"></div>
        <div className="h-4 w-1/2 bg-slate-100 rounded mb-8"></div>
        <div className="flex gap-2 mb-8">
          <div className="h-8 w-20 bg-slate-100 rounded-full"></div>
          <div className="h-8 w-24 bg-slate-100 rounded-full"></div>
          <div className="h-8 w-32 bg-slate-100 rounded-full"></div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <h1 className="text-xl font-bold mb-4">Shop not found</h1>
        <button onClick={() => router.back()} className="text-blue-600 font-medium">Go Back</button>
      </div>
    );
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shop.name,
          text: `Check out ${shop.name} on YourPrinter!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    }
  };

  const getQueueColor = (status: string) => {
    if (status?.toLowerCase() === "busy") return "bg-rose-100 text-rose-600";
    if (status?.toLowerCase() === "moderate") return "bg-orange-100 text-orange-600";
    return "bg-emerald-100 text-emerald-600";
  };

  return (
    <div className="min-h-screen bg-white pb-32 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-6 h-6 text-slate-800" />
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleShare}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition"
          >
            <Share className="w-5 h-5 text-slate-800" />
          </button>
          <button 
            onClick={() => setIsFavorite(!isFavorite)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition"
          >
            <Heart className={`w-6 h-6 ${isFavorite ? "fill-rose-500 text-rose-500" : "text-slate-800"}`} />
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto">
        {/* Cover Image */}
        <div className="px-4 mb-6">
        <div className="relative w-full h-[220px] rounded-[24px] overflow-hidden shadow-sm">
          {shop.coverImages && shop.coverImages.length > 0 ? (
            <Image
              src={shop.coverImages[0]}
              alt={shop.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
              No Image
            </div>
          )}
          {/* Mock Logo Overlay */}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
             <div className="bg-[#1e40af] text-white px-4 py-2 flex items-center gap-2 rounded-lg font-bold shadow-lg transform -rotate-2">
                <FileText className="w-5 h-5" />
                <span className="text-sm tracking-wider uppercase">{shop.name}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="px-5">
        {/* Basic Info */}
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-bold text-slate-900 leading-tight pr-4">{shop.name}</h1>
          <div className="flex items-center gap-1 shrink-0 pt-1">
            <Star className="w-5 h-5 fill-blue-600 text-blue-600" />
            <span className="font-bold text-slate-900">{shop.rating.toFixed(1)}</span>
            <span className="text-slate-500 text-sm">({shop.rating_count})</span>
          </div>
        </div>

        <div className="flex items-start gap-2 mb-4 text-slate-600">
          <MapPin className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
          <span className="text-[15px]">{shop.address}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
          <span>{shop.distanceKm.toFixed(1)} km away</span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span className="flex items-center gap-1">
             🚶 Walking {Math.ceil(shop.distanceKm * 12)} min
          </span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-8">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${getQueueColor(shop.queueStatus)}`}>
            <span className="text-base leading-none">😊</span>
            {shop.queueStatus}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-blue-50 text-blue-600">
            <Clock className="w-4 h-4" />
            Ready in {shop.estimatedWaitMins} min
          </div>
          {shop.autoPrintEnabled && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-purple-50 text-purple-600">
              <Zap className="w-4 h-4 fill-purple-600" />
              24/7 AutoPrint
            </div>
          )}
        </div>

        {/* Services */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Services</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
            {shop.services?.map((service) => (
              <div key={service} className="flex flex-col items-center gap-2 min-w-[70px]">
                <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                  {SERVICE_ICONS[service] || <FileText className="w-6 h-6 text-slate-400" />}
                </div>
                <span className="text-xs font-semibold text-slate-700 text-center">{service}</span>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-3">About</h2>
          <p className="text-slate-600 text-[15px] leading-relaxed">
            {shop.description}
          </p>
        </div>

        {/* Action Buttons (Secondary) */}
        <div className="flex gap-3 mb-8">
          <button 
            onClick={() => window.open(`https://maps.google.com/?q=${shop.latitude},${shop.longitude}`, '_blank')}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-slate-200 text-blue-600 font-semibold active:bg-slate-50 transition"
          >
            <Navigation className="w-5 h-5" />
            Directions
          </button>
          <button 
            onClick={() => window.location.href = `tel:${shop.phone}`}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 text-white font-semibold shadow-md active:bg-blue-700 transition"
          >
            <Phone className="w-5 h-5" />
            Call Shop
          </button>
        </div>
      </div>
      </div>

      {/* Sticky Bottom Primary Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-3xl mx-auto">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/customer/upload?shopId=${shop.id}`)}
            className="w-full bg-slate-900 text-white font-semibold text-lg py-4 rounded-[20px] shadow-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Upload & Print
          </motion.button>
        </div>
      </div>

    </div>
  );
}
