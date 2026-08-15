import { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Check Your Email | YourPrinter",
  description: "Please verify your email address to continue",
};

interface PageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function CheckEmailPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const email = params.email ?? "";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] font-sans p-6">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-[#EFF6FF] rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-10 h-10 text-[#2563EB]" />
        </div>

        <h1 className="text-3xl font-black text-slate-900 mb-3">Check your email</h1>
        <p className="text-slate-500 font-medium mb-2">
          We&apos;ve sent a confirmation link to:
        </p>
        {email && (
          <p className="text-slate-900 font-bold text-lg mb-6 break-all">{email}</p>
        )}
        <p className="text-slate-500 font-medium mb-8">
          Click the link in your email to verify your account and start using YourPrinter.
        </p>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-8 text-left">
          <p className="text-sm text-blue-700 font-medium">
            <strong>Didn&apos;t receive the email?</strong> Check your spam folder, or wait a few minutes and try again.
          </p>
        </div>

        <Link
          href="/auth/login"
          className="inline-block w-full py-4 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold rounded-2xl shadow-lg transition-all hover:scale-[1.02] text-center"
        >
          Back to Login
        </Link>

        <p className="mt-6 text-sm text-slate-400">
          Wrong email?{" "}
          <Link href="/auth/signup" className="text-[#2563EB] font-bold hover:underline">
            Sign up again
          </Link>
        </p>
      </div>
    </div>
  );
}
