/**
 * Types and Interfaces for Advanced Multi-Filter & URL Persistence System
 */

export type SortDimension =
  | "recommended"
  | "fastest_ready"
  | "nearest"
  | "lowest_price"
  | "highest_rating"
  | "most_popular";

export interface AdvancedFilterState {
  openNowOnly: boolean;
  colorOnly: boolean;
  bwOnly: boolean;
  photoPrintingOnly: boolean;
  laminationOnly: boolean;
  spiralBindingOnly: boolean;
  sortBy: SortDimension;
}

export const DEFAULT_ADVANCED_FILTERS: AdvancedFilterState = {
  openNowOnly: true,
  colorOnly: false,
  bwOnly: false,
  photoPrintingOnly: false,
  laminationOnly: false,
  spiralBindingOnly: false,
  sortBy: "recommended",
};
