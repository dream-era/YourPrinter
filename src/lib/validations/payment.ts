import { z } from "zod";

export const connectRazorpaySchema = z.object({
  merchantName: z.string().min(2).max(120),
  keyId: z
    .string()
    .regex(/^rzp_(live|test)_[A-Za-z0-9]+$/, "Doesn't look like a valid Razorpay Key ID"),
  keySecret: z.string().min(10, "Key secret looks too short"),
  webhookSecret: z.string().min(10, "Webhook secret looks too short"),
});

export type ConnectRazorpayInput = z.infer<typeof connectRazorpaySchema>;

export const createOrderSchema = z.object({
  shopId: z.string().uuid(),
  documentId: z.string().uuid(),
  printOptions: z.object({
    color: z.enum(["color", "bw"]),
    sides: z.enum(["single", "double"]),
    copies: z.number().int().min(1).max(500),
    pageRangeStart: z.number().int().min(1).optional(),
    pageRangeEnd: z.number().int().min(1).optional(),
    paperSize: z.enum(["A4", "A3", "letter"]).default("A4"),
    binding: z.enum(["none", "staple", "spiral", "hardbound"]).default("none"),
    lamination: z.boolean().default(false),
    urgent: z.boolean().default(false),
    specialInstructions: z.string().max(500).optional(),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const verifyPaymentSchema = z.object({
  orderId: z.string().uuid(), // our internal order id
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
