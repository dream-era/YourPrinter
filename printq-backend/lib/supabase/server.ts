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

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getServiceRoleClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for server-side Supabase access."
    );
  }

  _client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _client;
}
