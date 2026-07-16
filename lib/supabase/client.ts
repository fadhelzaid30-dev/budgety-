"use client";

import { useSession } from "@clerk/nextjs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser Supabase client bound to the current Clerk session. Reads honor RLS
 * because the Clerk token is attached to every request. Prefer server-side data
 * access for mutations; use this for live client-side reads (e.g. chat, lists).
 */
export function useSupabase(): SupabaseClient {
  const { session } = useSession();
  return useMemo(
    () =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        async accessToken() {
          return (await session?.getToken()) ?? null;
        },
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    [session],
  );
}
