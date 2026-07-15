"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { authFeatureConfig, mergeSavedListingSlugs, sanitizeListingNote } from "@/lib/account-sync";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  DEFAULT_SHORTLIST_LIMIT,
  SHORTLIST_STORAGE_KEY,
  normalizeShortlistSlugs,
  removeShortlistSlug,
  toggleShortlistSlug
} from "@/lib/shortlist";

type AccountSnapshot = {
  authEnabled: boolean;
  loading: boolean;
  user: User | null;
  savedSlugs: string[];
  noteBySlug: Record<string, string>;
  signInWithProvider: (provider: "google" | "azure") => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  toggleSavedSlug: (slug: string) => Promise<string[]>;
  removeSavedSlug: (slug: string) => Promise<string[]>;
  refreshSavedSlugs: () => Promise<string[]>;
  loadNotesForSlugs: (slugs: string[]) => Promise<Record<string, string>>;
  saveNote: (slug: string, note: string) => Promise<string>;
};

type AccountState = Pick<AccountSnapshot, "authEnabled" | "loading" | "user" | "savedSlugs" | "noteBySlug">;

const authEnabled = authFeatureConfig().enabled;
const listeners = new Set<() => void>();

let initialized = false;
let state: AccountState = {
  authEnabled,
  loading: authEnabled,
  user: null,
  savedSlugs: [],
  noteBySlug: {}
};

const actions = {
  signInWithProvider,
  signInWithEmail,
  signOut,
  toggleSavedSlug,
  removeSavedSlug: removeSavedSlugAction,
  refreshSavedSlugs,
  loadNotesForSlugs,
  saveNote
};

let snapshot: AccountSnapshot = { ...state, ...actions };

export function AccountProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useAccount() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  initializeAccountStore();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

function setAccountState(next: Partial<AccountState>) {
  state = { ...state, ...next };
  snapshot = { ...state, ...actions };
  listeners.forEach((listener) => listener());
}

function initializeAccountStore() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  setAccountState({ savedSlugs: readLocalSavedSlugs() });

  window.addEventListener("storage", () => {
    if (!state.user) setAccountState({ savedSlugs: readLocalSavedSlugs() });
  });

  void initializeRemoteAccountStore();
}

async function initializeRemoteAccountStore() {
  let supabase: Awaited<ReturnType<typeof getSupabaseBrowserClient>>;
  try {
    supabase = await getSupabaseBrowserClient();
  } catch {
    setAccountState({ loading: false });
    return;
  }

  if (!supabase) {
    setAccountState({ loading: false });
    return;
  }

  void supabase.auth.getSession().then(async ({ data, error }) => {
    if (error) throw error;
    const sessionUser = data.session?.user ?? null;
    setAccountState({ user: sessionUser });
    if (sessionUser) {
      await syncSavedSlugs(sessionUser.id);
    } else {
      setAccountState({ savedSlugs: readLocalSavedSlugs() });
    }
    setAccountState({ loading: false });
  }).catch(() => setAccountState({ loading: false }));

  supabase.auth.onAuthStateChange((_event, session) => {
    const sessionUser = session?.user ?? null;
    setAccountState({ user: sessionUser });
    if (sessionUser) {
      void syncSavedSlugs(sessionUser.id).catch(() => undefined);
    } else {
      setAccountState({ savedSlugs: readLocalSavedSlugs(), noteBySlug: {} });
    }
    setAccountState({ loading: false });
  });
}

async function fetchAccountSavedSlugs(userId: string) {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("saved_listings")
    .select("listing_slug, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return normalizeShortlistSlugs((data ?? []).map((item) => item.listing_slug), DEFAULT_SHORTLIST_LIMIT);
}

async function upsertAccountSavedSlugs(userId: string, slugs: string[]) {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase || !slugs.length) return;
  const { error } = await supabase.from("saved_listings").upsert(
    slugs.map((slug) => ({ user_id: userId, listing_slug: slug })),
    { onConflict: "user_id,listing_slug" }
  );
  if (error) throw error;
}

