"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Store, MapPin, CheckCircle2, ArrowRight, Loader2, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function RegisterShopClient() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | "">("");
  const [longitude, setLongitude] = useState<number | "">("");

  // Helper to generate slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    toast.loading("Fetching location...", { id: "geo" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        toast.success("Location acquired", { id: "geo" });
      },
      (err) => {
        toast.error("Failed to get location. Please enter manually.", { id: "geo" });
      }
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name || !slug) {
        toast.error("Name and Shop URL are required");
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!address || latitude === "" || longitude === "") {
      toast.error("Address and Coordinates are required");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Ensure user has a profile and is an owner
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) {
        toast.error("You must be logged in");
        router.push("/auth/login");
        return;
      }

      // 2. Fetch existing profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.user.id).single();
      
      if (!profile) {
        // Create profile as owner
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "owner", fullName: authUser.user.email?.split('@')[0] || "Owner" })
        });
        if (!res.ok) throw new Error("Failed to create profile");
      } else if (profile.role !== "owner") {
        // Unfortunately we can't patch role via /api/profile directly because the schema doesn't allow it in PATCH, 
        // wait, let's look at the schema. The PATCH doesn't allow role.
        // We will do it directly via supabase if RLS allows, but RLS doesn't allow changing own role usually.
        // Wait, if it fails, we will throw. Usually a shop owner signs up specifically. 
        // Let's assume they are already an owner or we need to just try creating the shop.
        // Actually, if we fail to create shop because of role, we can show an error.
      }

      // 3. Create Shop via API
      const shopRes = await fetch("/api/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description,
          address,
          latitude: Number(latitude),
          longitude: Number(longitude)
        })
      });

      const shopData = await shopRes.json();
      
      if (!shopRes.ok) {
        if (shopData.error === "Only accounts with the 'owner' role can create a shop") {
          // Fallback: forcefully update role via supabase if we can (likely blocked by RLS, but let's try)
          // Actually, in a real SaaS, there'd be an endpoint to become a partner.
          // Let's just alert for now or we can implement a workaround.
          throw new Error("Your account is not an 'owner' account. Please contact support to upgrade your account to partner.");
        }
        throw new Error(shopData.error || "Failed to create shop");
      }

      toast.success("Shop registered successfully!");
      setStep(3); // Success step
      
      setTimeout(() => {
        router.push("/shop/settings");
      }, 2000);

    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8 w-full max-w-[500px] relative overflow-hidden">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Partner with YourPrinter</h1>
        <p className="text-slate-500 font-medium">Set up your print shop and start receiving orders instantly.</p>
      </div>

      <div className="flex mb-8 gap-2">
        <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-[#2563EB]' : 'bg-slate-100'}`}></div>
        <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-[#2563EB]' : 'bg-slate-100'}`}></div>
        <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-100'}`}></div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Shop Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={handleNameChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all font-medium text-slate-900"
                  placeholder="e.g. Campus Printers"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Shop URL Slug</label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-500 font-medium sm:text-sm">
                    yourprinter.in/
                  </span>
                  <input 
                    type="text" 
                    value={slug} 
                    onChange={(e) => setSlug(e.target.value)}
                    className="flex-1 w-full px-4 py-3 rounded-r-xl border border-slate-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all font-medium text-slate-900"
                    placeholder="campus-printers"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Description (Optional)</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all font-medium text-slate-900 h-24 resize-none"
                  placeholder="Tell students about your services..."
                />
              </div>

              <button 
                onClick={handleNext}
                className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4 shadow-lg shadow-blue-500/30"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Address</label>
                <textarea 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all font-medium text-slate-900 h-20 resize-none"
                  placeholder="Shop No. 4, Ground Floor..."
                />
              </div>
              
              <div className="pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                  <label className="block text-sm font-bold text-slate-700">Location Coordinates</label>
                  <button onClick={getLocation} className="text-xs font-bold text-[#2563EB] bg-blue-50 px-3 py-2 sm:py-1.5 rounded-lg flex items-center justify-center sm:justify-start gap-1 hover:bg-blue-100 transition-colors w-full sm:w-auto">
                    <LocateFixed className="w-3.5 h-3.5" /> Auto-locate
                  </button>
                </div>
                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Latitude</label>
                    <input 
                      type="number" step="any"
                      value={latitude} 
                      onChange={(e) => setLatitude(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#2563EB] outline-none transition-all font-medium text-slate-900 text-sm"
                      placeholder="19.0760"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Longitude</label>
                    <input 
                      type="number" step="any"
                      value={longitude} 
                      onChange={(e) => setLongitude(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#2563EB] outline-none transition-all font-medium text-slate-900 text-sm"
                      placeholder="72.8777"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => setStep(1)}
                  className="px-5 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 bg-[#2563EB] hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Registration"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Registration Complete!</h2>
              <p className="text-slate-500 font-medium">Your shop has been created. Redirecting you to the dashboard to set up pricing...</p>
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mt-4" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
