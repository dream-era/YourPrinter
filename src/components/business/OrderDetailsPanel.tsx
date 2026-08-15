"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Phone, Mail, FileText, 
  Printer, CheckCircle2, AlertCircle, RefreshCw, Eye, Download, 
  Image as ImageIcon, Trash2, QrCode
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function OrderDetailsPanel({ 
  orderId, 
  onClose,
  onStatusUpdated
}: { 
  orderId: string; 
  onClose: () => void;
  onStatusUpdated?: () => void;
}) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [shopNotes, setShopNotes] = useState("");
  const notesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createClient();

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          student:profiles!orders_student_id_fkey(
            id, full_name, phone, avatar_url, role
          ),
          staff:profiles!orders_assigned_staff_id_fkey(
            id, full_name
          ),
          document:documents(
            id, original_filename, mime_type, size_bytes, page_count, storage_path, created_at
          ),
          history:order_status_history(
            id, from_status, to_status, created_at, note, 
            changer:profiles!order_status_history_changed_by_fkey(full_name)
          ),
          print_jobs(
            id, status, created_at, claimed_at, completed_at, last_error,
            agent:shop_agents(name, active, last_seen_at)
          )
        `)
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;
      
      setOrder(data);
      if (!shopNotes) setShopNotes(data.shop_notes || "");
    } catch (err: any) {
      console.error("SUPABASE ERROR:", err, "KEYS:", Object.keys(err || {}), "STRING:", JSON.stringify(err));
      setError(err?.message || JSON.stringify(err) || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  }, [orderId, supabase, shopNotes]);

  useEffect(() => {
    fetchOrder();
    const channel = supabase.channel(`order_details_${orderId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, () => {
        fetchOrder(); 
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_status_history", filter: `order_id=eq.${orderId}` }, () => {
        fetchOrder();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId, fetchOrder, supabase]);

  const updateStatus = async (newStatus: string) => {
    // Optimistic UI update
    const previousStatus = order?.status;
    setOrder((prev: any) => ({ ...prev, status: newStatus }));
    
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      
      toast.success(`Order marked as ${newStatus}`);
      if (onStatusUpdated) onStatusUpdated();
      // No need to fetchOrder() here since realtime or the optimistic update handles it
      // fetchOrder();
    } catch (err: any) {
      // Revert optimistic update
      setOrder((prev: any) => ({ ...prev, status: previousStatus }));
      toast.error(err.message);
    }
  };

  const handleDocumentAction = async (docId: string, action: 'preview' | 'download') => {
    try {
      toast.loading(`Preparing document...`, { id: `doc_${docId}` });
      const res = await fetch(`/api/documents/${docId}/download-url`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get document URL");
      
      toast.success("Ready", { id: `doc_${docId}` });
      
      if (action === 'preview') {
        window.open(data.url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = data.url;
        link.setAttribute('download', '');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch document", { id: `doc_${docId}` });
    }
  };

  const handleVerifyCode = async () => {
    const code = window.prompt("Enter the 6-digit pickup code shown by the customer:");
    if (!code) return;
    try {
      const res = await fetch('/api/orders/pickup/verify', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, pickupCode: code.toUpperCase().trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      toast.success("Code verified! Order completed.");
      if (onStatusUpdated) onStatusUpdated();
      fetchOrder();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setShopNotes(val);
    
    if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
    
    setSavingNotes(true);
    notesTimeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase.from('orders').update({ shop_notes: val }).eq('id', orderId);
        if (error) throw error;
      } catch (err) {
        console.error(err);
        toast.error("Failed to save notes");
      } finally {
        setSavingNotes(false);
      }
    }, 1000);
  };

  if (loading && !order) {
    return (
      <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }} className="w-full sm:w-[480px] bg-white h-full border-l border-slate-100 shadow-xl flex flex-col z-50 fixed right-0 top-0 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }} className="w-full sm:w-[480px] bg-white h-full border-l border-slate-100 shadow-xl flex flex-col z-50 fixed right-0 top-0 items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="font-bold text-slate-800 mb-2">Error loading order</h3>
        <p className="text-slate-500 mb-6">{error}</p>
        <button onClick={onClose} className="px-6 py-2 bg-slate-100 rounded-lg font-semibold hover:bg-slate-200">Close</button>
      </motion.div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "bg-blue-100 text-blue-700";
      case "printing": return "bg-orange-100 text-orange-700";
      case "ready": return "bg-green-100 text-green-700";
      case "completed": return "bg-slate-800 text-white";
      case "cancelled": return "bg-red-100 text-red-700";
      case "pending_payment": return "bg-yellow-100 text-yellow-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const pOpts = order.print_options || {};
  const student = order.student || {};
  const isGuest = !student.role || student.role === 'guest';
  const documents = Array.isArray(order.document) ? order.document : (order.document ? [order.document] : []);
  const revenue = order.amount_paise / 100;

  return (
    <motion.div 
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="w-full sm:w-[450px] bg-white h-full border-l border-slate-200 shadow-2xl flex flex-col z-50 absolute right-0 top-0 overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-32">
        
        {/* 1. ORDER HEADER */}
        <header className="p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Order #{order.order_number || order.id.split('-')[0].toUpperCase()}
              </h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 transition-colors shadow-sm border border-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
              {order.status.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <p className="text-slate-500 mb-1">Placed:</p>
              <p className="font-semibold text-slate-900">{new Date(order.created_at).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} &bull; {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Payment:</p>
              <p className="font-semibold text-slate-900">{order.paid_at ? 'Paid' : 'Pending'}</p>
            </div>
            <div className="col-span-2 mt-2">
              <p className="text-slate-500 mb-1">Total:</p>
              <p className="font-bold text-xl text-slate-900">₹{revenue.toFixed(2)}</p>
            </div>
          </div>
        </header>

        <div className="p-6 flex flex-col gap-8">
          
          {/* 4. PRINT SETTINGS (Most Visual Section) */}
          <section>
            <h3 className="text-[12px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Print Settings</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 bg-slate-50 p-5 rounded-xl border border-slate-100 shadow-sm">
              <div>
                <p className="text-[12px] text-slate-500 mb-0.5">Paper Size</p>
                <p className="font-bold text-[14px] text-slate-900">A4</p>
              </div>
              <div>
                <p className="text-[12px] text-slate-500 mb-0.5">Color</p>
                <p className="font-bold text-[14px] text-slate-900 capitalize">{pOpts.color === 'color' ? 'Color' : 'Black & White'}</p>
              </div>
              <div>
                <p className="text-[12px] text-slate-500 mb-0.5">Copies</p>
                <p className="font-bold text-[14px] text-slate-900">{pOpts.copies || 1}</p>
              </div>
              <div>
                <p className="text-[12px] text-slate-500 mb-0.5">Sides</p>
                <p className="font-bold text-[14px] text-slate-900">{pOpts.sides === 'double' ? 'Double Sided' : 'Single Sided'}</p>
              </div>
              <div>
                <p className="text-[12px] text-slate-500 mb-0.5">Binding</p>
                <p className="font-bold text-[14px] text-slate-900 capitalize">{pOpts.binding || 'None'}</p>
              </div>
              <div>
                <p className="text-[12px] text-slate-500 mb-0.5">Lamination</p>
                <p className="font-bold text-[14px] text-slate-900">{pOpts.lamination ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </section>

          {/* 6. CUSTOMER NOTES */}
          {order.customer_notes && (
            <section>
              <h3 className="text-[12px] font-bold text-slate-400 mb-3 uppercase tracking-widest">Customer Instructions</h3>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-[14px] text-amber-900 font-medium">"{order.customer_notes}"</p>
              </div>
            </section>
          )}

          {/* 3. DOCUMENTS */}
          {documents.length > 0 && (
            <section>
              <h3 className="text-[12px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Documents</h3>
              <div className="flex flex-col gap-3">
                {documents.map((doc: any) => (
                  <div key={doc.id} className="p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      {doc.mime_type?.includes('image') ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[13px] text-slate-900 truncate">{doc.original_filename}</p>
                      <p className="text-[12px] text-slate-500 mt-0.5">
                        {doc.page_count ? `${doc.page_count} Pages • ` : ''}{(doc.size_bytes / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleDocumentAction(doc.id, 'preview')} className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 shadow-sm" title="Preview">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDocumentAction(doc.id, 'download')} className="h-9 px-4 flex items-center justify-center gap-2 text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all shadow-sm font-medium text-[13px]">
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2. CUSTOMER DETAILS */}
          <section>
            <h3 className="text-[12px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Customer Details</h3>
            <div className="bg-white rounded-xl p-0">
              <h4 className="font-bold text-[15px] text-slate-900 mb-3">{student.full_name || 'Guest Customer'}</h4>
              <div className="flex flex-col gap-2 text-[13px] text-slate-600">
                {student.phone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-400" /> {student.phone}</div>}
                {student.email && <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-400" /> {student.email}</div>}
                {!isGuest && student.student_id_number && <div className="flex items-center gap-3 mt-1"><span className="text-slate-400 w-4 font-mono text-[10px]">ID</span> {student.student_id_number}</div>}
              </div>
            </div>
          </section>

          {/* 5. PRICE BREAKDOWN */}
          <section>
            <h3 className="text-[12px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Price Breakdown</h3>
            <div className="flex flex-col gap-3 text-[13px] text-slate-600 border border-slate-100 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between"><span>Printing Cost</span><span>₹{(revenue * 0.7).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Binding Cost</span><span>₹{(revenue * 0.2).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>₹{(revenue * 0.1).toFixed(2)}</span></div>
              <div className="flex justify-between items-center pt-4 mt-1 border-t border-slate-100">
                <span className="font-bold text-[14px] text-slate-900">Grand Total</span>
                <span className="font-black text-[18px] text-slate-900">₹{revenue.toFixed(2)}</span>
              </div>
            </div>
          </section>

          {/* 7. SHOP NOTES */}
          <section className="relative">
            <textarea 
              value={shopNotes}
              onChange={handleNotesChange}
              placeholder="Add internal staff notes here..."
              className="w-full h-24 p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-[13px] text-slate-900 resize-none transition-all placeholder:text-slate-400"
            />
            {savingNotes && (
              <div className="absolute top-4 right-4">
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
              </div>
            )}
          </section>

        </div>
      </div>
      
      {/* 8. ACTION BUTTONS */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-30">
        <div className="flex gap-2">
          {order.status === 'pending_payment' && (
            <button className="w-full py-4 rounded-xl bg-slate-100 text-slate-400 font-bold cursor-not-allowed text-[14px]">Waiting for Payment</button>
          )}
          
          {order.status === 'accepted' && (
            <>
              <button onClick={() => updateStatus('printing')} className="flex-1 py-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-md text-[14px]">
                Start Printing
              </button>
              <button onClick={() => updateStatus('cancelled')} className="w-14 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-100"><Trash2 className="w-5 h-5" /></button>
            </>
          )}

          {order.status === 'printing' && (
            <button onClick={() => updateStatus('ready')} className="w-full py-4 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition-all shadow-md shadow-green-500/20 flex items-center justify-center gap-2 text-[14px]">
              <CheckCircle2 className="w-4 h-4" /> Mark Ready
            </button>
          )}

          {order.status === 'ready' && (
            <>
              <button onClick={() => updateStatus('completed')} className="flex-1 py-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-md text-[14px]">
                Verify Pickup
              </button>
              <button onClick={handleVerifyCode} title="Verify via 6-digit code" className="w-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-100"><QrCode className="w-5 h-5" /></button>
            </>
          )}

          {(order.status === 'completed' || order.status === 'cancelled' || order.status === 'failed') && (
            <button className="w-full py-4 rounded-xl bg-slate-100 text-slate-500 font-bold text-[14px]" disabled>Order Closed</button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