async function replaceAccountSavedSlugs(userId: string, slugs: string[]) {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) return;
  const existing = await fetchAccountSavedSlugs(userId);
  const removed = existing.filter((slug) => !slugs.includes(slug));

  if (removed.length) {
    const { error } = await supabase.from("saved_listings").delete().eq("user_id", userId).in("listing_slug", removed);
    if (error) throw error;
  }

  await upsertAccountSavedSlugs(userId, slugs);
}

async function syncSavedSlugs(userId: string) {
  const localSlugs = readLocalSavedSlugs();
  const accountSlugs = await fetchAccountSavedSlugs(userId);
  const merged = mergeSavedListingSlugs(localSlugs, accountSlugs, DEFAULT_SHORTLIST_LIMIT);

  if (merged.length) {
    await upsertAccountSavedSlugs(userId, merged);
  }

  writeLocalSavedSlugs(merged);
  setAccountState({ savedSlugs: merged });
  return merged;
}

async function refreshSavedSlugs() {
  if (state.user) return syncSavedSlugs(state.user.id);
  const local = readLocalSavedSlugs();
  setAccountState({ savedSlugs: local });
  return local;
}

async function persistSavedSlugs(next: string[]) {
  const normalized = normalizeShortlistSlugs(next, DEFAULT_SHORTLIST_LIMIT);
  writeLocalSavedSlugs(normalized);
  setAccountState({ savedSlugs: normalized });

  if (state.user) {
    await replaceAccountSavedSlugs(state.user.id, normalized);
  }

  return normalized;
}

async function toggleSavedSlug(slug: string) {
  const source = state.savedSlugs.length ? state.savedSlugs : readLocalSavedSlugs();
  const next = toggleShortlistSlug(source, slug, DEFAULT_SHORTLIST_LIMIT);
  return persistSavedSlugs(next);
}

async function removeSavedSlugAction(slug: string) {
  const source = state.savedSlugs.length ? state.savedSlugs : readLocalSavedSlugs();
  const next = removeShortlistSlug(source, slug);
  return persistSavedSlugs(next);
}

async function loadNotesForSlugs(slugs: string[]) {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase || !state.user || !slugs.length) return {};
  const normalized = normalizeShortlistSlugs(slugs, DEFAULT_SHORTLIST_LIMIT);
  const { data, error } = await supabase
    .from("listing_notes")
    .select("listing_slug, note")
    .eq("user_id", state.user.id)
    .in("listing_slug", normalized);

  if (error) throw error;
  const notes = Object.fromEntries((data ?? []).map((item) => [item.listing_slug, item.note ?? ""]));
  setAccountState({ noteBySlug: { ...state.noteBySlug, ...notes } });
  return notes;
}

async function saveNote(slug: string, note: string) {
  const cleaned = sanitizeListingNote(note);
  const supabase = await getSupabaseBrowserClient();
  if (!supabase || !state.user) return cleaned;

  if (!cleaned) {
    const { error } = await supabase.from("listing_notes").delete().eq("user_id", state.user.id).eq("listing_slug", slug);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("listing_notes")
      .upsert(
        { user_id: state.user.id, listing_slug: slug, note: cleaned, updated_at: new Date().toISOString() },
        { onConflict: "user_id,listing_slug" }
      );
    if (error) throw error;
  }

  const noteBySlug = { ...state.noteBySlug };
  if (cleaned) {
    noteBySlug[slug] = cleaned;
  } else {
    delete noteBySlug[slug];
  }
  setAccountState({ noteBySlug });
  return cleaned;
}

async function signInWithProvider(provider: "google" | "azure") {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) throw new Error("Account service is unavailable.");
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin }
  });
  if (error) throw error;
}

async function signInWithEmail(email: string) {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) throw new Error("Account service is unavailable.");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
  });
  if (error) throw error;
}

async function signOut() {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) throw new Error("Account service is unavailable.");
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

function readLocalSavedSlugs() {
  try {
    const value = window.localStorage.getItem(SHORTLIST_STORAGE_KEY);
    return normalizeShortlistSlugs(value ? JSON.parse(value) : [], DEFAULT_SHORTLIST_LIMIT);
  } catch {
    return [];
  }
}

function writeLocalSavedSlugs(slugs: string[]) {
  window.localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(slugs));
}
