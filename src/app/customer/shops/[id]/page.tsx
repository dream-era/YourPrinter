import { Metadata } from "next";
import ShopDetailsClient from "@/components/customer/ShopDetailsClient";

export const metadata: Metadata = {
  title: "Shop Details | YourPrinter",
  description: "View print shop details, services, and queue status.",
};

export default async function ShopDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <ShopDetailsClient shopId={resolvedParams.id} />;
}
