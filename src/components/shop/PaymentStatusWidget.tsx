"use client";

import { CheckCircle2, AlertTriangle, IndianRupee, ExternalLink } from "lucide-react";

interface PaymentStatusWidgetProps {
  status: "pending" | "active" | "failed" | "not_configured";
  lastError: string | null;
  webhookConfigured?: boolean;
}

export function PaymentStatusWidget({ status, lastError, webhookConfigured }: PaymentStatusWidgetProps) {
  return (
    <div className={`border rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${
      status === "active" ? "bg-green-50 border-green-200" : 
      status === "failed" ? "bg-red-50 border-red-200" : 
      "bg-slate-50 border-slate-200"
    }`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full shrink-0 ${
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
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={`text-lg font-bold ${
              status === "active" ? "text-green-700" : 
              status === "failed" ? "text-red-700" : 
              "text-slate-700"
            }`}>
              {status === "active" ? "Connected & Verified" : 
               status === "failed" ? "Verification Failed" : 
               "Set up payments to start accepting orders"}
            </h4>
            {status === "active" && (
              webhookConfigured ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100 px-2 py-0.5 rounded flex items-center gap-1 border border-green-200">
                  <CheckCircle2 className="w-3 h-3" /> Webhook Active
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-200">
                  No Webhook
                </span>
              )
            )}
          </div>
          {status === "failed" && lastError && (
            <p className="text-xs text-red-600 mt-1 max-w-md">{lastError}</p>
          )}
        </div>
      </div>
      {(status === "not_configured" || status === "failed") && (
        <a 
          href="https://dashboard.razorpay.com/app/keys" 
          target="_blank" 
          rel="noreferrer"
          className="w-full md:w-auto shrink-0 justify-center text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-white px-4 py-2.5 md:py-2 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow"
        >
          Get API Keys <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}
