import "server-only";
import { createClient as createSupabaseJsClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getServiceRoleClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.warn("Missing Supabase env variables. Using placeholders for build phase.");
      _client = createSupabaseJsClient("https://placeholder.supabase.co", "placeholder-key", {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      return _client;
    }
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for server-side Supabase access."
    );
  }

  _client = createSupabaseJsClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _client;
}
