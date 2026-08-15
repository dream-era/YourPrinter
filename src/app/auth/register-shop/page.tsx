import { Metadata } from "next";
import RegisterShopClient from "@/components/auth/RegisterShopClient";

export const metadata: Metadata = {
  title: "Register Your Shop | YourPrinter",
  description: "Join the YourPrinter network and start accepting print orders.",
};

export default function RegisterShopPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <RegisterShopClient />
    </div>
  );
}
