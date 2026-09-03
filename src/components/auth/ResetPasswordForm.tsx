"use client";

import React, { useState } from "react";
import { AuthContainer } from "./AuthContainer";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, KeyRound } from "lucide-react";
import { resetPasswordAction, resetPasswordWithPinAction } from "@/features/auth/actions";
import { useRouter } from "next/navigation";

export function ResetPasswordForm({ requiresPin }: { requiresPin?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    let res;
    if (requiresPin) {
      const email = formData.get("email") as string;
      const pin = formData.get("pin") as string;
      res = await resetPasswordWithPinAction({ email, pin, password, confirmPassword });
    } else {
      res = await resetPasswordAction({ password, confirmPassword });
    }
    
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/auth/login?reset=success");
    }
  };

  return (
    <AuthContainer type="student">
      <div className="w-full max-w-md mx-auto py-8">
        <h2 className="text-3xl font-black text-slate-900 mb-2">Create New Password</h2>
        <p className="text-slate-500 mb-8 font-medium">
          {requiresPin 
            ? "Please enter the 6-digit PIN sent to your email and your new password." 
            : "Please enter your new password below."}
        </p>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          {requiresPin && (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input required type="email" name="email" placeholder="Enter your email" className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-[18px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">6-Digit PIN</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input required type="text" name="pin" placeholder="e.g. 123456" className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-[18px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow" />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">New Password</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <input required type={showPassword ? "text" : "password"} name="password" placeholder="Enter new password" className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-[18px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Confirm New Password</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <input required type={showPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm new password" className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-[18px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow" />
            </div>
          </div>
          
          <button disabled={loading} type="submit" className={`w-full py-4 text-white font-bold rounded-2xl shadow-lg transition-all bg-[#2563EB] hover:bg-[#1d4ed8] ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'} flex items-center justify-center`}>
            {loading ? <Spinner /> : "Reset Password"}
          </button>
        </form>
      </div>
    </AuthContainer>
  );
}

function Spinner() {
  return <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
}
