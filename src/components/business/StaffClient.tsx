"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, Search, Plus, 
  MoreVertical, Shield, User,
  Mail, Phone
} from "lucide-react";

type Employee = {
  id: string;
  name: string;
  role: string;
  status: "active" | "offline";
  email: string;
  phone: string;
  avatar: string;
};

import { createClient } from "@/lib/supabase/client";

export default function StaffClient({ shopId }: { shopId: string }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const supabase = createClient();

  React.useEffect(() => {
    async function fetchStaff() {
      const { data, error } = await supabase
        .from('shop_staff')
        .select('*')
        .eq('shop_id', shopId);
      
      if (!error && data) {
        setEmployees(data.map(staff => ({
          id: staff.id,
          name: staff.display_name || 'Staff Member',
          role: staff.role || 'Staff',
          status: staff.active ? 'active' : 'offline',
          email: '', // Not strictly needed in UI or fetch it if joined
          phone: staff.phone || '',
          avatar: staff.display_name ? staff.display_name.substring(0, 2).toUpperCase() : 'ST'
        })));
      }
    }
    fetchStaff();
  }, [shopId, supabase]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  const filteredStaff = employees.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full">
      
      {/* LEFT CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Header Row */}
        <header className="flex items-center justify-between px-4 sm:px-8 py-6 shrink-0 bg-[#F9FAFB]">
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Employees</h1>
          
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FFB5A7] text-[#FF6B57] font-bold flex items-center justify-center text-sm">
                SA
              </div>
              <div className="flex flex-col hidden sm:flex">
                <span className="text-[14px] font-bold text-slate-800 leading-tight">Shop Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Filter & Search Row */}
        <div className="px-4 sm:px-8 pb-6 shrink-0 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative w-full md:w-[320px]">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#FF6B57] focus:ring-1 focus:ring-[#FF6B57]/20 text-[14px] text-slate-700 placeholder-slate-400 shadow-sm"
              disabled
            />
          </div>

          <button className="w-full md:w-auto justify-center bg-[#FF6B57] hover:bg-[#F25C47] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-[14px] shadow-sm shadow-[#FF6B57]/20 transition-all active:scale-95 disabled:opacity-50" disabled>
            <Plus className="w-5 h-5" />
            Add Employee
          </button>
        </div>

        {/* Grid Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-8 hide-scrollbar flex items-center justify-center">
          
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No staff members yet</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              Add your first employee to start managing access and permissions for your print shop.
            </p>
          </div>

        </div>
      </div>

      {/* RIGHT CONTENT AREA: EMPLOYEE DETAILS */}
      <AnimatePresence>
        {selectedEmp && (
          <motion.div 
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="w-full sm:w-[420px] absolute right-0 top-0 sm:relative bg-white h-full border-l border-slate-100 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] flex flex-col z-50 shrink-0"
          >
            {/* Header */}
            <div className="px-4 sm:px-8 py-6 flex justify-between items-center border-b border-transparent">
              <h2 className="text-[20px] font-bold text-slate-900">Manage Access</h2>
            </div>

            {/* Profile Info */}
            <div className="px-4 sm:px-8 pb-8 border-b border-slate-50 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-[2rem] bg-[#FFB5A7] text-[#FF6B57] flex items-center justify-center text-[28px] font-black mb-4">
                {selectedEmp.avatar}
              </div>
              <h3 className="font-bold text-[20px] text-slate-800 mb-1">{selectedEmp.name}</h3>
              <p className="text-[14px] text-slate-500 font-medium mb-4">{selectedEmp.role}</p>
              
              <div className={`px-4 py-1.5 rounded-full text-[12px] font-bold flex items-center gap-1.5 ${
                selectedEmp.status === 'active' ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-slate-100 text-slate-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${selectedEmp.status === 'active' ? 'bg-[#16A34A]' : 'bg-slate-400'}`}></span>
                {selectedEmp.status === 'active' ? 'Currently Online' : 'Offline'}
              </div>
            </div>

            {/* Permissions List */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 hide-scrollbar flex flex-col gap-6">
              <h4 className="font-bold text-[14px] text-slate-900 uppercase tracking-wider mb-2">Permissions</h4>
              
              {[
                { name: "Manage Orders", desc: "Can view and update print jobs", enabled: true },
                { name: "Financial Reports", desc: "Access to revenue and earnings", enabled: selectedEmp.role === 'Manager' },
                { name: "Manage Staff", desc: "Can add or remove employees", enabled: selectedEmp.role === 'Manager' },
                { name: "Shop Settings", desc: "Edit pricing and working hours", enabled: false },
              ].map((perm, idx) => (
                <div key={idx} className="flex gap-4 items-center justify-between">
                  <div>
                    <h4 className="font-bold text-[15px] text-slate-800 mb-0.5">{perm.name}</h4>
                    <p className="text-[12px] text-slate-400 font-medium">{perm.desc}</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${perm.enabled ? 'bg-[#FF6B57]' : 'bg-slate-200'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${perm.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals & Action */}
            <div className="p-4 sm:p-8 bg-white border-t border-slate-50">
              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedEmp(null)}
                  className="flex-1 py-4 rounded-xl bg-slate-50 text-slate-600 font-bold text-[16px] hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setSelectedEmp(null)}
                  className="flex-1 py-4 rounded-xl bg-[#FF6B57] text-white font-bold text-[16px] hover:bg-[#F25C47] transition-colors shadow-lg shadow-[#FF6B57]/30"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
