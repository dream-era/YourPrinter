import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next"); // optional explicit destination
  
  console.log("[AUTH CALLBACK] Reached /auth/callback");
  console.log("[AUTH CALLBACK] URL:", request.url);
  console.log("[AUTH CALLBACK] Code exists:", !!code);

  if (!code) {
    console.log("[AUTH CALLBACK] Falling back to login with error: missing code");
    return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
  }

  try {
    const supabase = await createClient();
    
    // Read the role passed via cookie for Google OAuth flows
    const cookieStore = await cookies();
    const roleParam = cookieStore.get("auth_role")?.value;
    console.log("[AUTH CALLBACK] Read auth_role cookie:", roleParam);

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("[AUTH CALLBACK] exchangeCodeForSession error:", error.message);
      return NextResponse.redirect(`${origin}/auth/login?error=session_exchange_failed`);
    } 
    
    console.log("[AUTH CALLBACK] exchangeCodeForSession success, user exists:", !!data?.user);

    if (data?.user) {
      const user = data.user;

      // For Google OAuth new users: set role in metadata if not already set
      const existingRole = user.user_metadata?.role as string | undefined;
      console.log("[AUTH CALLBACK] Existing role in metadata:", existingRole);
      
      // Strict Login Intent Validation
      if (existingRole && roleParam && existingRole !== roleParam) {
        console.warn(`[AUTH CALLBACK] Role mismatch! User is '${existingRole}' but tried to login as '${roleParam}'`);
        // We sign them out because the session exchange succeeded, but they shouldn't be logged in with the wrong intent
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/auth/login?error=role_mismatch&type=${existingRole}`);
      }
      
      if (!existingRole && !roleParam) {
        console.warn("[AUTH CALLBACK] Missing login role intent for new user!");
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/auth/login?error=missing_login_role`);
      }

      const userRole = existingRole || roleParam;

      if (!existingRole && roleParam) {
        console.log("[AUTH CALLBACK] Updating user metadata with role:", roleParam);
        await supabase.auth.updateUser({ data: { role: roleParam } });
      }
      
      // Ensure profile exists (Google OAuth doesn't call /api/profile POST)
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .single();
        
      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        console.error("[AUTH CALLBACK] Profile check error:", profileCheckError);
        // We continue anyway, as it might just be missing
      }
        
      console.log("[AUTH CALLBACK] Profile exists:", !!existingProfile);
      
      // Validate database profile role against intent
      if (existingProfile && roleParam && existingProfile.role !== roleParam) {
        console.warn(`[AUTH CALLBACK] Database Role mismatch! User is '${existingProfile.role}' but tried to login as '${roleParam}'`);
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/auth/login?error=role_mismatch&type=${existingProfile.role}`);
      }
        
      if (!existingProfile) {
        console.log("[AUTH CALLBACK] Creating new profile for role:", userRole);
        try {
          // We use admin client because RLS might prevent unauthenticated insert or insert for self depending on setup
          const { getServiceRoleClient } = await import("@/lib/supabase/admin");
          const adminSupabase = getServiceRoleClient();
          const { error: insertError } = await adminSupabase.from("profiles").insert({
            id: user.id,
            role: userRole,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "User",
            avatar_url: user.user_metadata?.avatar_url || null,
          });
          
          if (insertError) {
             console.error("[AUTH CALLBACK] Failed to insert profile:", insertError);
             return NextResponse.redirect(`${origin}/auth/login?error=profile_creation_failed`);
          }
        } catch (adminError) {
          console.error("[AUTH CALLBACK] Admin client error (likely missing SUPABASE_SERVICE_ROLE_KEY):", adminError);
          return NextResponse.redirect(`${origin}/auth/login?error=profile_creation_failed`);
        }
      }

      // Determine where to redirect:
      let redirectPath: string;
      if (next && next.startsWith("/") && !next.startsWith("/auth")) {
        redirectPath = next;
      } else {
        redirectPath = userRole === "owner" ? "/shop/orders" : "/customer/shops";
      }

      console.log("[AUTH CALLBACK] Determined redirect path:", redirectPath);

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      let response;
      if (isLocalEnv) {
        response = NextResponse.redirect(`${origin}${redirectPath}`);
      } else if (forwardedHost) {
        // Fix for multiple vercel domains (e.g. preview vs production)
        // Ensure we preserve the domain the user is actually on
        response = NextResponse.redirect(`https://${forwardedHost}${redirectPath}`);
      } else {
        response = NextResponse.redirect(`${origin}${redirectPath}`);
      }

      // Clear the temporary auth_role cookie
      response.cookies.delete("auth_role");
      
      console.log("[AUTH CALLBACK] Redirecting to:", response.headers.get("Location"));
      return response;
    }
    
    // Fallback if data.user is missing but no error was thrown
    return NextResponse.redirect(`${origin}/auth/login?error=session_exchange_failed`);
    
  } catch (err) {
    console.error("[AUTH CALLBACK] Unhandled server error:", err);
    return NextResponse.redirect(`${origin}/auth/login?error=internal_server_error`);
  }
}
