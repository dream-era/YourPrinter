"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import { PaymentStatusWidget } from "./PaymentStatusWidget";

export function PaymentSetupForm({ shopId }: { shopId: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);
  
  const [status, setStatus] = useState<"pending" | "active" | "failed" | "not_configured">("not_configured");
  const [lastError, setLastError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [webhookConfigured, setWebhookConfigured] = useState(false);

  const [formData, setFormData] = useState({
    merchantName: "",
    razorpayKeyId: "",
    razorpayKeySecret: "",
    webhookSecret: "",
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch(`/api/shops/${shopId}/payment-settings`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status || "not_configured");
          setLastError(data.last_verification_error || null);
          if (data.razorpay_merchant_name) {
            setFormData(prev => ({
              ...prev,
              merchantName: data.razorpay_merchant_name,
              razorpayKeyId: data.razorpay_key_id || "",
            }));
          }
          if (data.webhookConfigured !== undefined) {
            setWebhookConfigured(data.webhookConfigured);
          }
        }
      } catch (e) {
        console.error("Failed to load payment settings", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, [shopId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const res = await fetch(`/api/shops/${shopId}/payment-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantName: formData.merchantName.trim(),
          keyId: formData.razorpayKeyId.trim(),
          keySecret: formData.razorpayKeySecret.trim(),
          webhookSecret: formData.webhookSecret ? formData.webhookSecret.trim() : "",
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Payment settings saved and verified successfully! ✅");
        setStatus("active");
        setLastError(null);
        setNote(data.note || null);
        setWebhookConfigured(data.webhookConfigured || false);
        setFormData(prev => ({ ...prev, razorpayKeySecret: "", webhookSecret: "" }));
      } else {
        let errorMsg = data.error || "Failed to verify credentials.";
        if (data.details && typeof data.details === "object") {
          errorMsg = `${data.error}: ${JSON.stringify(data.details.fieldErrors || data.details)}`;
        } else if (data.details) {
          errorMsg = data.details;
        }
        toast.error(errorMsg);
        setStatus("failed");
        setLastError(errorMsg);
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      
      {/* Information Card */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4">
        <div className="bg-blue-100 p-2.5 rounded-xl h-fit">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-blue-900 font-bold text-base mb-1">Direct Payments to You</h3>
          <p className="text-blue-800/80 text-sm font-medium leading-relaxed">
            YourPrinter never stores your money. Payments go directly into your own Razorpay Business account. 
            We only take our platform fee via periodic billing. Connect your live API keys below.
          </p>
        </div>
      </div>

      {/* Status Card */}
      <PaymentStatusWidget status={status} lastError={lastError} webhookConfigured={webhookConfigured} />

      <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded-3xl p-5 md:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-5 mb-6">
          <h2 className="text-xl font-bold text-slate-900">API Credentials</h2>
          <p className="text-sm text-slate-500 mt-1">
            {status === "active" 
              ? "Re-enter your Key ID and Key Secret to update or reconnect your account."
              : "Enter your live Razorpay API keys to start accepting payments."}
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Business Name (shown to students)</label>
            <input 
              required
              type="text" 
              value={formData.merchantName}
              onChange={e => setFormData({...formData, merchantName: e.target.value})}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" 
              placeholder="e.g. Campus Print Hub"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Razorpay Key ID</label>
            <input 
              required
              type="text" 
              value={formData.razorpayKeyId}
              onChange={e => setFormData({...formData, razorpayKeyId: e.target.value})}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" 
              placeholder="rzp_live_xxxxxxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Razorpay Key Secret</label>
            <div className="relative">
              <input 
                required={status !== "active"}
                type={showSecret ? "text" : "password"} 
                value={formData.razorpayKeySecret}
                onChange={e => setFormData({...formData, razorpayKeySecret: e.target.value})}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium pr-12" 
                placeholder={status === "active" ? "Enter new secret to update" : "Enter your secret key"}
              />
              <button 
                type="button" 
                onClick={() => setShowSecret(!showSecret)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {status === "active" && (
              <p className="text-xs text-slate-500 mt-2 font-medium">
                Please re-enter your Secret to confirm updates.
              </p>
            )}
          </div>
          
          <div>
            <label className="flex items-center justify-between text-sm font-bold text-slate-700 mb-2">
              <span>Webhook Secret (Optional)</span>
              {webhookConfigured ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100 px-2 py-0.5 rounded flex items-center gap-1 border border-green-200">
                  <CheckCircle2 className="w-3 h-3" /> Configured
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1 border border-slate-200">
                  Not Configured
                </span>
              )}
            </label>
            <div className="relative">
              <input 
                type={showWebhook ? "text" : "password"} 
                value={formData.webhookSecret}
                onChange={e => setFormData({...formData, webhookSecret: e.target.value})}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium pr-12" 
                placeholder="Required for refund sync and delayed payments"
              />
              <button 
                type="button" 
                onClick={() => setShowWebhook(!showWebhook)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showWebhook ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end">
          <button 
            type="submit" 
            disabled={isSaving} 
            className="w-full md:w-auto justify-center bg-blue-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-70 shadow-sm shadow-blue-600/20"
          >
            {isSaving ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
            ) : (
              "Save & Verify Connection"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
