"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, User } from "lucide-react";
import { toast } from "sonner";

export default function OrderChat({ orderId }: { orderId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const initChat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setCurrentUserId(session.user.id);

      const { data } = await supabase
        .from("order_status_history")
        .select("id, note, created_at, changed_by")
        .eq("order_id", orderId)
        .eq("from_status", "chat")
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
      setLoading(false);
    };

    initChat();

    const channel = supabase
      .channel(`chat-${orderId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "order_status_history",
        filter: `order_id=eq.${orderId}`
      }, (payload) => {
        if (payload.new.from_status === "chat") {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, supabase]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput("");

    try {
      const res = await fetch(`/api/orders/${orderId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg })
      });
      if (!res.ok) throw new Error("Failed to send");
    } catch (err) {
      toast.error("Failed to send message");
      setInput(msg); // restore input
    }
  };

  if (loading) return <div className="p-4 text-center text-sm text-slate-400">Loading chat...</div>;

  return (
    <div className="flex flex-col h-[400px] border border-slate-200 rounded-2xl bg-white overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700 flex items-center gap-2">
        <User className="w-5 h-5 text-blue-500" />
        Order Chat
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-10">No messages yet. Say hello!</div>
        )}
        {messages.map(msg => {
          const isMe = msg.changed_by === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"}`}>
                {msg.note}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 bg-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <button 
          onClick={sendMessage}
          disabled={!input.trim()}
          className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
