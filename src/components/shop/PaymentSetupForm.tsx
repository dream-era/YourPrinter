"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, ShieldCheck, CheckCircle2, AlertTriangle, ExternalLink, Loader2, IndianRupee } from "lucide-react";

export function PaymentSetupForm({ shopId }: { shopId: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);
  
  const [status, setStatus] = useState<"pending" | "active" | "failed" | "not_configured">("not_configured");
  const [lastError, setLastError] = useState<string | null>(null);

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
      <div className={`border rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${
        status === "active" ? "bg-green-50 border-green-200" : 
        status === "failed" ? "bg-red-50 border-red-200" : 
        "bg-slate-50 border-slate-200"
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${
            status === "active" ? "bg-green-100 text-green-600" : 
            status === "failed" ? "bg-red-100 text-red-600" : 
            "bg-slate-200 text-slate-500"
          }`}>
            {status === "active" ? <CheckCircle2 className="w-6 h-6" /> : 
             status === "failed" ? <AlertTriangle className="w-6 h-6" /> : 
             <IndianRupee className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-0.5">Connection Status</p>
            <h4 className={`text-lg font-bold ${
              status === "active" ? "text-green-700" : 
              status === "failed" ? "text-red-700" : 
              "text-slate-700"
            }`}>
              {status === "active" ? "Connected & Verified" : 
               status === "failed" ? "Verification Failed" : 
               "Not Configured"}
            </h4>
            {status === "failed" && lastError && (
              <p className="text-xs text-red-600 mt-1 max-w-md">{lastError}</p>
            )}
          </div>
        </div>
        <a 
          href="https://dashboard.razorpay.com/app/keys" 
          target="_blank" 
          rel="noreferrer"
          className="w-full md:w-auto justify-center text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-white px-4 py-2.5 md:py-2 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow"
        >
          Get API Keys <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded-3xl p-5 md:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-5 mb-6">
          <h2 className="text-xl font-bold text-slate-900">API Credentials</h2>
          <p className="text-sm text-slate-500 mt-1">Enter your live Razorpay API keys to start accepting payments.</p>
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
            {status === "active" && <p className="text-xs text-slate-500 mt-2 font-medium">Leave blank to keep existing secret.</p>}
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Webhook Secret (Optional)</label>
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
