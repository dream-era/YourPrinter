import React from "react";
import ProfileClient from "@/components/customer/ProfileClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Profile | YourPrinter",
  description: "Manage your YourPrinter student profile",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const initialUser = profile || {
    fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || "User",
    email: user.email,
    phone: user.user_metadata?.phone || "",
    avatarUrl: user.user_metadata?.avatar_url || "",
  };

  return <ProfileClient initialUser={initialUser} />;
}
