import { z } from "zod";

export const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const pincodeRegex = /^[1-9][0-9]{5}$/;

export const ShopRegistrationZodSchema = z.object({
  tradeName: z.string().min(3, "Shop Name must be at least 3 characters"),
  legalName: z.string().min(3, "Legal Business Name is required"),
  gstin: z.string().regex(gstinRegex, "Invalid 15-digit GSTIN Number (e.g. 27AAAAA0000A1Z5)"),
  panNumber: z.string().regex(panRegex, "Invalid 10-character PAN Number (e.g. ABCDE1234F)"),
  ownerName: z.string().min(3, "Owner Full Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid 10-digit mobile number is required"),
  address: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  pincode: z.string().regex(pincodeRegex, "Invalid 6-digit Pincode"),
  accountNumber: z.string().min(8, "Valid Bank Account Number is required"),
  ifscCode: z.string().regex(ifscRegex, "Invalid 11-character IFSC Code (e.g. HDFC0001234)"),
});
