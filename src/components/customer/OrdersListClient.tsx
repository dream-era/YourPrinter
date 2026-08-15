"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, Grid, RefreshCw, ShoppingBag, 
  CheckCircle2, FileText, ChevronRight, 
  Search, Image as ImageIcon, File
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Order = {
  id: string;
  orderNumber: string;
  totalPages: number;
  colorMode: string;
  copies: number;
  createdAt: string | Date;
  status: string;
  document: {
    fileName: string;
  };
  shop: {
    name: string;
  };
};

export default function OrdersListClient({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Subscribe to realtime order updates
    const channel = supabase
      .channel("my-orders-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          setOrders((prev) => {
            const index = prev.findIndex(o => o.id === payload.new.id);
            if (index > -1) {
              const updated = [...prev];
              updated[index] = { ...updated[index], ...payload.new };
              
              // Show toast notification for status change
              const oldStatus = prev[index].status;
              const newStatus = payload.new.status;
              if (oldStatus !== newStatus) {
                if (newStatus === "processing") toast.success(`Order #${updated[index].orderNumber} is now printing!`);
                if (newStatus === "ready_for_pickup") toast.success(`Order #${updated[index].orderNumber} is ready for pickup!`);
                if (newStatus === "completed") toast.success(`Order #${updated[index].orderNumber} completed successfully.`);
              }
              
              return updated;
            }
            return prev;
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          // Refresh the server component which securely fetches the user's data
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  const tabs = [
    { id: "All", label: "All", icon: Grid },
    { id: "In Progress", label: "In Progress", icon: RefreshCw },
    { id: "Ready", label: "Ready", icon: ShoppingBag },
    { id: "Completed", label: "Completed", icon: CheckCircle2 },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const getFilteredOrders = () => {
    return orders.filter(order => {
      // Tab Filter
      if (activeTab === "In Progress" && !["pending", "accepted", "processing"].includes(order.status)) return false;
      if (activeTab === "Ready" && order.status !== "ready_for_pickup") return false;
      if (activeTab === "Completed" && order.status !== "completed") return false;
      
      // Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          order.orderNumber?.toLowerCase().includes(query) ||
          order.document?.fileName?.toLowerCase().includes(query) ||
          order.shop?.name?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  };

  const filteredOrders = getFilteredOrders();

  const getCardStyle = (status: string) => {
    switch (status) {
      case "pending":
      case "accepted":
      case "processing":
        return {
          iconBg: "bg-blue-50 text-[#2563EB]",
          badgeBg: "bg-blue-50 text-[#2563EB]",
          label: "In Progress"
        };
      case "ready_for_pickup":
        return {
          iconBg: "bg-purple-50 text-purple-500",
          badgeBg: "bg-green-50 text-green-700",
          label: "Ready for Pickup"
        };
      case "completed":
        return {
          iconBg: "bg-green-50 text-green-500",
          badgeBg: "bg-green-50 text-green-700",
          label: "Completed"
        };
      case "cancelled":
        return {
          iconBg: "bg-red-50 text-red-500",
          badgeBg: "bg-red-50 text-red-600",
          label: "Cancelled"
        };
      default:
        return {
          iconBg: "bg-gray-50 text-gray-500",
          badgeBg: "bg-gray-50 text-gray-600",
          label: "Unknown"
        };
    }
  };

  const formatOrderDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const timeString = timeFormatter.format(date);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${timeString}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${timeString}`;
    } else {
      const dateFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' });
      return `${dateFormatter.format(date)}, ${timeString}`;
    }
  };

  const getFileIcon = (fileName: string) => {
    if (!fileName) return <FileText className="w-6 h-6" />;
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return <ImageIcon className="w-6 h-6" />;
    if (lower.endsWith(".pdf")) return <FileText className="w-6 h-6" />;
    return <File className="w-6 h-6" />;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-[100px] font-sans">
      
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-[#F8FAFC]/90 backdrop-blur-xl border-b border-transparent">
        <div className="max-w-[700px] mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-slate-800">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">My Orders</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </header>

      <main className="max-w-[700px] mx-auto pt-2 px-4 flex flex-col gap-5">
        
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all font-medium"
            placeholder="Search orders, shops, or files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 -mx-4 px-4 snap-x">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`snap-start relative flex items-center gap-2 px-5 py-3 rounded-[20px] font-bold text-sm whitespace-nowrap transition-all duration-300 ${
                  isActive 
                    ? "bg-[#2563EB] text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)]" 
                    : "bg-white text-slate-600 border border-slate-100 hover:bg-slate-50 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Orders List */}
        <div className="flex flex-col gap-4 mt-2 relative">
          
          {/* Pull to refresh visualizer */ }
          {isRefreshing && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order, i) => {
                const style = getCardStyle(order.status);
                
                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <Link href={`/customer/order/${order.id}`}>
                      <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group">
                        
                        <div className="flex items-start gap-4">
                          {/* File Icon */}
                          <div className={`w-[52px] h-[52px] rounded-[16px] flex items-center justify-center shrink-0 ${style.iconBg}`}>
                            {getFileIcon(order.document?.fileName || "Unknown")}
                          </div>
                          
                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-lg font-black text-slate-900 tracking-tight truncate pr-2">
                                #{order.orderNumber}
                              </h3>
                              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#2563EB] transition-colors shrink-0" />
                            </div>
                            
                            <p className="text-[14px] text-slate-500 font-medium mb-4 truncate">
                              {order.totalPages} pages • {order.colorMode === 'bw' ? 'B&W' : 'Color'} • {order.copies} {order.copies === 1 ? 'Copy' : 'Copies'}
                              {order.shop?.name ? ` • ${order.shop.name}` : ""}
                            </p>
                            
                            <div className="flex items-center justify-between mt-auto">
                              <span className={`px-3 py-1 rounded-full text-[13px] font-bold ${style.badgeBg}`}>
                                {style.label}
                              </span>
                              <span className="text-[13px] font-medium text-slate-400">
                                {order.createdAt ? formatOrderDate(order.createdAt) : "Just now"}
                              </span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </Link>
                  </motion.div>
                );
              })
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <FileText className="w-10 h-10 text-[#2563EB]" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Orders Yet</h3>
                <p className="text-slate-500 mb-8 max-w-[250px]">
                  {searchQuery 
                    ? "No orders match your search criteria." 
                    : "Upload your first document to get started."}
                </p>
                {!searchQuery && (
                  <Link 
                    href="/customer/upload"
                    className="bg-[#2563EB] text-white font-bold py-3.5 px-8 rounded-[16px] hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
                  >
                    Upload & Print
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
