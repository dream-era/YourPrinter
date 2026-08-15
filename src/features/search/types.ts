/**
 * Types and Interfaces for Shop Search Engine
 */

export type SearchCategory = "shop" | "college" | "area" | "city" | "pincode";

export interface SearchSuggestionItem {
  id: string;
  title: string;
  category: SearchCategory;
  subtitle?: string;
  pincode?: string;
  city?: string;
  shopId?: string;
}

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}
