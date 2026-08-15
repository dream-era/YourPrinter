"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, ChevronDown, Search, Plus, 
  MoreVertical, CheckCircle2, Image as ImageIcon,
  Clock, X
} from "lucide-react";
import { toast } from "sonner";
import { createBrowserClient } from "@supabase/ssr";
import OrderDetailsPanel from "./OrderDetailsPanel";

type PrintOptions = {
  color: "bw" | "color";
  copies: number;
  sides: "single" | "double";
  binding: string;
  lamination: boolean;
};

type Order = {
  id: string;
  order_number: string;
  status: "accepted" | "printing" | "ready" | "pending_payment" | "completed" | "cancelled" | "failed";
  created_at: string;
  print_options: PrintOptions;
  amount_paise: number;
  pickup_code?: string;
  student?: {
    first_name: string;
    last_name: string;
  };
};

export default function BusinessDashboardClient({ shopId }: { shopId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Search
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Details Panel State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchOrders = async () => {
    try {
      // Instead of queue which returns split columns, we can just fetch the raw queue 
      // or we can stitch them together. Let's stitch them for now.
      const res = await fetch(`/api/shops/${shopId}/orders/queue`);
      if (res.ok) {
        const data = await res.json();
        const allOrders = [
          ...(data.queue.accepted || []),
          ...(data.queue.printing || []),
          ...(data.queue.ready || [])
        ];
        
        // Sort by created_at descending
        allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setOrders(allOrders);
        
        // If an order is selected, update it
        if (selectedOrder) {
          const updated = allOrders.find(o => o.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Could not load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel("orders_grid")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `shop_id=eq.${shopId}` }, () => {
        fetchOrders(); 
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    // Optimistic UI update
    const previousOrders = [...orders];
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
    
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      
      if (newStatus === "ready" && data.order?.pickup_code) {
        toast.success(`Order marked as ready! Pickup Code: ${data.order.pickup_code}`, { duration: 8000 });
      } else {
        toast.success(`Order status updated to ${newStatus}`);
      }
      
      if (newStatus === "completed" || newStatus === "cancelled") {
        setSelectedOrder(null);
      }
      // fetchOrders is called by postgres_changes listener anyway, 
      // but we can call it to sync.
      fetchOrders();
    } catch (err: any) {
      // Revert optimistic update
      setOrders(previousOrders);
      toast.error(err.message);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = filterStatus === "all" || o.status === filterStatus;
      const q = searchQuery.toLowerCase();
      const name = `${o.student?.first_name || ""} ${o.student?.last_name || ""}`.toLowerCase();
      const matchSearch = name.includes(q) || (o.order_number && o.order_number.toLowerCase().includes(q)) || o.id.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [orders, filterStatus, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "bg-[#EEF2FF] text-[#4F46E5]"; // Blue
      case "printing": return "bg-[#FFF7ED] text-[#EA580C]"; // Orange
      case "ready": return "bg-[#F0FDF4] text-[#16A34A]"; // Green
      case "completed": return "bg-[#F0FDF4] text-[#16A34A]"; // Green
      default: return "bg-[#FEF2F2] text-[#DC2626]"; // Red/Error
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "accepted": return "Accepted";
      case "printing": return "Printing";
      case "ready": return "Ready";
      case "completed": return "Completed";
      default: return "Error";
    }
  };

  const getInitials = (fName: string, lName: string) => {
    return `${fName?.charAt(0) || ""}${lName?.charAt(0) || ""}`.toUpperCase() || "GU";
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };
  
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#F9FAFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B57]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      
      {/* LEFT CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Header Row */}
        <header className="flex items-center justify-between px-4 sm:px-8 py-6 shrink-0 bg-[#F9FAFB]">
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Orders</h1>
          
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-[#FF6B57] rounded-full border border-white"></span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FFB5A7] text-[#FF6B57] font-bold flex items-center justify-center text-sm">
                MF
              </div>
              <div className="flex flex-col hidden sm:flex">
                <span className="text-[14px] font-bold text-slate-800 leading-tight">YourPrinter Admin</span>
                <span className="text-[12px] font-medium text-slate-400">Campus Store</span>
              </div>
            </div>
          </div>
        </header>

        {/* Filter & Search Row */}
        <div className="px-4 sm:px-8 pb-6 shrink-0 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:flex-1">
            <div className="relative w-full sm:w-[320px]">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name, order or etc"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#FF6B57] focus:ring-1 focus:ring-[#FF6B57]/20 text-[14px] text-slate-700 placeholder-slate-400 shadow-sm"
              />
            </div>
            
            <div className="relative w-full sm:w-auto">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none w-full sm:w-auto pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#FF6B57] text-[14px] font-semibold text-slate-700 shadow-sm cursor-pointer"
              >
                <option value="all">All</option>
                <option value="accepted">Accepted</option>
                <option value="printing">Printing</option>
                <option value="ready">Ready</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <button className="w-full lg:w-auto bg-[#FF6B57] hover:bg-[#F25C47] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-[14px] shadow-sm shadow-[#FF6B57]/20 transition-all active:scale-95">
            <Plus className="w-5 h-5" />
            New Order
          </button>
        </div>

        {/* Grid Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-8 hide-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {filteredOrders.map(order => {
                const fName = order.student?.first_name || "Guest";
                const lName = order.student?.last_name || "";
                const isSelected = selectedOrder?.id === order.id;
                
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`bg-white rounded-[24px] p-6 cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? "border-2 border-[#FF6B57] shadow-lg shadow-[#FF6B57]/10" 
                        : "border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-4 items-center">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[15px] font-bold ${
                          order.status === "failed" || order.status === "pending_payment" ? "bg-[#FF6B57] text-white" : "bg-[#FFB5A7] text-[#FF6B57]"
                        }`}>
                          {getInitials(fName, lName)}
                        </div>
                        <div>
                          <h3 className="font-bold text-[17px] text-slate-800">{fName} {lName}</h3>
                          <p className="text-[13px] text-slate-400 mt-0.5">Order #{order.order_number || order.id.slice(0,8).toUpperCase()}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg text-[12px] font-bold ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </div>
                    </div>

                    {/* Date Time */}
                    <div className="flex justify-between items-center text-[13px] text-slate-500 font-medium mb-6">
                      <span>{formatDate(order.created_at)}</span>
                      <span>{formatTime(order.created_at)}</span>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 text-[12px] font-bold text-slate-400 mb-3 px-1">
                      <div className="col-span-8">Items</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-2 text-right">Price</div>
                    </div>

                    {/* Table Row (Mocking single item for print job) */}
                    <div className="grid grid-cols-12 gap-2 text-[14px] font-semibold text-slate-700 mb-6 px-1 items-center">
                      <div className="col-span-8 truncate pr-2">
                        {order.print_options.color === 'color' ? 'Color' : 'B&W'} Document Print
                      </div>
                      <div className="col-span-2 text-center">{order.print_options.copies}</div>
                      <div className="col-span-2 text-right">₹{(order.amount_paise / 100).toFixed(2)}</div>
                    </div>

                    <div className="h-[1px] w-full bg-slate-100 mb-5"></div>

                    {/* Total Row */}
                    <div className="flex justify-between items-center mb-6 px-1">
                      <span className="font-bold text-[18px] text-slate-800">Total</span>
                      <span className="font-bold text-[18px] text-slate-800">₹{(order.amount_paise / 100).toFixed(2)}</span>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                        className="flex-1 py-3.5 rounded-xl bg-slate-50 text-slate-600 font-bold text-[14px] hover:bg-slate-100 transition-colors"
                      >
                        See Details
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (order.status === "accepted") updateStatus(order.id, "printing");
                          else if (order.status === "printing") updateStatus(order.id, "ready");
                        }}
                        className="flex-1 py-3.5 rounded-xl bg-[#FF6B57] text-white font-bold text-[14px] hover:bg-[#F25C47] transition-colors shadow-sm shadow-[#FF6B57]/20"
                      >
                        {order.status === "accepted" ? "Start Print" : order.status === "printing" ? "Mark Ready" : "Manage"}
                      </button>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {filteredOrders.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                <Search className="w-12 h-12 mb-4 text-slate-200" />
                <p className="font-semibold text-slate-500">No orders found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT CONTENT AREA: ORDER DETAILS */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsPanel 
            key={selectedOrder.id} 
            orderId={selectedOrder.id} 
            onClose={() => setSelectedOrder(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
