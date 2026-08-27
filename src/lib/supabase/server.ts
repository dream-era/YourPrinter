/**
 * lib/supabase/server.ts
 *
 * Service-role Supabase client for privileged server-side operations
 * (decrypting/writing payment secrets, webhook writes, cross-tenant admin
 * reads). NEVER import this into client components or expose the service
 * role key to the browser.
 *
 * If your existing Phase 0 codebase already has this exact helper
 * (from ServeFlow's server-role client convention), skip this file and
 * just reuse that one — the routes below only need a function that returns
 * a supabase-js client authenticated with the service role key.
 */



import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: { name: string, value: string, options: any }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
