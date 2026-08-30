"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthContainer } from "./AuthContainer";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, Eye, EyeOff, Store, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AuthType = "student" | "business";
type LoginMethod = "email" | "mobile" | "google";

export function LoginForm() {
  const [authType, setAuthType] = useState<AuthType>("student");
  const [method, setMethod] = useState<LoginMethod>("email");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Show any error passed from the auth callback via ?error= URL param
  useEffect(() => {
    const urlError = searchParams.get("error");
    const roleType = searchParams.get("type");
    if (urlError === "auth_callback_failed") {
      setError("Authentication failed. Please try logging in again.");
    } else if (urlError === "role_mismatch") {
      const typeStr = roleType === "owner" ? "Business" : "Student";
      setError(`This Google account is registered as a ${typeStr}. Please use the ${typeStr} login instead.`);
    } else if (urlError === "missing_login_role") {
      setError("We couldn't determine your login intent. Please select Student or Business and try again.");
    } else if (urlError) {
      setError(decodeURIComponent(urlError));
    }
  }, [searchParams]);

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const isStudent = authType === "student";
  const primaryColor = isStudent ? "bg-[#2563EB]" : "bg-[#7C3AED]";
  const textColor = isStudent ? "text-[#2563EB]" : "text-[#7C3AED]";
  const hoverColor = isStudent ? "hover:bg-[#1d4ed8]" : "hover:bg-[#6d28d9]";
  const focusRing = isStudent ? "focus:ring-[#2563EB]" : "focus:ring-[#7C3AED]";

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;

    const res = await supabase.auth.signInWithPassword({ email, password });
    
    if (res.error) {
      // Give a friendlier message for unconfirmed emails
      if (res.error.message.toLowerCase().includes("email not confirmed")) {
        setError("Please verify your email address. Check your inbox for a confirmation link.");
      } else if (res.error.message.toLowerCase().includes("invalid login credentials")) {
        setError("Incorrect email or password. Please try again.");
      } else {
        setError(res.error.message);
      }
      setLoading(false);
    } else {
      // Use router.push so Next.js handles the navigation properly with cookies
      router.push(isStudent ? "/customer/shops" : "/shop/orders");
      router.refresh();
    }
  };

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (otpSent) {
      // verify
      setLoading(true);
      setError(null);
      const formData = new FormData(e.currentTarget);
      const phone = formData.get("phone") as string;
      const token = formData.get("token") as string;
      
      const res = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
      
      if (res.error) {
        setError(res.error.message);
        setLoading(false);
      } else {
        router.push(isStudent ? "/customer/shops" : "/shop/orders");
        router.refresh();
      }
    } else {
      // send
      setLoading(true);
      setError(null);
      const formData = new FormData(e.currentTarget);
      const phone = formData.get("phone") as string;
      
      const res = await supabase.auth.signInWithOtp({ phone });
      
      if (res.error) {
        setError(res.error.message);
        setLoading(false);
      } else {
        setOtpSent(true);
        setCountdown(60);
        setLoading(false);
        // start countdown
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) clearInterval(interval);
            return prev - 1;
          });
        }, 1000);
      }
    }
  };

  const handleGoogleLogin = async () => {
    const role = authType === "business" ? "owner" : "student";
    // Set a cookie so the callback route knows which role to assign if the user is new
    document.cookie = `auth_role=${role}; path=/; max-age=3600; SameSite=Lax`;
    
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  };

  return (
    <AuthContainer type={authType}>
      <div className="w-full max-w-md mx-auto">
        
        {/* Role Switcher */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center mb-10 relative">
          {/* Animated Background */}
          <motion.div
            className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm border border-slate-200/50"
            animate={{ left: isStudent ? "6px" : "calc(50%)" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          <button
            onClick={() => { setAuthType("student"); setMethod("email"); setOtpSent(false); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold z-10 transition-colors ${isStudent ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <GraduationCap className={`w-4 h-4 ${isStudent ? textColor : ''}`} />
            Student
          </button>
          <button
            onClick={() => { setAuthType("business"); setMethod("email"); setOtpSent(false); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold z-10 transition-colors ${!isStudent ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Store className={`w-4 h-4 ${!isStudent ? textColor : ''}`} />
            Business
          </button>
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome back!</h2>
        <p className="text-slate-500 mb-8 font-medium">Login to access your YourPrinter {isStudent ? "" : "Business "}account</p>

        {/* Method Switcher */}
        <div className="flex border-b border-slate-200 mb-8">
          <MethodTab label="Email" icon={<Mail className="w-4 h-4" />} active={method === "email"} onClick={() => {setMethod("email"); setOtpSent(false);}} activeColor={textColor} />
          <MethodTab label="Mobile" icon={<Phone className="w-4 h-4" />} active={method === "mobile"} onClick={() => setMethod("mobile")} activeColor={textColor} />
          <MethodTab label="Google" icon={
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          } active={method === "google"} onClick={() => setMethod("google")} activeColor={textColor} />
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email Login Form */}
        {method === "email" && (
          <motion.form key="email-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">{isStudent ? "Email Address" : "Business Email"}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input required type="email" name="email" placeholder={isStudent ? "Enter your email" : "Enter your business email"} className={`w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-[18px] text-sm focus:outline-none focus:ring-2 ${focusRing} focus:border-transparent transition-shadow`} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
                <input required type={showPassword ? "text" : "password"} name="password" placeholder="Enter your password" className={`w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-[18px] text-sm focus:outline-none focus:ring-2 ${focusRing} focus:border-transparent transition-shadow`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className={`text-sm font-bold ${textColor} hover:underline`}>Forgot Password?</Link>
            </div>

            <button disabled={loading} type="submit" className={`w-full py-4 text-white font-bold rounded-2xl shadow-lg transition-all ${primaryColor} ${hoverColor} ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'} flex items-center justify-center`}>
              {loading ? <Spinner /> : "Login"}
            </button>
          </motion.form>
        )}

        {/* Mobile Login Form */}
        {method === "mobile" && (
          <motion.form key="mobile-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Mobile Number</label>
              <div className="flex gap-2">
                <div className="w-24 bg-slate-50 border border-slate-200 rounded-[18px] flex items-center justify-center gap-1 shrink-0 text-sm font-bold text-slate-700">
                  🇮🇳 +91
                </div>
                <div className="relative flex-1">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input readOnly={otpSent} required type="tel" name="phone" placeholder="Enter your mobile number" className={`w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-[18px] text-sm focus:outline-none focus:ring-2 ${focusRing} focus:border-transparent transition-shadow ${otpSent ? 'opacity-50' : ''}`} />
                </div>
              </div>
            </div>

            {otpSent && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                <label className="block text-sm font-bold text-slate-900 mb-2">Enter 6-digit OTP</label>
                <input required type="text" name="token" maxLength={6} placeholder="• • • • • •" className={`w-full px-4 py-3.5 bg-white border border-slate-200 rounded-[18px] text-center text-xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 ${focusRing} focus:border-transparent transition-shadow`} />
                <div className="mt-3 text-right">
                  {countdown > 0 ? (
                    <span className="text-sm text-slate-500 font-medium">Resend in {countdown}s</span>
                  ) : (
                    <button type="button" onClick={() => { setOtpSent(false); setCountdown(60); }} className={`text-sm font-bold ${textColor}`}>Resend OTP</button>
                  )}
                </div>
              </motion.div>
            )}

            <button disabled={loading} type="submit" className={`w-full py-4 text-white font-bold rounded-2xl shadow-lg transition-all ${primaryColor} ${hoverColor} ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'} flex items-center justify-center`}>
              {loading ? <Spinner /> : (otpSent ? "Verify & Login" : "Send OTP")}
            </button>
          </motion.form>
        )}

        {/* Google Login Form */}
        {method === "google" && (
          <motion.div key="google-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 text-center">
            <div className="py-8 text-slate-500 font-medium">
              Sign in quickly using your Google account.
            </div>
            <button onClick={handleGoogleLogin} className="w-full py-4 bg-white text-slate-800 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 shadow-sm transition-all flex items-center justify-center gap-3 hover:scale-[1.02]">
               <svg width="24" height="24" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
               Continue with Google
            </button>
          </motion.div>
        )}

        {/* OR Divider */}
        {method !== "google" && (
          <>
            <div className="flex items-center gap-4 my-8">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-sm font-medium text-slate-400">or</span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <button onClick={handleGoogleLogin} type="button" className="w-full py-3.5 bg-white text-slate-800 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 shadow-sm transition-all flex items-center justify-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
          </>
        )}

        <div className="mt-12 text-center text-sm font-medium text-slate-500">
          Don't have {isStudent ? "an" : "a Business"} account?{" "}
          <Link href={`/auth/signup?type=${authType}`} className={`font-bold ${textColor} hover:underline`}>
            Sign up
          </Link>
        </div>

      </div>
    </AuthContainer>
  );
}

function MethodTab({ label, icon, active, onClick, activeColor }: { label: string, icon: React.ReactNode, active: boolean, onClick: () => void, activeColor: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 pb-4 pt-2 font-bold text-sm relative transition-colors ${active ? activeColor : 'text-slate-400 hover:text-slate-600'}`}
    >
      {icon} {label}
      {active && (
        <motion.div layoutId="methodTab" className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full ${activeColor.replace('text-', 'bg-')}`} />
      )}
    </button>
  );
}

function Spinner() {
  return <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
}
