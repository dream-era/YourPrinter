"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthContainer } from "./AuthContainer";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { forgotPasswordAction } from "@/features/auth/actions";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    const res = await forgotPasswordAction({ email });
    
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <AuthContainer type="student">
      <div className="w-full max-w-md mx-auto">
        <Link href="/auth/login" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>
        
        <h2 className="text-3xl font-black text-slate-900 mb-2">Reset Password</h2>
        <p className="text-slate-500 mb-8 font-medium">Enter your email and we'll send you a link to reset your password.</p>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-medium border border-emerald-100">
              Check your email for a password reset link!
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input required type="email" name="email" placeholder="Enter your email" className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-[18px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow" />
            </div>
          </div>
          
          <button disabled={loading} type="submit" className={`w-full py-4 text-white font-bold rounded-2xl shadow-lg transition-all bg-[#2563EB] hover:bg-[#1d4ed8] ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'} flex items-center justify-center`}>
            {loading ? <Spinner /> : "Send Reset Link"}
          </button>
        </form>
      </div>
    </AuthContainer>
  );
}

function Spinner() {
  return <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
}
