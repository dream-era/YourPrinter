import { SearchSuggestionItem } from "./types";

export const PRESET_SEARCH_INDEX: SearchSuggestionItem[] = [
  // Colleges
  { id: "col-1", title: "IIT Bombay (Powai Campus)", category: "college", subtitle: "Powai, Mumbai • 400076", pincode: "400076", city: "Mumbai" },
  { id: "col-2", title: "VJTI Mumbai (Matunga)", category: "college", subtitle: "Matunga, Mumbai • 400019", pincode: "400019", city: "Mumbai" },
  { id: "col-3", title: "St. Xavier's College (Fort)", category: "college", subtitle: "Fort, Mumbai • 400001", pincode: "400001", city: "Mumbai" },
  { id: "col-4", title: "NMIMS / Mithibai College", category: "college", subtitle: "Vile Parle West, Mumbai • 400056", pincode: "400056", city: "Mumbai" },
  { id: "col-5", title: "DU South Campus", category: "college", subtitle: "New Delhi • 110021", pincode: "110021", city: "Delhi NCR" },
  { id: "col-6", title: "IISc Bengaluru", category: "college", subtitle: "Mathikere, Bengaluru • 560012", pincode: "560012", city: "Bengaluru" },

  // Areas
  { id: "area-1", title: "Bandra Kurla Complex (BKC)", category: "area", subtitle: "Mumbai • 400051", pincode: "400051", city: "Mumbai" },
  { id: "area-2", title: "Powai Hub", category: "area", subtitle: "Mumbai • 400076", pincode: "400076", city: "Mumbai" },
  { id: "area-3", title: "Lower Parel Hub", category: "area", subtitle: "Mumbai • 400013", pincode: "400013", city: "Mumbai" },
  { id: "area-4", title: "Andheri West Hub", category: "area", subtitle: "Mumbai • 400058", pincode: "400058", city: "Mumbai" },

  // Shops
  { id: "shop-1", title: "QuickPrint Studio BKC", category: "shop", subtitle: "Tower 2, BKC, Mumbai • 400051", pincode: "400051", city: "Mumbai", shopId: "shop-1" },
  { id: "shop-2", title: "Campus Print Hub Powai", category: "shop", subtitle: "Opp. IIT Main Gate, Mumbai • 400076", pincode: "400076", city: "Mumbai", shopId: "shop-2" },
  { id: "shop-3", title: "Express Digital Press Lower Parel", category: "shop", subtitle: "Phoenix Mills, Mumbai • 400013", pincode: "400013", city: "Mumbai", shopId: "shop-3" },

  // Pincodes
  { id: "pin-1", title: "400051 (BKC)", category: "pincode", subtitle: "Pincode • Bandra East, Mumbai", pincode: "400051", city: "Mumbai" },
  { id: "pin-2", title: "400076 (Powai)", category: "pincode", subtitle: "Pincode • Powai, Mumbai", pincode: "400076", city: "Mumbai" },
  { id: "pin-3", title: "400050 (Bandra West)", category: "pincode", subtitle: "Pincode • Bandra West, Mumbai", pincode: "400050", city: "Mumbai" },
];

/**
 * Perform multi-field instant search matching across Shop Name, College, Area, City, & Pincode
 */
export function querySearchIndex(query: string): SearchSuggestionItem[] {
  if (!query || query.trim().length === 0) return [];

  const q = query.trim().toLowerCase();

  return PRESET_SEARCH_INDEX.filter((item) => {
    const matchTitle = item.title.toLowerCase().includes(q);
    const matchSubtitle = item.subtitle ? item.subtitle.toLowerCase().includes(q) : false;
    const matchPincode = item.pincode ? item.pincode.includes(q) : false;
    const matchCity = item.city ? item.city.toLowerCase().includes(q) : false;

    return matchTitle || matchSubtitle || matchPincode || matchCity;
  }).slice(0, 8); // Top 8 suggestions
}
