import { z } from "zod";

export const createOrderSchema = z.object({
  shopId: z.string().min(1, "Please select a valid print shop."),
  documentId: z.string().min(1, "Invalid document selection."),
  pageCount: z.number().min(1, "Page count must be at least 1."),
  copies: z.number().min(1, "Copies must be at least 1.").default(1),
  paperSize: z.enum(["A4", "A3", "A5", "Letter", "Legal"]).default("A4"),
  colorMode: z.enum(["bw", "color"]).default("bw"),
  duplex: z.boolean().default(true),
  notes: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid("Invalid order ID."),
  status: z.enum([
    "pending",
    "accepted",
    "processing",
    "ready_for_pickup",
    "completed",
    "cancelled",
  ]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
