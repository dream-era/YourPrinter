"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, FileText, User, Calendar } from "lucide-react";
import { toast } from "sonner";
import { createBrowserClient } from "@supabase/ssr";

type Order = any; // We can use the same type from Dashboard if extracted, using any for now

export default function ShopHistoryClient({ shopId }: { shopId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/orders?page=${page}&limit=${limit}&search=${search}&filter=${filter}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      toast.error(err.message || "Could not load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    // Subscribe to realtime updates for this shop
    const channel = supabase.channel("orders_history")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `shop_id=eq.${shopId}`,
        },
        () => {
          fetchOrders(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId, page, filter, search]); // Re-fetch when page, filter, or search changes

  const updateStatus = async (orderId: string, newStatus: string, note?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note })
      });
      if (!res.ok) {
        const errData = await res.json().catch(()=>({}));
        throw new Error(errData.error || "Failed to update status");
      }
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC]">
      {/* Top Header */}
      <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 border-b border-[#E5EAF5] bg-white shrink-0 sticky top-0 z-10">
        <div>
          <h1 className="text-xl md:text-[24px] font-bold text-[#111827] tracking-tight">All Orders</h1>
          <p className="text-xs md:text-[14px] text-[#6B7280] font-medium mt-0.5">Search, filter, and view full order history</p>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Order ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow text-sm"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {["all", "new", "accepted", "printing", "ready", "completed", "cancelled", "paid", "urgent", "today", "this_week"].map(f => (
              <button 
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                {f.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Table/Cards */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Order ID</th>
                  <th className="px-6 py-4 font-semibold">Student</th>
                  <th className="px-6 py-4 font-semibold">Document</th>
                  <th className="px-6 py-4 font-semibold">Submitted</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && orders.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading orders...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No orders found.</td></tr>
                ) : (
                  orders.map(order => (
                    <tr 
                      key={order.id} 
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        #{order.order_number || order.id.slice(0,8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-slate-400 mr-2" />
                          <span className="text-slate-700">{order.student?.full_name || "Guest"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center max-w-[200px]">
                          <FileText className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                          <span className="text-slate-700 truncate">{order.document?.original_filename || "Document.pdf"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize
                          ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                            order.status === 'ready' ? 'bg-blue-100 text-blue-700' : 
                            order.status === 'printing' ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-700'}
                        `}>
                          {order.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">
                        ₹{(order.amount_paise / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col divide-y divide-slate-100">
            {loading && orders.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No orders found.</div>
            ) : (
              orders.map(order => (
                <div 
                  key={order.id} 
                  className="p-4 hover:bg-blue-50/50 cursor-pointer transition-colors" 
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-bold text-slate-900 text-sm">#{order.order_number || order.id.slice(0,8).toUpperCase()}</span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize
                        ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                          order.status === 'ready' ? 'bg-blue-100 text-blue-700' : 
                          order.status === 'printing' ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-700'}
                      `}>
                        {order.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Student:</span>
                      <span className="font-medium text-slate-700">{order.student?.full_name || "Guest"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Document:</span>
                      <span className="font-medium text-slate-700 truncate max-w-[150px]">{order.document?.original_filename || "Document.pdf"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date:</span>
                      <span className="font-medium text-slate-700">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50">
                      <span className="text-slate-500 font-semibold text-sm">Total</span>
                      <span className="font-bold text-slate-900 text-sm">₹{(order.amount_paise / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="text-sm text-slate-500">
                Showing {(page - 1) * limit + 1} to Math.min(page * limit, total) of {total} orders
              </span>
              <div className="flex gap-2">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-2 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Order #{selectedOrder.order_number || selectedOrder.id.slice(0,8).toUpperCase()}</h2>
            <div className="mb-6 space-y-2 text-sm text-slate-600">
              <p><strong>Customer:</strong> {selectedOrder.student?.full_name}</p>
              <p><strong>Status:</strong> {selectedOrder.status}</p>
              <p><strong>Amount:</strong> ₹{(selectedOrder.amount_paise / 100).toFixed(2)}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
