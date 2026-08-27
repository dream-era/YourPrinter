"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SettingsClient({ shopId }: { shopId: string }) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    businessHours: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [loading, setLoading] = useState(true);
  const [profileImg, setProfileImg] = useState("");
  const [ownerName, setOwnerName] = useState("Shop Owner");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfileImg(url);
    }
  };

  useEffect(() => {
    async function loadShop() {
      try {
        const res = await fetch(`/api/shops/${shopId}`);
        if (res.ok) {
          const data = await res.json();
          setFormData({
            name: data.name || "",
            description: data.description || "",
            address: data.address || "",
            contactEmail: data.contact_email || "",
            contactPhone: data.contact_phone || "",
            // Simply use business hours as a string for now, or stringify it if it's json
            businessHours: typeof data.business_hours === "string" ? data.business_hours : JSON.stringify(data.business_hours || {}),
          });
          if (data.logo_url) setProfileImg(data.logo_url);
        }
      } catch (err) {
        toast.error("Failed to load shop settings.");
      } finally {
        setLoading(false);
      }
    }
    loadShop();
  }, [shopId]);

  const handleSave = async () => {
    try {
      let parsedHours = {};
      try {
        parsedHours = JSON.parse(formData.businessHours);
      } catch (e) {
        // If not valid JSON, just pass it as empty or wrap it
        parsedHours = { text: formData.businessHours };
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        businessHours: parsedHours,
        // logoUrl: profileImg // we would need to upload the image to GCS first
      };

      const res = await fetch(`/api/shops/${shopId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save settings");
      toast.success("Shop settings saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-y-auto custom-scrollbar">
      
      {/* Top Header */}
      <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 border-b border-[#E5EAF5] bg-white shrink-0 sticky top-0 z-10">
        <div>
          <h1 className="text-xl md:text-[24px] font-bold text-[#111827] tracking-tight">Settings</h1>
          <p className="hidden md:block text-[14px] text-[#6B7280] font-medium mt-0.5">Manage your shop details</p>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6">
          <button className="relative w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
            <Bell className="w-5 h-5 text-[#6B7280]" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => alert("Profile dropdown opened")}>
            {profileImg ? (
              <img src={profileImg} alt="Profile" className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-100" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#FFB5A7] text-[#FF6B57] font-bold flex items-center justify-center text-sm shadow-sm border border-slate-100">
                ME
              </div>
            )}
            <div className="hidden md:flex flex-col">
              <span className="text-[14px] font-bold text-[#111827]">{ownerName}</span>
              <span className="text-[12px] font-medium text-[#6B7280]">Owner</span>
            </div>
            <ChevronDown className="hidden md:block w-4 h-4 text-slate-400 ml-1" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-4xl mx-auto w-full">
        
        {/* Pricing Link Card */}
        <div className="bg-white border border-[#E5EAF5] rounded-[16px] shadow-sm overflow-hidden mb-6 md:mb-8 p-4 md:p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-[#111827]">Pricing & Services</h2>
            <p className="text-[14px] text-[#6B7280] mt-1">Configure pricing for print, xerox, binding, and other services.</p>
          </div>
          <button 
            onClick={() => router.push("/shop/pricing")}
            className="w-full md:w-auto px-6 py-2.5 bg-white border border-[#E5EAF5] text-[#111827] font-bold text-[14px] rounded-[12px] hover:bg-slate-50 transition-colors shadow-sm"
          >
            Customize Prices
          </button>
        </div>

        {/* Payment Setup Link Card */}
        <div className="bg-white border border-[#E5EAF5] rounded-[16px] shadow-sm overflow-hidden mb-6 md:mb-8 p-4 md:p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-[#111827]">Payment Setup</h2>
            <p className="text-[14px] text-[#6B7280] mt-1">Connect your Razorpay account to receive payments.</p>
          </div>
          <button 
            onClick={() => router.push("/shop/settings/payment")}
            className="w-full md:w-auto px-6 py-2.5 bg-white border border-[#E5EAF5] text-[#111827] font-bold text-[14px] rounded-[12px] hover:bg-slate-50 transition-colors shadow-sm"
          >
            Configure Payments
          </button>
        </div>

        {/* Single Settings Card */}
        <div className="bg-white border border-[#E5EAF5] rounded-[16px] shadow-sm overflow-hidden">
          
          <div className="px-4 md:px-8 py-6 border-b border-[#E5EAF5]">
            <h2 className="text-[20px] font-bold text-[#111827]">Shop Information</h2>
            <p className="text-[14px] text-[#6B7280] mt-1">Update your shop details.</p>
          </div>

          <div className="p-4 md:p-8 space-y-6">
            
            {/* Profile Image Upload */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pb-6 border-b border-slate-100 text-center sm:text-left">
              <div className="relative">
                {profileImg ? (
                  <img src={profileImg} alt="Shop Profile" className="w-20 h-20 rounded-full object-cover border border-slate-200 shadow-sm" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-[12px] font-medium shadow-sm">
                    No Image
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-[#111827] mb-1">Shop Profile Image</h3>
                <p className="text-[13px] text-[#6B7280] mb-3">This will be displayed to students when they select your shop.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2 bg-white border border-[#E5EAF5] text-[#111827] font-medium text-[13px] rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    Upload new image
                  </button>
                  <button 
                    onClick={() => setProfileImg("")}
                    className="w-full sm:w-auto px-4 py-2 text-red-600 font-medium text-[13px] hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Shop Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5BE9] focus:border-transparent transition-shadow" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Shop Address</label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5BE9] focus:border-transparent transition-shadow" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Contact Email</label>
                <input 
                  type="email" 
                  value={formData.contactEmail}
                  onChange={e => setFormData(p => ({ ...p, contactEmail: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5BE9] focus:border-transparent transition-shadow" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Contact Phone</label>
                <input 
                  type="tel" 
                  value={formData.contactPhone}
                  onChange={e => setFormData(p => ({ ...p, contactPhone: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5BE9] focus:border-transparent transition-shadow" 
                />
              </div>
            </div>

            <div className="pb-6 border-b border-slate-100">
              <label className="block text-sm font-bold text-slate-900 mb-2">Shop Description</label>
              <textarea 
                rows={3}
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5BE9] focus:border-transparent transition-shadow resize-none" 
              />
            </div>

            <div className="pb-6 border-b border-slate-100">
              <label className="block text-sm font-bold text-slate-900 mb-2">Business Hours (JSON format)</label>
              <textarea 
                rows={3}
                value={formData.businessHours}
                onChange={e => setFormData(p => ({ ...p, businessHours: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5BE9] focus:border-transparent transition-shadow resize-none font-mono" 
                placeholder='{"monday": {"open": "09:00", "close": "18:00"}}'
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button 
                onClick={handleSave}
                disabled={loading}
                className="w-full sm:w-auto bg-[#2A5BE9] hover:bg-[#1f4cd9] disabled:opacity-50 text-white font-bold h-12 px-8 rounded-[12px] shadow-sm transition-colors text-[15px]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
