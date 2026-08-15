"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import QRCode from "react-qr-code";
import confetti from "canvas-confetti";
import { 
  ArrowLeft, Share, Users, CheckCircle2, 
  Map, Phone, MessageCircle, AlertTriangle, 
  FileText, ChevronDown, ChevronUp, RefreshCw, Heart, Share2, Check
} from "lucide-react";
import { useRouter } from "next/navigation";

type OrderTrackingClientProps = {
  orderId: string;
};

export default function OrderTrackingClient({ orderId }: OrderTrackingClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [queuePos, setQueuePos] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const supabase = createClient();
  const confettiFired = useRef(false);

  useEffect(() => {
    let mounted = true;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (res.ok && data.order) {
          if (mounted) setOrder(data.order);
        } else {
          if (mounted) setError(data.error || "Failed to load order");
        }
      } catch (err) {
        if (mounted) setError("An error occurred");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchOrder();

    // Subscribe to realtime order updates
    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase]);

  // Fire confetti when order becomes ready
  useEffect(() => {
    if (order && order.status === 'ready_for_pickup' && !confettiFired.current) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.3 },
        colors: ['#22C55E', '#16A34A', '#4ADE80', '#DFFF3E']
      });
      confettiFired.current = true;
    }
  }, [order?.status]);

  const stepReady = order && ["ready_for_pickup", "completed"].includes(order.status);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading tracking details...</p>
      </div>
    );
  }

  if (error || !order) {
    return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-red-500">{error || "Order not found"}</div>;
  }

  // Derived state
  const isCancelled = order.status === "cancelled";
  
  const stepReceived = ["accepted", "processing", "ready_for_pickup", "completed"].includes(order.status);
  const stepPrinting = ["processing", "ready_for_pickup", "completed"].includes(order.status);
  const stepCompleted = order.status === "completed";

  const formattedTime = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(order.created_at || order.createdAt));
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Track My Print Order',
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // In a real app, you would fetch from API. We simulate delay here since Realtime does it automatically anyway.
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const getStatusBadge = () => {
    switch (order.status) {
      case "pending": return { text: "Queued", color: "bg-blue-100 text-[#2563EB]" };
      case "accepted": return { text: "Accepted", color: "bg-blue-100 text-[#2563EB]" };
      case "processing": return { text: "Printing", color: "bg-blue-100 text-[#2563EB]" };
      case "ready_for_pickup": return { text: "Ready", color: "bg-green-100 text-green-700" };
      case "completed": return { text: "Completed", color: "bg-green-100 text-green-700" };
      case "cancelled": return { text: "Cancelled", color: "bg-red-100 text-red-700" };
      default: return { text: "Unknown", color: "bg-gray-100 text-gray-700" };
    }
  };
  
  const badge = getStatusBadge();

  // ----- RENDER READY FOR PICKUP STATE -----
  if (order.status === "ready_for_pickup") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 font-sans">
        {/* Top App Bar */}
        <header className="sticky top-0 z-50 bg-[#F8FAFC]/90 backdrop-blur-xl border-b border-transparent shadow-sm">
          <div className="max-w-[650px] mx-auto px-4 h-16 flex items-center justify-between">
            <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-slate-800">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-900">Order Status</h1>
            <div className="flex items-center gap-1 -mr-2">
              <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-slate-700">
                <Share className="w-5 h-5" />
              </button>
              <button onClick={handleRefresh} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-slate-700">
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-[650px] mx-auto p-4 flex flex-col gap-5 pt-2">
          
          {/* Success Banner */}
          <motion.div 
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#16A34A] rounded-[24px] p-6 text-white shadow-[0_8px_30px_rgba(34,197,94,0.3)] relative overflow-hidden"
          >
            {/* Background elements to match the image */}
            <div className="absolute top-2 right-4 w-4 h-1 bg-[#DFFF3E] rotate-45 rounded-full opacity-80"></div>
            <div className="absolute bottom-4 right-8 w-3 h-1 bg-[#DFFF3E] -rotate-45 rounded-full opacity-80"></div>
            <div className="absolute top-6 right-20 w-3 h-3 bg-white/20 rotate-12 rounded-sm"></div>
            <div className="absolute bottom-6 left-2 w-3 h-3 bg-white/20 -rotate-12 rounded-sm"></div>

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
              <div>
                <h2 className="text-[22px] font-bold leading-tight">Your order is ready!</h2>
                <p className="text-white/90 text-[15px] font-medium mt-0.5">Order #{order.order_number || order.orderNumber}</p>
              </div>
            </div>
          </motion.div>

          {/* Pickup Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[24px] p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-gray-100/50 flex flex-col items-center"
          >
            <div className="w-full text-left mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Ready for Pickup</h2>
              <p className="text-slate-500 text-[15px] font-medium mt-1">Today at {formattedTime}</p>
            </div>

            <p className="text-slate-600 text-sm font-semibold mb-4 text-center">
              Show this QR code at the counter
            </p>

            {/* QR Code Container */}
            <div className="bg-white p-6 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 w-fit mx-auto mb-6">
              <QRCode 
                value={`order_id: ${order.id}\npickup_token: ${order.pickup_code || order.pickupCode}`} 
                size={200} 
                level="H" // High error correction
              />
            </div>

            {/* Share QR Button */}
            <button 
              onClick={handleShare}
              className="w-full max-w-[280px] bg-white text-[#2563EB] border-2 border-blue-100 font-bold text-base py-3.5 rounded-[16px] hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" /> Share QR
            </button>
          </motion.div>

          {/* Thank You Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#F0FDF4] rounded-[24px] p-5 shadow-sm border border-green-100/50 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-green-200 shrink-0">
              <Heart className="w-6 h-6 text-[#16A34A]" fill="currentColor" />
            </div>
            <div>
              <h3 className="text-slate-900 font-bold text-lg leading-tight mb-0.5">Thank you!</h3>
              <p className="text-slate-600 text-[14px]">We hope you had a great experience.</p>
            </div>
          </motion.div>

          {/* Shop Details */}
          <div className="mt-2">
            <h3 className="font-bold text-[19px] text-slate-900 mb-4 ml-1">Shop Details</h3>
            <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-gray-100/50">
              <div className="flex gap-4 items-center mb-5">
                <div className="w-20 h-20 bg-gray-100 rounded-[18px] overflow-hidden shrink-0 border border-gray-200 relative">
                  <img src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" alt="Shop" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/10"></div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg leading-tight">{order.shop.name}</h4>
                  <p className="text-slate-500 text-[14px] mt-1 leading-snug pr-2">{order.shop.address}</p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-2">
                <button className="flex-1 bg-white border-2 border-blue-100 text-[#2563EB] font-bold py-3 rounded-[16px] flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors">
                  <Map className="w-4 h-4" /> Directions
                </button>
                <button className="flex-1 bg-white border-2 border-gray-100 text-slate-700 font-bold py-3 rounded-[16px] flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                  <Phone className="w-4 h-4" /> Call Shop
                </button>
              </div>
            </div>
          </div>

          <div className="pb-10"></div>
        </main>
      </div>
    );
  }

  // ----- RENDER STANDARD TRACKING STATE (Pending, Processing, Completed, Cancelled) -----
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 font-sans">
      
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 bg-[#F8FAFC]/90 backdrop-blur-xl border-b border-transparent shadow-sm">
        <div className="max-w-[700px] mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-slate-800">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold">Order Status</h1>
          <button onClick={handleShare} className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors text-slate-800">
            <Share className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-[700px] mx-auto p-4 flex flex-col gap-5">
        
        {/* Live Queue Banner */}
        <AnimatePresence mode="popLayout">
          {!isCancelled && !stepCompleted && (
            <motion.div 
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="bg-gradient-to-r from-[#2563EB] to-blue-500 rounded-[24px] p-5 text-white shadow-md shadow-blue-500/20 flex items-center gap-4"
            >
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  {`Your order is ${queuePos}${queuePos === 1 ? 'st' : queuePos === 2 ? 'nd' : queuePos === 3 ? 'rd' : 'th'} in queue`}
                </h2>
                <p className="text-white/80 text-sm font-medium">
                  Updating in real-time
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">#{order.order_number || order.orderNumber}</h2>
              <p className="text-slate-500 text-sm font-medium mt-1">Placed today at {formattedTime}</p>
            </div>
            <motion.div 
              key={badge.text}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`px-4 py-1.5 rounded-full text-sm font-bold ${badge.color}`}
            >
              {badge.text}
            </motion.div>
          </div>

          {/* Timeline */}
          {!isCancelled ? (
            <div className="relative pl-4 space-y-10 before:absolute before:inset-0 before:ml-[23px] before:w-[2px] before:-translate-x-px before:bg-gray-200">
              
              {/* Order Received */}
              <div className="relative z-10 flex gap-5 group">
                <motion.div 
                  initial={false}
                  animate={{ backgroundColor: stepReceived ? "#2563EB" : "#fff", borderColor: stepReceived ? "#2563EB" : "#e5e7eb" }}
                  className={`w-[22px] h-[22px] mt-1 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors duration-500 ${stepReceived ? 'shadow-[0_0_15px_rgba(37,99,235,0.4)]' : ''}`}
                >
                  {stepReceived && <CheckCircle2 className="w-4 h-4 text-white" />}
                </motion.div>
                <div>
                  <h3 className={`font-bold text-[17px] ${stepReceived ? 'text-slate-900' : 'text-slate-400'}`}>Order Received</h3>
                  <p className="text-slate-500 text-[14px] mt-0.5 font-medium">Confirmed and assigned to shop</p>
                </div>
              </div>

              {/* Printing */}
              <div className="relative z-10 flex gap-5 group">
                <motion.div 
                  initial={false}
                  animate={{ backgroundColor: stepPrinting ? "#2563EB" : "#fff", borderColor: stepPrinting ? "#2563EB" : "#e5e7eb" }}
                  className={`w-[22px] h-[22px] mt-1 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors duration-500 ${order.status === 'processing' ? 'shadow-[0_0_15px_rgba(37,99,235,0.4)] ring-4 ring-blue-50' : ''}`}
                >
                  {stepPrinting && <CheckCircle2 className="w-4 h-4 text-white" />}
                </motion.div>
                <div className="w-full">
                  <h3 className={`font-bold text-[17px] ${stepPrinting ? 'text-slate-900' : 'text-slate-400'}`}>Printing</h3>
                  <p className="text-slate-500 text-[14px] mt-0.5 font-medium">
                    {order.status === 'processing' ? 'Currently printing' : stepReady ? 'Printing completed' : 'Waiting for printer'}
                  </p>
                  
                  <AnimatePresence>
                    {order.status === 'processing' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 bg-gray-50 rounded-2xl p-4 overflow-hidden"
                      >
                        <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                          <span>Printing in progress...</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden relative">
                          <motion.div 
                            className="absolute top-0 bottom-0 left-0 bg-[#2563EB]"
                            initial={{ left: "-100%", width: "100%" }}
                            animate={{ left: "100%" }}
                            transition={{ ease: "linear", duration: 1.5, repeat: Infinity }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Collected / Final State */}
              <div className="relative z-10 flex gap-5 group">
                <motion.div 
                  initial={false}
                  animate={{ backgroundColor: stepCompleted ? "#2563EB" : "#fff", borderColor: stepCompleted ? "#2563EB" : "#e5e7eb" }}
                  className={`w-[22px] h-[22px] mt-1 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors duration-500 ${order.status === 'completed' ? 'shadow-[0_0_15px_rgba(37,99,235,0.4)]' : ''}`}
                >
                  {stepCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
                </motion.div>
                <div>
                  <h3 className={`font-bold text-[17px] ${stepCompleted ? 'text-slate-900' : 'text-slate-400'}`}>Collected</h3>
                  <p className="text-slate-500 text-[14px] mt-0.5 font-medium">
                    {stepCompleted ? 'Order successfully delivered' : 'Awaiting your arrival'}
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-4 bg-red-50 text-red-700 rounded-2xl font-bold flex items-center gap-3">
              <AlertTriangle className="w-5 h-5" />
              This order was cancelled.
            </div>
          )}
        </div>

        {/* Shop Info Card */}
        <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50">
          <h3 className="font-bold text-lg mb-4">Shop Details</h3>
          <div className="flex gap-4 items-center mb-5">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden shrink-0 border border-gray-200">
              <img src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" alt="Shop" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">{order.shop.name}</h4>
              <p className="text-slate-500 text-sm mt-0.5 leading-snug">{order.shop.address}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button className="flex-1 bg-blue-50 text-[#2563EB] font-bold py-3.5 rounded-[16px] flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors">
              <Map className="w-4 h-4" /> Directions
            </button>
            <button className="flex-1 bg-gray-50 text-slate-700 font-bold py-3.5 rounded-[16px] flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors border border-gray-100">
              <Phone className="w-4 h-4" /> Call Shop
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50">
          <button 
            onClick={() => setShowSummary(!showSummary)}
            className="w-full p-5 flex items-center justify-between font-bold text-lg bg-transparent"
          >
            Order Summary
            {showSummary ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          
          <AnimatePresence>
            {showSummary && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-5 pb-5 space-y-3"
              >
                <div className="flex justify-between text-sm py-2 border-t border-gray-100 pt-4">
                  <span className="text-slate-500 font-medium flex items-center gap-2"><FileText className="w-4 h-4" /> File</span>
                  <span className="font-bold text-right truncate max-w-[180px]">{order.document?.original_filename || order.document?.fileName || "Document"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Pages</span>
                  <span className="font-bold">{order.document?.page_count || order.totalPages || 1}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Copies</span>
                  <span className="font-bold">{order.copies || order.print_options?.copies || 1}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Color Mode</span>
                  <span className="font-bold">{(order.print_options?.color || order.colorMode) === 'bw' ? 'Black & White' : 'Color'}</span>
                </div>
                <div className="flex justify-between text-sm pb-2 border-b border-gray-100">
                  <span className="text-slate-500 font-medium">Sides</span>
                  <span className="font-bold">{(order.print_options?.sides === 'double' || order.duplex) ? 'Double Sided' : 'Single Sided'}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#2563EB] pt-1">
                  <span>Total Paid</span>
                  <span>₹{order.amount_paise ? (order.amount_paise / 100).toFixed(2) : order.totalAmount}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Need Help */}
        <div className="text-center mt-4 mb-8">
          <p className="text-slate-500 text-sm font-medium mb-3">Need Help?</p>
          <div className="flex justify-center gap-3">
            <button className="bg-white border border-gray-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 hover:bg-gray-50 transition-colors">
              <MessageCircle className="w-4 h-4" /> Chat Support
            </button>
            <button className="bg-white border border-gray-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors">
              Report Issue
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
