"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, LogOut, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function SettingsClient({ shopId }: { shopId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    latitude: 0,
    longitude: 0,
    businessHours: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [loading, setLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
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
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
            contactEmail: data.contact_email || "",
            contactPhone: data.contact_phone || "",
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

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Use OpenStreetMap Nominatim API for free reverse geocoding
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (!res.ok) throw new Error("Failed to fetch address");
          const data = await res.json();
          const addressText = data.display_name;
          
          setFormData(p => ({ ...p, address: addressText, latitude, longitude }));
          toast.success("Location updated! Please verify the address.");
        } catch (error) {
          toast.error("Could not fetch address from coordinates.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        toast.error("Failed to get your location. Please check browser permissions.");
      },
      { enableHighAccuracy: true }
    );
  };

  const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  const getBusinessHoursObj = (): Record<string, { open: string; close: string }> => {
    if (!formData.businessHours || formData.businessHours.trim() === "") return {};
    try {
      return JSON.parse(formData.businessHours);
    } catch {
      return {};
    }
  };

  const handleHourChange = (day: string, field: "open" | "close", value: string) => {
    const obj = getBusinessHoursObj();
    if (!obj[day]) obj[day] = { open: "09:00", close: "18:00" };
    obj[day][field] = value;
    setFormData(p => ({ ...p, businessHours: JSON.stringify(obj) }));
  };

  const toggleDay = (day: string) => {
    const obj = getBusinessHoursObj();
    if (obj[day]) {
      delete obj[day];
    } else {
      obj[day] = { open: "09:00", close: "18:00" };
    }
    setFormData(p => ({ ...p, businessHours: JSON.stringify(obj) }));
  };

  const handleSave = async () => {
    try {
      let parsedHours = {};
      if (formData.businessHours.trim() !== "") {
        try {
          parsedHours = JSON.parse(formData.businessHours);
        } catch (e) {
          throw new Error("Business Hours must be valid JSON format (e.g. {\"monday\": {\"open\": \"09:00\", \"close\": \"18:00\"}})");
        }
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
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
      
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (errData?.details) {
          // Flatten zod details to string
          throw new Error(JSON.stringify(errData.details));
        }
        throw new Error(errData?.error || `Failed to save settings (HTTP ${res.status}: ${res.statusText})`);
      }
      
      toast.success("Shop settings saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error("Failed to log out");
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-slate-900">Shop Address</label>
                  <button 
                    onClick={handleGetLocation} 
                    disabled={isLocating}
                    className="text-sm font-bold text-[#2A5BE9] hover:text-[#1f4cd9] flex items-center gap-1 disabled:opacity-50"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    {isLocating ? "Locating..." : "Set up my location"}
                  </button>
                </div>
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
              <label className="block text-sm font-bold text-slate-900 mb-4">Business Hours</label>
              <div className="space-y-3">
                {DAYS.map(day => {
                  const hoursObj = getBusinessHoursObj();
                  const isOpen = !!hoursObj[day];
                  const openTime = isOpen ? hoursObj[day].open : "09:00";
                  const closeTime = isOpen ? hoursObj[day].close : "18:00";

                  return (
                    <div key={day} className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-3 w-32 shrink-0">
                        <input 
                          type="checkbox" 
                          checked={isOpen}
                          onChange={() => toggleDay(day)}
                          className="w-4 h-4 text-[#2A5BE9] rounded border-slate-300 focus:ring-[#2A5BE9]"
                        />
                        <span className="text-sm font-bold text-slate-900 capitalize">{day}</span>
                      </div>
                      
                      {isOpen ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input 
                            type="time" 
                            value={openTime}
                            onChange={(e) => handleHourChange(day, "open", e.target.value)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5BE9] focus:border-transparent"
                          />
                          <span className="text-slate-400 text-sm font-medium">to</span>
                          <input 
                            type="time" 
                            value={closeTime}
                            onChange={(e) => handleHourChange(day, "close", e.target.value)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5BE9] focus:border-transparent"
                          />
                        </div>
                      ) : (
                        <div className="flex-1 text-sm font-medium text-slate-400">Closed</div>
                      )}
                    </div>
                  );
                })}
              </div>
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

        {/* Danger Zone */}
        <div className="bg-white border border-[#E5EAF5] rounded-[16px] shadow-sm overflow-hidden mt-6 md:mt-8">
          <div className="px-4 md:px-8 py-6 border-b border-[#E5EAF5]">
            <h2 className="text-[20px] font-bold text-red-600">Danger Zone</h2>
            <p className="text-[14px] text-[#6B7280] mt-1">Actions that affect your account session.</p>
          </div>
          <div className="p-4 md:p-8">
            <button 
              onClick={handleLogout}
              className="w-full sm:w-auto bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] font-bold px-8 h-12 rounded-[12px] flex items-center justify-center gap-2 hover:bg-[#FEE2E2] transition-colors shadow-sm"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
