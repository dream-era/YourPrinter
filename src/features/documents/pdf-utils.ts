/**
 * PDF Engine & Price Calculator Utilities for YourPrinter
 */

export interface PrintConfigOptions {
  pageCount: number;
  copies: number;
  paperSize: "A4" | "A3" | "A5" | "Letter" | "Legal";
  colorMode: "bw" | "color";
  duplex: boolean;
  basePricePerPage?: number;
}

/**
 * Validate if file is a valid PDF
 */
export function validatePDFFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: "No file provided." };
  }

  if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
    return { isValid: false, error: "Only PDF files (.pdf) are allowed." };
  }

  const MAX_SIZE_MB = 50;
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { isValid: false, error: `File size exceeds the ${MAX_SIZE_MB}MB limit.` };
  }

  return { isValid: true };
}

/**
 * Estimate page count for uploaded PDF file (Mock/Client parser)
 */
export async function estimatePDFPageCount(file: File): Promise<number> {
  const sizeKB = file.size / 1024;
  if (sizeKB < 100) return 2;
  if (sizeKB < 500) return 6;
  if (sizeKB < 2000) return 14;
  return Math.min(100, Math.ceil(sizeKB / 150));
}

/**
 * Calculate total print job cost based on parameters and shop rates
 */
export function calculatePrintCost(options: PrintConfigOptions): {
  subtotal: number;
  duplexDiscount: number;
  bulkDiscount: number;
  tax: number;
  total: number;
  pricePerPage: number;
} {
  const { pageCount, copies, paperSize, colorMode, duplex } = options;

  // Base per-page rates (INR)
  let ratePerPage = colorMode === "color" ? 10.0 : 2.0;

  // Paper size multiplier
  if (paperSize === "A3") ratePerPage *= 2.0;
  if (paperSize === "A5") ratePerPage *= 0.8;
  if (paperSize === "Legal") ratePerPage *= 1.25;

  const totalPages = pageCount * copies;
  const rawSubtotal = totalPages * ratePerPage;

  // Duplexing discount (10% paper savings)
  const duplexDiscount = duplex ? Math.round(rawSubtotal * 0.1 * 100) / 100 : 0;
  let runningTotal = rawSubtotal - duplexDiscount;

  // Bulk quantity discount (15% off if total pages > 50)
  const bulkDiscount = totalPages >= 50 ? Math.round(runningTotal * 0.15 * 100) / 100 : 0;
  runningTotal -= bulkDiscount;

  // 18% GST Tax
  const tax = Math.round(runningTotal * 0.18 * 100) / 100;
  const total = Math.round((runningTotal + tax) * 100) / 100;

  return {
    subtotal: Math.round(rawSubtotal * 100) / 100,
    duplexDiscount,
    bulkDiscount,
    tax,
    total,
    pricePerPage: ratePerPage,
  };
}
