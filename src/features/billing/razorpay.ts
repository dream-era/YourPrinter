import Razorpay from "razorpay";

export function getRazorpayClient(key_id: string, key_secret: string) {
  return new Razorpay({ key_id, key_secret });
}

export async function createPaymentOrder(client: Razorpay, amountInRupees: number, receiptId: string) {
  const options = {
    amount: Math.round(amountInRupees * 100), // amount in paise
    currency: "INR",
    receipt: receiptId,
    payment_capture: 1,
  };

  const order = await client.orders.create(options);
  return order;
}
