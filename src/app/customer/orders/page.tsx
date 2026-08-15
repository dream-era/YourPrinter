import React from "react";
import OrdersListClient from "@/components/customer/OrdersListClient";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // If not authenticated, redirect or show error
    // (Assuming middleware might also catch this, but safe to check)
    throw new Error("You must be logged in to view your orders.");
  }

  let allOrders: any[] = [];
  const { data, error } = await supabase
    .from("orders")
    .select("*, shop:shops(*), document:documents(*)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Database connection failed:", error);
    throw new Error("Unable to load your orders.");
  }

  if (data) {
    allOrders = data.map(o => ({
      ...o,
      orderNumber: o.order_number,
      createdAt: o.created_at,
      totalPages: o.document?.page_count || 1,
      colorMode: o.print_options?.color || 'bw',
      copies: o.print_options?.copies || 1,
    }));
  }

  return <OrdersListClient initialOrders={allOrders} />;
}
