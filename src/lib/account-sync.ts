import { normalizeShortlistSlugs } from "@/lib/shortlist";

export type SupabasePublicConfig = {
  url?: string;
  anonKey?: string;
};

export type AuthFeatureConfig =
  | {
      enabled: true;
      url: string;
      anonKey: string;
    }
  | {
      enabled: false;
      url?: string;
      anonKey?: string;
    };

export const LISTING_NOTE_MAX_LENGTH = 600;

export function hasSupabaseAuthConfig(config: SupabasePublicConfig) {
  return Boolean(config.url?.trim() && config.anonKey?.trim());
}

export function authFeatureConfig(env = process.env): AuthFeatureConfig {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (hasSupabaseAuthConfig({ url, anonKey })) {
    return { enabled: true, url: url as string, anonKey: anonKey as string };
  }

  return { enabled: false, url, anonKey };
}

export function mergeSavedListingSlugs(localSlugs: string[], accountSlugs: string[], limit: number) {
  return normalizeShortlistSlugs([...localSlugs, ...accountSlugs], limit);
}

export function sanitizeListingNote(value: string) {
  return value.trim().slice(0, LISTING_NOTE_MAX_LENGTH);
}
