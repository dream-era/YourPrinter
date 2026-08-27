import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next"); // optional explicit destination
  const roleParam = searchParams.get("role"); // passed from Google OAuth flow

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;

      // For Google OAuth new users: set role in metadata if not already set
      const existingRole = user.user_metadata?.role as string | undefined;
      if (!existingRole && roleParam) {
        await supabase.auth.updateUser({ data: { role: roleParam } });
      }

      const userRole = existingRole || roleParam || "student";
      
      // Ensure profile exists (Google OAuth doesn't call /api/profile POST)
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();
        
      if (!existingProfile) {
        // We use admin client because RLS might prevent unauthenticated insert or insert for self depending on setup
        const { getServiceRoleClient } = await import("@/lib/supabase/admin");
        const adminSupabase = getServiceRoleClient();
        await adminSupabase.from("profiles").insert({
          id: user.id,
          role: userRole,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "User",
          avatar_url: user.user_metadata?.avatar_url || null,
        });
      }

      // Determine where to redirect:
      // 1. Prefer explicit `next` param (from forgot-password flows, protected route bounces)
      // 2. Fall back to role-based default
      let redirectPath: string;
      if (next && next.startsWith("/") && !next.startsWith("/auth")) {
        redirectPath = next;
      } else {
        redirectPath = userRole === "owner" ? "/shop/orders" : "/customer/shops";
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectPath}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`);
      } else {
        return NextResponse.redirect(`${origin}${redirectPath}`);
      }
    }
  }

  // Auth code missing or exchange failed — send back to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
