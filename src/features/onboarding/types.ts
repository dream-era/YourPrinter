/**
 * Types and Interfaces for Complete Shop Registration & Approval Workflow
 */

export interface ShopBusinessDetails {
  tradeName: string;
  legalName: string;
  gstin: string;
  panNumber: string;
}

export interface ShopOwnerDetails {
  ownerName: string;
  email: string;
  phone: string;
  altPhone?: string;
}

export interface ShopLocationDetails {
  address: string;
  area: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export interface ShopBankDetails {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
}

export interface ShopBusinessHours {
  openTime: string;
  closeTime: string;
  workingDays: string[];
}

export interface ShopCapabilitiesPayload {
  colorPrinting: boolean;
  bwPrinting: boolean;
  spiralBinding: boolean;
  lamination: boolean;
  photoPrinting: boolean;
  paperSizes: Array<"A4" | "A3" | "A5" | "Letter" | "Legal">;
}

export interface ShopKYCDocuments {
  gstCertificateUrl?: string;
  shopLicenseUrl?: string;
  cancelledChequeUrl?: string;
  storefrontPhotoUrl?: string;
  logoUrl?: string;
}

export interface CompleteShopRegistrationPayload {
  business: ShopBusinessDetails;
  owner: ShopOwnerDetails;
  location: ShopLocationDetails;
  bank: ShopBankDetails;
  hours: ShopBusinessHours;
  capabilities: ShopCapabilitiesPayload;
  documents: ShopKYCDocuments;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}
