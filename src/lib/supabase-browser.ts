"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { authFeatureConfig } from "@/lib/account-sync";

let browserClient: SupabaseClient | null = null;

export async function getSupabaseBrowserClient() {
  const config = authFeatureConfig();
  if (!config.enabled) return null;

  if (!browserClient) {
    const { createClient } = await import("@supabase/supabase-js");
    browserClient = createClient(config.url, config.anonKey);
  }

  return browserClient;
}
