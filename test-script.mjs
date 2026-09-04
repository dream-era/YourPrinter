import Razorpay from "razorpay";
try {
  const testClient = new Razorpay({ key_id: "rzp_test_SyQK3TAGMnbdQC", key_secret: "123456789012" });
  await testClient.orders.create({
    amount: 100,
    currency: "INR",
    receipt: "printq_verify_123_1234567890",
    notes: { purpose: "printq_credential_verification" },
  });
  console.log("Success");
} catch (err) {
  console.error("Razorpay Error:", err);
}
