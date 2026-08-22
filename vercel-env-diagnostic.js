console.log("=== VERCEL ENV DIAGNOSTIC ===");
console.log("VERCEL_ENV:", process.env.VERCEL_ENV ? process.env.VERCEL_ENV : "MISSING");
console.log("NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL ? "PRESENT" : "MISSING");
console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "PRESENT" : "MISSING");
console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "PRESENT" : "MISSING");
console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "PRESENT" : "MISSING");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "PRESENT" : "MISSING");
console.log("B2_ENDPOINT:", process.env.B2_ENDPOINT ? "PRESENT" : "MISSING");
console.log("=============================");
