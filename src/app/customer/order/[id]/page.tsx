import OrderTrackingClient from "@/components/customer/OrderTrackingClient";

export const metadata = {
  title: "Order Status | YourPrinter",
  description: "Track your print order live.",
};

export default async function OrderTrackingPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  const { id } = params;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <OrderTrackingClient orderId={id} />
    </div>
  );
}
