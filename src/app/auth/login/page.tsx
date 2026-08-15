import { LoginForm } from "@/components/auth/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | YourPrinter",
  description: "Login to your YourPrinter account",
};

export default function LoginPage() {
  return <LoginForm />;
}
