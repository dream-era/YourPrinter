import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const role = searchParams.get("role") ?? "student"; // student | owner
  const redirectTo = searchParams.get("redirectTo") ?? "";

  const supabase = await createClient();

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const baseOrigin = isLocalEnv ? origin : (forwardedHost ? `https://${forwardedHost}` : origin);

  const callbackUrl = new URL("/auth/callback", baseOrigin);
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
