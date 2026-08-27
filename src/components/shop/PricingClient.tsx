"use client";

import React, { useState, useEffect } from "react";
import { Bell, ChevronDown } from "lucide-react";
import { toast } from "sonner";

type TabValue = "print_copy" | "xerox" | "scanning" | "binding" | "lamination" | "photo" | "other" | "rules";

const TABS: { label: string; value: TabValue }[] = [
  { label: "Print & Copy", value: "print_copy" },
  { label: "Xerox", value: "xerox" },
  { label: "Scanning", value: "scanning" },
  { label: "Binding", value: "binding" },
  { label: "Lamination", value: "lamination" },
  { label: "Photo Print", value: "photo" },
  { label: "Other Services", value: "other" },
  { label: "Shop Rules", value: "rules" },
];

export default function PricingClient({ shopId }: { shopId: string }) {
  const [activeTab, setActiveTab] = useState<TabValue>("print_copy");
  const [isDirty, setIsDirty] = useState(false);
  const [printCopyMode, setPrintCopyMode] = useState<"bw" | "color">("bw");
  const [loading, setLoading] = useState(true);

  // Default State for all pricing
  const [prices, setPrices] = useState({
    print: {
      bw: { a4_single: "1.00", a4_double: "1.50", a3_single: "2.00", a3_double: "3.00", a5_single: "0.50", a5_double: "0.75", legal_single: "2.00", legal_double: "3.00", letter_single: "1.50", letter_double: "2.25" },
      color: { a4_single: "10.00", a4_double: "15.00", a3_single: "20.00", a3_double: "30.00", a5_single: "5.00", a5_double: "7.50", legal_single: "20.00", legal_double: "30.00", letter_single: "15.00", letter_double: "22.50" }
    },
    xerox: {
      a4_bw_single: "1.50", a4_bw_double: "2.00",
      a4_color_single: "8.00", a4_color_double: "12.00",
      a3_bw_single: "3.00", a3_bw_double: "4.00",
      a3_color_single: "15.00", a3_color_double: "20.00"
    },
    binding: { spiral: "20.00", soft: "30.00", hard: "60.00", comb: "25.00", thermal: "40.00" },
    lamination: { id: "10.00", a5: "15.00", a4: "20.00", a3: "30.00" },
    photo: { passport: "10.00", p4x6: "15.00", p5x7: "20.00", p6x8: "25.00", a4: "30.00" },
    scanning: { a4: "2.00", a3: "3.00", email: "5.00", usb: "5.00" },
    extra: { stapling: "2.00", clip: "1.00", folder: "10.00", transparent: "5.00", plastic: "10.00", hole: "2.00", file: "15.00" },
    student: { enabled: true, percent: "10", minOrder: "50.00" },
    urgent: { enabled: true, charge: "10.00", note: "Applied to all urgent print orders." },
    paper: { g70: "0.00", g75: "0.50", g80: "1.00", g100: "2.00", g120: "3.00", glossy: "5.00" },
    rules: { minOrder: "10.00", maxFile: "50", maxPages: "500", acceptColor: true, acceptBinding: true, acceptLam: true }
  });

  const [initialPrices, setInitialPrices] = useState(JSON.stringify(prices));

  useEffect(() => {
    async function loadPricing() {
      try {
        const res = await fetch(`/api/shops/${shopId}/pricing`);
        if (res.ok) {
          const data = await res.json();
          if (data.pricing?.config && Object.keys(data.pricing.config).length > 0) {
            setPrices(data.pricing.config);
            setInitialPrices(JSON.stringify(data.pricing.config));
          }
        }
      } catch (err) {
        toast.error("Failed to load pricing config.");
      } finally {
        setLoading(false);
      }
    }
    loadPricing();
  }, [shopId]);

  useEffect(() => {
    if (!loading) {
      setIsDirty(JSON.stringify(prices) !== initialPrices);
    }
  }, [prices, initialPrices, loading]);

  const handleSave = async () => {
    try {
      const payload = {
        bwRatePaise: Math.round(parseFloat(prices.print.bw.a4_single || "0") * 100),
        colorRatePaise: Math.round(parseFloat(prices.print.color.a4_single || "0") * 100),
        spiralBindingRatePaise: Math.round(parseFloat(prices.binding.spiral || "0") * 100),
        hardboundRatePaise: Math.round(parseFloat(prices.binding.hard || "0") * 100),
        laminationRatePaise: Math.round(parseFloat(prices.lamination.a4 || "0") * 100),
        urgentFeePercent: parseInt(prices.urgent.charge || "0"),
        config: prices
      };
      
      const res = await fetch(`/api/shops/${shopId}/pricing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Failed to save pricing");
      
      setInitialPrices(JSON.stringify(prices));
      setIsDirty(false);
      toast.success("Pricing and Services updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save pricing");
    }
  };

  const handleReset = () => {
    setPrices(JSON.parse(initialPrices));
    setIsDirty(false);
  };

  const updatePrice = (category: string, subCategory: string | null, field: string, value: any) => {
    setPrices(prev => {
      const newPrices = { ...prev };
      if (subCategory) {
        // @ts-expect-error Dynamic object indexing
        newPrices[category][subCategory][field] = value;
      } else {
        // @ts-expect-error Dynamic object indexing
        newPrices[category][field] = value;
      }
      return newPrices;
    });
  };

  const PriceInput = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
        className="w-[120px] pl-8 pr-4 py-2.5 bg-white border border-[#E8EDF8] rounded-[12px] text-[15px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2A5BE9]/20 focus:border-[#2A5BE9] hover:border-slate-300 transition-all text-right"
      />
    </div>
  );

  const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <button 
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-[#2A5BE9]' : 'bg-slate-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#E9F0FF] overflow-hidden">
      
      {/* Top Header */}
      <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 border-b border-[#E8EDF8] bg-white shrink-0 z-20 shadow-sm relative">
        <div>
          <h1 className="text-xl md:text-[24px] font-bold text-[#111827] tracking-tight">Pricing & Services</h1>
          <p className="hidden md:block text-[14px] text-[#6B7280] font-medium mt-0.5">Manage pricing for every service available in your print shop.</p>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6">
          <button className="relative w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
            <Bell className="w-5 h-5 text-[#6B7280]" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-[#FFB5A7] text-[#FF6B57] font-bold flex items-center justify-center text-sm shadow-sm border border-slate-100">
              ME
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-[14px] font-bold text-[#111827]">Shop Owner</span>
              <span className="text-[12px] font-medium text-[#6B7280]">Owner</span>
            </div>
            <ChevronDown className="hidden md:block w-4 h-4 text-slate-400 ml-1" />
          </div>
        </div>
      </header>

      {/* Horizontal Category Tabs */}
      <div className="bg-white border-b border-[#E8EDF8] px-8 shrink-0 z-10 sticky top-0 shadow-sm">
        <div className="flex overflow-x-auto custom-scrollbar no-scrollbar py-2">
          <div className="flex space-x-2">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-3 text-[14px] font-medium whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.value 
                    ? "border-[#2A5BE9] text-[#2A5BE9]" 
                    : "border-transparent text-[#6B7280] hover:text-[#111827] hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
        <div className="max-w-[800px] mx-auto pb-24 space-y-8">
          
          {/* Print & Copy Card */}
          {activeTab === "print_copy" && (
            <div className="bg-white rounded-[18px] p-6 shadow-sm border border-[#E8EDF8]">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-[20px] font-bold text-[#111827]">Print & Copy</h2>
                  <p className="text-[14px] text-[#6B7280] mt-1">Configure {printCopyMode === 'bw' ? 'black & white' : 'color'} printing charges.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-[10px]">
                  <button 
                    onClick={() => setPrintCopyMode('bw')}
                    className={`px-4 py-2 rounded-md text-[14px] font-bold transition-all ${printCopyMode === 'bw' ? 'bg-[#2A5BE9] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'}`}
                  >
                    B&W
                  </button>
                  <button 
                    onClick={() => setPrintCopyMode('color')}
                    className={`px-4 py-2 rounded-md text-[14px] font-bold transition-all ${printCopyMode === 'color' ? 'bg-[#2A5BE9] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'}`}
                  >
                    Color
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-[13px] font-bold text-slate-400 uppercase px-4 pb-2">
                  <div>Paper Size</div>
                  <div className="text-right pr-6">Single Side</div>
                  <div className="text-right pr-6">Double Side</div>
                </div>
                
                {["A4", "A3", "A5", "Legal", "Letter"].map(size => {
                  const key = size.toLowerCase();
                  return (
                    <div key={size} className="grid grid-cols-3 gap-4 items-center px-4 py-2 hover:bg-slate-50 rounded-xl transition-colors">
                      <div className="font-bold text-[#111827]">{size}</div>
                      <div className="flex justify-end">
                        <PriceInput 
                          value={prices.print[printCopyMode][`${key}_single` as keyof typeof prices.print.bw]} 
                          onChange={(v) => updatePrice('print', printCopyMode, `${key}_single`, v)} 
                        />
                      </div>
                      <div className="flex justify-end">
                        <PriceInput 
                          value={prices.print[printCopyMode][`${key}_double` as keyof typeof prices.print.bw]} 
                          onChange={(v) => updatePrice('print', printCopyMode, `${key}_double`, v)} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Xerox Card */}
          {activeTab === "xerox" && (
            <div className="bg-white rounded-[18px] p-6 shadow-sm border border-[#E8EDF8]">
              <div className="mb-8 pb-4 border-b border-slate-100">
                <h2 className="text-[20px] font-bold text-[#111827]">Xerox (Photocopy)</h2>
                <p className="text-[14px] text-[#6B7280] mt-1">Set pricing for photocopy services</p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-[13px] font-bold text-slate-400 uppercase px-4 pb-2">
                  <div>Paper Size & Mode</div>
                  <div className="text-right pr-6">Single Side</div>
                  <div className="text-right pr-6">Double Side</div>
                </div>
                
                {[
                  { label: "A4 B&W", k_single: "a4_bw_single", k_double: "a4_bw_double" },
                  { label: "A4 Color", k_single: "a4_color_single", k_double: "a4_color_double" },
                  { label: "A3 B&W", k_single: "a3_bw_single", k_double: "a3_bw_double" },
                  { label: "A3 Color", k_single: "a3_color_single", k_double: "a3_color_double" },
                ].map(row => (
                    <div key={row.label} className="grid grid-cols-3 gap-4 items-center px-4 py-2 hover:bg-slate-50 rounded-xl transition-colors">
                      <div className="font-bold text-[#111827]">{row.label}</div>
                      <div className="flex justify-end">
                        <PriceInput value={prices.xerox[row.k_single as keyof typeof prices.xerox]} onChange={(v) => updatePrice('xerox', null, row.k_single, v)} />
                      </div>
                      <div className="flex justify-end">
                        <PriceInput value={prices.xerox[row.k_double as keyof typeof prices.xerox]} onChange={(v) => updatePrice('xerox', null, row.k_double, v)} />
                      </div>
                    </div>
                ))}
              </div>
            </div>
          )}

          {/* Scanning Card */}
          {activeTab === "scanning" && (
            <div className="bg-white rounded-[18px] p-6 shadow-sm border border-[#E8EDF8]">
              <div className="mb-8 pb-4 border-b border-slate-100">
                <h2 className="text-[20px] font-bold text-[#111827]">Scanning</h2>
                <p className="text-[14px] text-[#6B7280] mt-1">Set pricing for scanning services</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-[13px] font-bold text-slate-400 uppercase px-4 pb-2">
                  <div>Service</div>
                  <div className="text-right pr-6">Price (Per Page)</div>
                </div>
                {[
                  { label: "A4 Scan", key: "a4" },
                  { label: "A3 Scan", key: "a3" },
                  { label: "Email Scan", key: "email" },
                  { label: "USB Scan", key: "usb" },
                ].map(row => (
                  <div key={row.label} className="grid grid-cols-2 gap-4 items-center px-4 py-2 hover:bg-slate-50 rounded-xl transition-colors">
                    <div className="font-bold text-[#111827]">{row.label}</div>
                    <div className="flex justify-end">
                      <PriceInput value={prices.scanning[row.key as keyof typeof prices.scanning]} onChange={(v) => updatePrice('scanning', null, row.key, v)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Binding Card */}
          {activeTab === "binding" && (
            <div className="bg-white rounded-[18px] p-6 shadow-sm border border-[#E8EDF8]">
              <div className="mb-8 pb-4 border-b border-slate-100">
                <h2 className="text-[20px] font-bold text-[#111827]">Binding Services</h2>
                <p className="text-[14px] text-[#6B7280] mt-1">Set pricing for binding services</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-[13px] font-bold text-slate-400 uppercase px-4 pb-2">
                  <div>Binding Type</div>
                  <div className="text-right pr-6">Price</div>
                </div>
                {[
                  { label: "Spiral Binding", key: "spiral" },
                  { label: "Soft Binding", key: "soft" },
                  { label: "Hard Binding", key: "hard" },
                  { label: "Comb Binding", key: "comb" },
                  { label: "Thermal Binding", key: "thermal" },
                ].map(row => (
                  <div key={row.label} className="grid grid-cols-2 gap-4 items-center px-4 py-2 hover:bg-slate-50 rounded-xl transition-colors">
                    <div className="font-bold text-[#111827]">{row.label}</div>
                    <div className="flex justify-end">
                      <PriceInput value={prices.binding[row.key as keyof typeof prices.binding]} onChange={(v) => updatePrice('binding', null, row.key, v)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lamination Card */}
          {activeTab === "lamination" && (
            <div className="bg-white rounded-[18px] p-6 shadow-sm border border-[#E8EDF8]">
              <div className="mb-8 pb-4 border-b border-slate-100">
                <h2 className="text-[20px] font-bold text-[#111827]">Lamination</h2>
                <p className="text-[14px] text-[#6B7280] mt-1">Set pricing for lamination services</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-[13px] font-bold text-slate-400 uppercase px-4 pb-2">
                  <div>Size</div>
                  <div className="text-right pr-6">Price</div>
                </div>
                {[
                  { label: "ID Card", key: "id" },
                  { label: "A5", key: "a5" },
                  { label: "A4", key: "a4" },
                  { label: "A3", key: "a3" },
                ].map(row => (
                  <div key={row.label} className="grid grid-cols-2 gap-4 items-center px-4 py-2 hover:bg-slate-50 rounded-xl transition-colors">
                    <div className="font-bold text-[#111827]">{row.label}</div>
                    <div className="flex justify-end">
                      <PriceInput value={prices.lamination[row.key as keyof typeof prices.lamination]} onChange={(v) => updatePrice('lamination', null, row.key, v)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photo Print */}
          {activeTab === "photo" && (
            <div className="bg-white rounded-[18px] p-6 shadow-sm border border-[#E8EDF8]">
              <div className="mb-8 pb-4 border-b border-slate-100">
                <h2 className="text-[20px] font-bold text-[#111827]">Photo Printing</h2>
                <p className="text-[14px] text-[#6B7280] mt-1">Set pricing for photo prints</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-[13px] font-bold text-slate-400 uppercase px-4 pb-2">
                  <div>Size</div>
                  <div className="text-right pr-6">Price</div>
                </div>
                {[
                  { label: "Passport", key: "passport" },
                  { label: "4x6", key: "p4x6" },
                  { label: "5x7", key: "p5x7" },
                  { label: "6x8", key: "p6x8" },
                  { label: "A4 Photo", key: "a4" },
                ].map(row => (
                  <div key={row.label} className="grid grid-cols-2 gap-4 items-center px-4 py-2 hover:bg-slate-50 rounded-xl transition-colors">
                    <div className="font-bold text-[#111827]">{row.label}</div>
                    <div className="flex justify-end">
                      <PriceInput value={prices.photo[row.key as keyof typeof prices.photo]} onChange={(v) => updatePrice('photo', null, row.key, v)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Services */}
          {activeTab === "other" && (
            <div className="space-y-8">
              
              {/* Extra Charges */}
              <div className="bg-white rounded-[18px] p-6 shadow-sm border border-[#E8EDF8]">
                <div className="mb-8 pb-4 border-b border-slate-100">
                  <h2 className="text-[20px] font-bold text-[#111827]">Extra Charges</h2>
                  <p className="text-[14px] text-[#6B7280] mt-1">Charges for additional items</p>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Stapling (Per Set)", key: "stapling" },
                    { label: "Paper Clip (Per Set)", key: "clip" },
                    { label: "Folder", key: "folder" },
                    { label: "Transparent Sheet", key: "transparent" },
                    { label: "Plastic Cover", key: "plastic" },
                    { label: "Hole Punch (Per Paper)", key: "hole" },
                    { label: "File Cover", key: "file" },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center px-4 py-2 hover:bg-slate-50 rounded-xl transition-colors">
                      <div className="font-bold text-[#111827] text-[14px]">{row.label}</div>
                      <PriceInput value={prices.extra[row.key as keyof typeof prices.extra]} onChange={(v) => updatePrice('extra', null, row.key, v)} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Student Discount */}
              <div className="bg-white rounded-[18px] p-6 shadow-sm border border-[#E8EDF8]">
                <div className="mb-8 pb-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#111827]">Student Discount</h2>
                    <p className="text-[14px] text-[#6B7280] mt-1">Discount for students</p>
                  </div>
                  <Toggle checked={prices.student.enabled} onChange={(v) => updatePrice('student', null, 'enabled', v)} />
                </div>
                <div className="grid grid-cols-2 gap-8 opacity-100 transition-opacity" style={{ opacity: prices.student.enabled ? 1 : 0.5, pointerEvents: prices.student.enabled ? 'auto' : 'none' }}>
                  <div>
                    <label className="block text-[14px] font-medium text-[#111827] mb-2">Discount Percentage (%)</label>
                    <input 
                      type="number" 
                      value={prices.student.percent}
                      onChange={(e) => updatePrice('student', null, 'percent', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-[#E8EDF8] rounded-[12px] text-[15px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2A5BE9]/20 focus:border-[#2A5BE9]"
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] font-medium text-[#111827] mb-2">Minimum Order Amount</label>
                    <PriceInput value={prices.student.minOrder} onChange={(v) => updatePrice('student', null, 'minOrder', v)} />
                  </div>
                </div>
              </div>

              {/* Urgent Printing */}
              <div className="bg-white rounded-[18px] p-6 shadow-sm border border-[#E8EDF8]">
                <div className="mb-8 pb-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#111827]">Urgent Printing</h2>
                    <p className="text-[14px] text-[#6B7280] mt-1">Extra charge for urgent printing</p>
                  </div>
                  <Toggle checked={prices.urgent.enabled} onChange={(v) => updatePrice('urgent', null, 'enabled', v)} />
                </div>
                <div className="space-y-6" style={{ opacity: prices.urgent.enabled ? 1 : 0.5, pointerEvents: prices.urgent.enabled ? 'auto' : 'none' }}>
                  <div>
                    <label className="block text-[14px] font-medium text-[#111827] mb-2">Extra Charge</label>
                    <PriceInput value={prices.urgent.charge} onChange={(v) => updatePrice('urgent', null, 'charge', v)} />
                  </div>
                  <div>
                    <label className="block text-[14px] font-medium text-[#111827] mb-2">Internal Note</label>
                    <textarea 
                      value={prices.urgent.note}
                      onChange={(e) => updatePrice('urgent', null, 'note', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 bg-white border border-[#E8EDF8] rounded-[12px] text-[15px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2A5BE9]/20 focus:border-[#2A5BE9] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Paper Quality */}
              <div className="bg-white rounded-[18px] p-6 shadow-sm border border-[#E8EDF8]">
                <div className="mb-8 pb-4 border-b border-slate-100">
                  <h2 className="text-[20px] font-bold text-[#111827]">Paper Quality (GSM)</h2>
                  <p className="text-[14px] text-[#6B7280] mt-1">Extra charge based on paper quality</p>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "70 GSM", key: "g70" },
                    { label: "75 GSM", key: "g75" },
                    { label: "80 GSM", key: "g80" },
                    { label: "100 GSM", key: "g100" },
                    { label: "120 GSM", key: "g120" },
                    { label: "Glossy Paper", key: "glossy" },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center px-4 py-2 hover:bg-slate-50 rounded-xl transition-colors">
                      <div className="font-bold text-[#111827] text-[14px]">{row.label}</div>
                      <PriceInput value={prices.paper[row.key as keyof typeof prices.paper]} onChange={(v) => updatePrice('paper', null, row.key, v)} />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Shop Rules */}
          {activeTab === "rules" && (
            <div className="bg-white rounded-[18px] p-6 shadow-sm border border-[#E8EDF8]">
              <div className="mb-8 pb-4 border-b border-slate-100">
                <h2 className="text-[20px] font-bold text-[#111827]">Shop Rules</h2>
                <p className="text-[14px] text-[#6B7280] mt-1">Set rules and limits for order placement</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-[14px] font-medium text-[#111827] mb-2">Minimum Order Value</label>
                  <PriceInput value={prices.rules.minOrder} onChange={(v) => updatePrice('rules', null, 'minOrder', v)} />
                </div>
                <div>
                  <label className="block text-[14px] font-medium text-[#111827] mb-2">Maximum File Size (MB)</label>
                  <input 
                    type="number" 
                    value={prices.rules.maxFile}
                    onChange={(e) => updatePrice('rules', null, 'maxFile', e.target.value)}
                    className="w-[120px] px-4 py-2.5 bg-white border border-[#E8EDF8] rounded-[12px] text-[15px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2A5BE9]/20 focus:border-[#2A5BE9] text-right"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-medium text-[#111827] mb-2">Maximum Pages</label>
                  <input 
                    type="number" 
                    value={prices.rules.maxPages}
                    onChange={(e) => updatePrice('rules', null, 'maxPages', e.target.value)}
                    className="w-[120px] px-4 py-2.5 bg-white border border-[#E8EDF8] rounded-[12px] text-[15px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2A5BE9]/20 focus:border-[#2A5BE9] text-right"
                  />
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-bold text-[#111827]">Accept Color Orders</span>
                  <Toggle checked={prices.rules.acceptColor} onChange={(v) => updatePrice('rules', null, 'acceptColor', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-bold text-[#111827]">Accept Binding Orders</span>
                  <Toggle checked={prices.rules.acceptBinding} onChange={(v) => updatePrice('rules', null, 'acceptBinding', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-bold text-[#111827]">Accept Lamination Orders</span>
                  <Toggle checked={prices.rules.acceptLam} onChange={(v) => updatePrice('rules', null, 'acceptLam', v)} />
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Sticky Bottom Save Bar */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-white border-t border-[#E8EDF8] p-4 px-4 md:px-8 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-4 transition-transform duration-300 z-50 ${isDirty ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
          <span className="text-[14px] font-medium text-[#6B7280]">Changes not saved</span>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handleReset}
            className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-[#E8EDF8] rounded-[12px] text-[14px] font-bold text-[#111827] hover:bg-slate-50 transition-colors shadow-sm"
          >
            Reset
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 md:flex-none px-6 py-2.5 bg-[#2A5BE9] hover:bg-[#1f4cd9] rounded-[12px] text-[14px] font-bold text-white transition-colors shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>

    </div>
  );
}
