import { SignupForm } from "@/components/auth/SignupForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | YourPrinter",
  description: "Create a YourPrinter account",
};

export default function SignupPage() {
  return <SignupForm />;
}
