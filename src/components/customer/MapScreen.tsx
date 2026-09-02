"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Map, { Marker, ViewStateChangeEvent } from "react-map-gl/maplibre";
import { Search, Bell, MapPin, Printer, LocateFixed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useMapShops, MapShop } from "@/features/discovery/use-map-shops";
import ShopInfoCard from "./ShopInfoCard";
import 'maplibre-gl/dist/maplibre-gl.css';

const DEFAULT_CENTER = {
  latitude: 19.1334,
  longitude: 72.9133,
  zoom: 14
};

const FILTERS = ["All", "Open Now", "24/7", "Quiet"];

export default function MapScreen() {
  const router = useRouter();
  const [viewState, setViewState] = useState(DEFAULT_CENTER);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Location permission states: idle | requested | granted | denied | manual
  const [locationStatus, setLocationStatus] = useState<"idle" | "requested" | "granted" | "denied" | "manual">("idle");
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Realtime hook fetching shops near current location, filtered by backend
  // We only fetch shops when we have a valid location
  const { shops, loading } = useMapShops(
    userLocation?.latitude, 
    userLocation?.longitude, 
    searchQuery, 
    activeFilter
  );

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  };

  const handleUseMyLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocationStatus("requested");
    toast.loading("Finding your location...", { id: "geo" });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setViewState({ latitude, longitude, zoom: 14 });
        setUserLocation({ latitude, longitude });
        setLocationStatus("granted");
        toast.success("Location found!", { id: "geo" });
      },
      (error) => {
        setLocationStatus("denied");
        toast.error("Location permission denied. Please enable it or search manually.", { id: "geo" });
      }
    );
  };

  const handleManualSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLocationStatus("manual");
    setIsGeocoding(true);
    
    try {
      // Use Nominatim OSM for free geocoding
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        
        setViewState({ latitude: lat, longitude: lon, zoom: 14 });
        setUserLocation({ latitude: lat, longitude: lon });
      } else {
        toast.error("Could not find that location. Please try another area or city.");
      }
    } catch (err) {
      toast.error("Search failed. Please try again.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleFindNearest = () => {
    if (!userLocation) {
      handleUseMyLocation();
      return;
    }

    let closestShop = null;
    let minDistance = 10; // 10 km radius limit

    for (const shop of shops) {
      const dist = getDistance(userLocation.latitude, userLocation.longitude, shop.latitude, shop.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        closestShop = shop;
      }
    }

    if (closestShop) {
      setSelectedShopId(closestShop.id);
      setViewState({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        zoom: 15
      });
      toast.success(`Found ${closestShop.name} nearby!`);
    } else {
      toast.info("No nearby print shops found within 10km.");
    }
  };

  const filteredShops = shops;
  const selectedShop = useMemo(() => {
    return shops.find(s => s.id === selectedShopId) || null;
  }, [shops, selectedShopId]);

  const handleMarkerClick = (e: any, shop: MapShop) => {
    e.originalEvent.stopPropagation();
    router.push(`/customer/shops/${shop.id}`);
  };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case "Quiet": return "bg-emerald-500";
      case "Moderate": return "bg-orange-500";
      case "Busy": return "bg-red-500";
      case "24/7": return "bg-[#2563EB]";
      default: return "bg-slate-500";
    }
  };

  return (
    <div className="relative w-full h-full bg-[#F8FAFC]">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pb-0 pointer-events-none max-w-3xl mx-auto w-full">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-4 pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white shadow-md">
              <Image src="/logo.png" alt="YourPrinter" fill className="object-contain" />
            </div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">YourPrinter</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/customer/notifications" className="relative w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
              <Bell className="w-5 h-5 text-slate-700" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </Link>
            <Link href="/customer/profile" className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">U</div>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4 pointer-events-auto shadow-lg shadow-slate-200/50 rounded-2xl">
          <form onSubmit={handleManualSearch} className="flex">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-24 py-4 bg-white border border-slate-100 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
              placeholder="Search city, area, or pincode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              type="submit"
              className="absolute right-2 top-2 bottom-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold px-4 rounded-xl transition-colors disabled:opacity-50"
              disabled={isGeocoding || !searchQuery.trim()}
            >
              Search
            </button>
          </form>
        </div>

        {/* Filter Chips */}
        {userLocation && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide pointer-events-auto">
            {FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm border ${
                  activeFilter === filter 
                    ? "bg-[#2563EB] text-white border-[#2563EB]" 
                    : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                }`}
              >
                {filter === "All" && <MapPin className="w-4 h-4" />}
                {filter === "Open Now" && <span className={`w-2 h-2 rounded-full ${activeFilter === filter ? 'bg-white' : 'bg-emerald-500'}`}></span>}
                {filter === "24/7" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
                {filter === "Quiet" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>}
                {filter}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Onboarding Overlay */}
      {locationStatus === "idle" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-100 text-center"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Find printing shops near you</h2>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
              YourPrinter uses your location to show nearby registered print shops so you can print documents instantly.
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={handleUseMyLocation}
                className="w-full bg-[#2563EB] text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                <LocateFixed className="w-5 h-5" />
                Use My Location
              </button>
              
              <button 
                onClick={() => setLocationStatus("manual")}
                className="w-full bg-slate-50 text-slate-600 font-bold py-3.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Search by Area
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Mapbox Map */}
      <Map
        {...viewState}
        onMove={(e: ViewStateChangeEvent) => setViewState(e.viewState)}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
        onClick={() => setSelectedShopId(null)}
      >
        {userLocation && filteredShops.map(shop => (
          <Marker 
            key={shop.id} 
            latitude={shop.latitude} 
            longitude={shop.longitude}
            anchor="bottom"
            onClick={(e) => handleMarkerClick(e, shop)}
          >
            <div className={`relative flex flex-col items-center cursor-pointer transition-transform hover:scale-110 ${selectedShopId === shop.id ? 'scale-110 z-20' : 'z-10'}`}>
              
              {/* Tooltip bubble */}
              <div className="bg-white px-3 py-1.5 rounded-xl shadow-lg mb-1 flex flex-col items-center border border-slate-100">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                  <span className={`w-2 h-2 rounded-full ${getMarkerColor(shop.queueStatus)}`}></span>
                  {shop.queueStatus}
                </div>
                {shop.queueStatus !== "24/7" && (
                  <div className="text-[9px] text-slate-500 font-medium">
                    {shop.estimatedWaitMins} min wait
                  </div>
                )}
              </div>
              
              {/* Pin point */}
              <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center shadow-lg border-2 border-white ${getMarkerColor(shop.queueStatus)}`}>
                {shop.queueStatus === "24/7" ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                ) : (
                  <Printer className="w-5 h-5" />
                )}
              </div>
              <div className={`w-3 h-3 rotate-45 -mt-2 border-b-2 border-r-2 border-white ${getMarkerColor(shop.queueStatus)}`}></div>
            </div>
          </Marker>
        ))}

        {/* User Location Marker (Pulse effect) */}
        {userLocation && (
          <Marker latitude={userLocation.latitude} longitude={userLocation.longitude} anchor="center">
            <div className="relative flex items-center justify-center w-24 h-24">
              <div className="absolute w-full h-full bg-blue-500/20 rounded-full animate-ping"></div>
              <div className="absolute w-12 h-12 bg-blue-500/20 rounded-full"></div>
              <div className="w-5 h-5 bg-[#2563EB] rounded-full border-2 border-white shadow-lg relative z-10"></div>
            </div>
          </Marker>
        )}
      </Map>

      {/* Find YourPrinter Button */}
      {userLocation && (
        <div className="absolute bottom-[140px] left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
          <motion.button 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFindNearest}
            className="bg-[#2563EB] text-white rounded-full h-[56px] px-8 flex items-center gap-2 font-bold shadow-[0_12px_30px_rgba(37,99,235,0.25)] transition-colors hover:bg-[#1d4ed8]"
          >
            <LocateFixed className="w-5 h-5" />
            Find My Printer
          </motion.button>
        </div>
      )}

      {/* Floating Shop Details Card */}
      <ShopInfoCard shop={selectedShop} onClose={() => setSelectedShopId(null)} />
    </div>
  );
}
