"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { 
  Settings, ClipboardList, Heart, CreditCard, 
  MapPin, Bell, Headphones, Info, LogOut, ChevronRight, X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ProfileClient() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch from our users table
          const { data: profile } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .single();
            
          setUser(profile || {
            fullName: user.user_metadata?.full_name || "Student User",
            email: user.email,
            phone: user.user_metadata?.phone || "+91 9876543210",
            avatarUrl: user.user_metadata?.avatar_url || "https://i.pravatar.cc/150?img=11",
          });
        } else {
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [supabase]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      router.push("/auth/login"); // Or wherever the login page is
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const menuItems = [
    { label: "My Orders", icon: ClipboardList, href: "/customer/orders", color: "text-[#2563EB]" },
    { label: "Saved Shops", icon: Heart, href: "/customer/saved-shops", color: "text-[#2563EB]" },
    { label: "Payment Methods", icon: CreditCard, href: "/customer/payment-methods", color: "text-[#2563EB]" },
    { label: "Addresses", icon: MapPin, href: "/customer/addresses", color: "text-[#2563EB]" },
    { label: "Notifications", icon: Bell, href: "/customer/notifications", color: "text-[#2563EB]" },
    { label: "Help & Support", icon: Headphones, href: "/customer/support", color: "text-[#2563EB]" },
    { label: "About YourPrinter", icon: Info, href: "/customer/about", color: "text-[#2563EB]" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-[100px] font-sans relative overflow-hidden">
      
      {/* Background Gradient Blob */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100/50 via-white/10 to-transparent pointer-events-none z-0"></div>
      
      {/* Top App Bar */}
      <header className="relative z-10 sticky top-0 bg-transparent pt-6 pb-2">
        <div className="max-w-[700px] mx-auto px-5 flex items-center justify-between">
          <h1 className="text-[26px] font-black text-slate-900 tracking-tight">Profile</h1>
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 hover:bg-gray-50 transition-colors">
            <Settings className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </header>

      <main className="max-w-[700px] mx-auto relative z-10 px-5 pt-4 flex flex-col gap-6">
        
        {/* User Details */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center text-center pb-2"
        >
          <div className="relative mb-4">
            <div className="w-[104px] h-[104px] rounded-full p-1 bg-white shadow-md">
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.fullName} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-2xl">
                  {user.fullName ? user.fullName[0].toUpperCase() : "U"}
                </div>
              )}
            </div>
          </div>
          <h2 className="text-[22px] font-bold text-slate-900 leading-tight mb-1">{user.fullName}</h2>
          <p className="text-[15px] font-medium text-slate-500 mb-1">{user.email}</p>
          <p className="text-[15px] font-bold text-[#2563EB]">{user.phone}</p>
        </motion.div>

        {/* Menu Cards */}
        <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href}>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                    index !== menuItems.length - 1 ? "border-b border-slate-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50/50 flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <span className="font-semibold text-[16px] text-slate-800">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Logout Button */}
        <motion.button 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={() => setShowLogoutModal(true)}
          className="w-full bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] font-bold text-[16px] py-4 rounded-[20px] shadow-sm flex items-center justify-center gap-2 hover:bg-[#FEE2E2] transition-colors mb-4"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </motion.button>
      </main>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 bg-white rounded-t-3xl sm:rounded-3xl z-50 p-6 shadow-2xl sm:w-[400px] sm:max-w-[90vw]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">Log Out?</h3>
                <button 
                  onClick={() => setShowLogoutModal(false)}
                  className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-500 mb-8 font-medium">Are you sure you want to log out of your account?</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 bg-gray-100 text-slate-700 font-bold py-3.5 rounded-[16px] hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex-1 bg-red-600 text-white font-bold py-3.5 rounded-[16px] hover:bg-red-700 transition-colors"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
