"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { authFeatureConfig } from "@/lib/account-sync";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  const config = authFeatureConfig();
  if (!config.enabled) return null;

  if (!browserClient) {
    browserClient = createClient(config.url, config.anonKey);
  }

  return browserClient;
}
