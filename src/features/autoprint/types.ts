/**
 * Types and Interfaces for AutoPrint Infrastructure & Desktop Spooler Agent
 */

export type HardwarePrinterStatus = "online" | "offline" | "printing" | "error_no_paper" | "error_ink_low";

export interface DiscoveredPrinter {
  id: string;
  name: string;
  driver: string;
  connectionType: "USB" | "Network IP" | "CUPS";
  isDefault: boolean;
  isColorCapable: boolean;
  isDuplexCapable: boolean;
  paperTrays: Array<{ size: "A4" | "A3" | "A5"; levelPercent: number }>;
  tonerLevelPercent: number;
  status: HardwarePrinterStatus;
}

export interface AgentHeartbeatPayload {
  shopId: string;
  agentToken: string;
  agentVersion: string;
  status: "active" | "idle" | "error";
  selectedPrinterId: string;
  printerStatus: HardwarePrinterStatus;
  paperTrayLevelPercent: number;
  tonerLevelPercent: number;
  activeQueueLength: number;
  uptimeSeconds: number;
}

export interface CoverSheetData {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  pickupCode: string;
  fileName: string;
  pages: number;
  copies: number;
  paperSize: string;
  colorMode: string;
  duplex: boolean;
  qrPayload: string;
  timestamp: string;
}

export interface SpoolerJobLog {
  id: string;
  orderNumber: string;
  printerName: string;
  fileName: string;
  status: "printing_started" | "printing_completed" | "printing_failed" | "retrying";
  coverSheetPrinted: boolean;
  documentPrinted: boolean;
  errorMessage?: string;
  timestamp: string;
}
