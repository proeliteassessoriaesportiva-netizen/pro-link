import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Client sem estado de cookies/sessão — pra escritas anônimas (analytics)
// feitas dentro de after(), onde cookies()/headers() não podem ser
// chamados (lib/supabase/server.ts usa cookies() e quebraria ali).
export function createAnonClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
