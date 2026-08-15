import { z } from "zod";

export type UserRole = "student" | "owner" | "staff";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address.").optional().or(z.literal("")),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters."),
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone number is required.",
  path: ["email"],
});

export const otpSchema = z.object({
  phone: z.string().min(10, "Please enter a valid phone number."),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10, "Please enter a valid phone number."),
  token: z.string().length(6, "OTP must be exactly 6 digits."),
});

// Student Signup
export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(8, "Please confirm your password."),
  role: z.enum(["student", "owner", "staff"]).default("student"),
  termsAccepted: z.boolean().refine((val) => val === true, "You must accept the terms."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

// Business Signup
export const businessRegisterSchema = z.object({
  businessName: z.string().min(2, "Business name is required."),
  ownerName: z.string().min(2, "Owner name is required."),
  email: z.string().email("Please enter a valid business email."),
  phone: z.string().min(10, "Please enter a valid contact number."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(8, "Please confirm your password."),
  city: z.string().min(2, "City is required."),
  role: z.literal("owner").default("owner"),
  termsAccepted: z.boolean().refine((val) => val === true, "You must accept the terms."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(8, "Please confirm your password."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type BusinessRegisterInput = z.infer<typeof businessRegisterSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
