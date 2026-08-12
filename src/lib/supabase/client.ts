"use client";

import { createBrowserClient } from "@supabase/ssr";
import { hasSupabaseEnv, supabaseAnonKey, supabaseUrl } from "./env";

export function createBrowserSupabaseClient() {
  if (!hasSupabaseEnv) return null;
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
