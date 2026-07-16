import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase client for server components, route handlers, and server actions.
 * Forwards the Clerk session token so Postgres RLS sees the authenticated user
 * via `auth.jwt() ->> 'sub'`. All access is therefore constrained to the
 * current user's own rows — the client never trusts a caller-supplied business_id.
 */
export async function createServerSupabase() {
  const { getToken } = await auth();
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    async accessToken() {
      return (await getToken()) ?? null;
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
