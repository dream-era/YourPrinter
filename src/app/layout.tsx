import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "YourPrinter - Print made simple, anywhere.",
  description: "Upload your documents, customize print settings, pay online, and pick them up from trusted print shops near you.",
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} font-sans`}>
      <body className="antialiased bg-gray-50">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
