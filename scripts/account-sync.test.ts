import assert from "node:assert/strict";
import {
  authFeatureConfig,
  hasSupabaseAuthConfig,
  mergeSavedListingSlugs,
  sanitizeListingNote
} from "../src/lib/account-sync";

function supabaseAuthConfigRequiresBothPublicValues() {
  assert.equal(hasSupabaseAuthConfig({}), false);
  assert.equal(hasSupabaseAuthConfig({ url: "https://example.supabase.co" }), false);
  assert.equal(hasSupabaseAuthConfig({ anonKey: "anon" }), false);
  assert.equal(hasSupabaseAuthConfig({ url: "https://example.supabase.co", anonKey: "anon" }), true);
}

function authFeatureConfigReadsPublicEnvironmentSafely() {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  assert.equal(authFeatureConfig().enabled, false);

  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  assert.deepEqual(authFeatureConfig(), {
    enabled: true,
    url: "https://example.supabase.co",
    anonKey: "anon"
  });

  if (originalUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  }

  if (originalAnonKey === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
  }
}

function mergeSavedListingSlugsDedupesAndPreservesMostRecentLocalItems() {
  assert.deepEqual(mergeSavedListingSlugs(["local-a", "shared"], ["remote-a", "shared"], 4), [
    "local-a",
    "shared",
    "remote-a"
  ]);
  assert.deepEqual(mergeSavedListingSlugs(["a", "b", "c"], ["d", "e"], 4), ["a", "b", "c", "d"]);
}

function sanitizeListingNoteTrimsAndLimitsPrivateNotes() {
  assert.equal(sanitizeListingNote("  dinner plan  "), "dinner plan");
  assert.equal(sanitizeListingNote(""), "");
  assert.equal(sanitizeListingNote("x".repeat(650)).length, 600);
}

supabaseAuthConfigRequiresBothPublicValues();
authFeatureConfigReadsPublicEnvironmentSafely();
mergeSavedListingSlugsDedupesAndPreservesMostRecentLocalItems();
sanitizeListingNoteTrimsAndLimitsPrivateNotes();

console.log("account sync tests passed");
