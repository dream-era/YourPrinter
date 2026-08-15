import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") ?? "student"; // student | owner
  const redirectTo = searchParams.get("redirectTo") ?? "";

  const supabase = await createClient();

  const callbackUrl = new URL(
    "/auth/callback",
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  );
  // encode role & optional redirectTo in the `next` param so callback can use it
  const next = redirectTo || (role === "owner" ? "/shop/orders" : "/customer/shops");
  callbackUrl.searchParams.set("next", next);
  callbackUrl.searchParams.set("role", role);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(error?.message ?? "OAuth failed")}`,
        request.url
      )
    );
  }

  return NextResponse.redirect(data.url);
}
