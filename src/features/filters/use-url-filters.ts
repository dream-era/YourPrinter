"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AdvancedFilterState, DEFAULT_ADVANCED_FILTERS, SortDimension } from "./types";

/**
 * Custom React hook synchronizing filter state with Next.js 15 URL searchParams
 */
export function useURLFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Read initial filter values from URL query string
  const filtersFromURL: AdvancedFilterState = React.useMemo(() => {
    return {
      openNowOnly: searchParams.get("open") === "true",
      colorOnly: searchParams.get("color") === "true",
      bwOnly: searchParams.get("bw") === "true",
      photoPrintingOnly: searchParams.get("photo") === "true",
      laminationOnly: searchParams.get("lamination") === "true",
      spiralBindingOnly: searchParams.get("spiral") === "true",
      sortBy: (searchParams.get("sort") as SortDimension) || "recommended",
    };
  }, [searchParams]);

  const [filters, setFilters] = React.useState<AdvancedFilterState>(filtersFromURL);

  // Sync filter changes back to URL
  const updateFilters = (newFilters: Partial<AdvancedFilterState>) => {
    const nextState = { ...filters, ...newFilters };
    setFilters(nextState);

    const params = new URLSearchParams();
    if (nextState.openNowOnly) params.set("open", "true");
    if (nextState.colorOnly) params.set("color", "true");
    if (nextState.bwOnly) params.set("bw", "true");
    if (nextState.photoPrintingOnly) params.set("photo", "true");
    if (nextState.laminationOnly) params.set("lamination", "true");
    if (nextState.spiralBindingOnly) params.set("spiral", "true");
    if (nextState.sortBy !== "recommended") params.set("sort", nextState.sortBy);

    const queryStr = params.toString();
    const newPath = queryStr ? `${pathname}?${queryStr}` : pathname;
    router.push(newPath, { scroll: false });
  };

  const resetFilters = () => {
    setFilters(DEFAULT_ADVANCED_FILTERS);
    router.push(pathname, { scroll: false });
  };

  return {
    filters,
    updateFilters,
    resetFilters,
  };
}
