import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, any> }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  let role: string | null = null;
  try {
    const response = await supabase.auth.getUser();
    user = response.data.user;
    
    if (user) {
      // Always fetch the true role from the profiles table as user_metadata can be out of sync
      // (e.g. if a student upgrades to an owner via /auth/register-shop)
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
        
      role = profile?.role || user.user_metadata?.role || "student";
    }
  } catch (e) {
    // Ignore network errors in middleware
  }

  const pathname = request.nextUrl.pathname;

  const isShopRoute = pathname.startsWith("/shop") || pathname.startsWith("/dashboard");
  const isCustomerRoute = pathname.startsWith("/customer");
  const isAdminRoute = pathname.startsWith("/admin");
  const isProtectedRoute = isShopRoute || isCustomerRoute || isAdminRoute;

  const createRedirect = (url: URL) => {
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value);
    });
    return response;
  };

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirectTo", pathname);
    return createRedirect(url);
  }

  // Role-based routing
  if (user && role) {
    // Student trying to access shop routes
    if (isShopRoute && role === "student") {
      const url = request.nextUrl.clone();
      url.pathname = "/customer/shops";
      return createRedirect(url);
    }
    
    // Owner trying to access student routes
    if (isCustomerRoute && role === "owner") {
      const url = request.nextUrl.clone();
      url.pathname = "/shop/orders";
      return createRedirect(url);
    }
  }

  // Redirect authenticated users away from auth pages (login/register)
  if (user && (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/register") || pathname.startsWith("/auth/signup"))) {
    const url = request.nextUrl.clone();
    url.pathname = role === "owner" ? "/shop/orders" : "/customer/shops";
    return createRedirect(url);
  }

  return supabaseResponse;
}
