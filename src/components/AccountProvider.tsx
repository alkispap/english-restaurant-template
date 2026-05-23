"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import {
  authFeatureConfig,
  mergeSavedListingSlugs,
  sanitizeListingNote
} from "@/lib/account-sync";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  DEFAULT_SHORTLIST_LIMIT,
  SHORTLIST_STORAGE_KEY,
  normalizeShortlistSlugs,
  removeShortlistSlug,
  toggleShortlistSlug
} from "@/lib/shortlist";

type AccountContextValue = {
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

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const authEnabled = authFeatureConfig().enabled;
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(authEnabled);
  const [user, setUser] = useState<User | null>(null);
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [noteBySlug, setNoteBySlug] = useState<Record<string, string>>({});

  const fetchAccountSavedSlugs = useCallback(
    async (userId: string) => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("saved_listings")
        .select("listing_slug, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) return [];
      return normalizeShortlistSlugs((data ?? []).map((item) => item.listing_slug), DEFAULT_SHORTLIST_LIMIT);
    },
    [supabase]
  );

  const upsertAccountSavedSlugs = useCallback(
    async (userId: string, slugs: string[]) => {
      if (!supabase || !slugs.length) return;
      await supabase.from("saved_listings").upsert(
        slugs.map((slug) => ({ user_id: userId, listing_slug: slug })),
        { onConflict: "user_id,listing_slug" }
      );
    },
    [supabase]
  );

  const replaceAccountSavedSlugs = useCallback(
    async (userId: string, slugs: string[]) => {
      if (!supabase) return;
      const existing = await fetchAccountSavedSlugs(userId);
      const removed = existing.filter((slug) => !slugs.includes(slug));

      if (removed.length) {
        await supabase.from("saved_listings").delete().eq("user_id", userId).in("listing_slug", removed);
      }

      await upsertAccountSavedSlugs(userId, slugs);
    },
    [fetchAccountSavedSlugs, supabase, upsertAccountSavedSlugs]
  );

  const syncSavedSlugs = useCallback(
    async (userId: string) => {
      const localSlugs = readLocalSavedSlugs();
      const accountSlugs = await fetchAccountSavedSlugs(userId);
      const merged = mergeSavedListingSlugs(localSlugs, accountSlugs, DEFAULT_SHORTLIST_LIMIT);

      if (merged.length) {
        await upsertAccountSavedSlugs(userId, merged);
      }

      writeLocalSavedSlugs(merged);
      setSavedSlugs(merged);
      return merged;
    },
    [fetchAccountSavedSlugs, upsertAccountSavedSlugs]
  );

  const refreshSavedSlugs = useCallback(async () => {
    if (user) return syncSavedSlugs(user.id);
    const local = readLocalSavedSlugs();
    setSavedSlugs(local);
    return local;
  }, [syncSavedSlugs, user]);

  const persistSavedSlugs = useCallback(
    async (next: string[]) => {
      const normalized = normalizeShortlistSlugs(next, DEFAULT_SHORTLIST_LIMIT);
      writeLocalSavedSlugs(normalized);
      setSavedSlugs(normalized);

      if (user) {
        await replaceAccountSavedSlugs(user.id, normalized);
      }

      return normalized;
    },
    [replaceAccountSavedSlugs, user]
  );

  const toggleSavedSlug = useCallback(
    async (slug: string) => {
      const next = toggleShortlistSlug(savedSlugs.length ? savedSlugs : readLocalSavedSlugs(), slug, DEFAULT_SHORTLIST_LIMIT);
      return persistSavedSlugs(next);
    },
    [persistSavedSlugs, savedSlugs]
  );

  const removeSavedSlug = useCallback(
    async (slug: string) => {
      const next = removeShortlistSlug(savedSlugs.length ? savedSlugs : readLocalSavedSlugs(), slug);
      return persistSavedSlugs(next);
    },
    [persistSavedSlugs, savedSlugs]
  );

  const loadNotesForSlugs = useCallback(
    async (slugs: string[]) => {
      if (!supabase || !user || !slugs.length) return {};
      const normalized = normalizeShortlistSlugs(slugs, DEFAULT_SHORTLIST_LIMIT);
      const { data, error } = await supabase
        .from("listing_notes")
        .select("listing_slug, note")
        .eq("user_id", user.id)
        .in("listing_slug", normalized);

      if (error) return {};
      const notes = Object.fromEntries((data ?? []).map((item) => [item.listing_slug, item.note ?? ""]));
      setNoteBySlug((current) => ({ ...current, ...notes }));
      return notes;
    },
    [supabase, user]
  );

  const saveNote = useCallback(
    async (slug: string, note: string) => {
      const cleaned = sanitizeListingNote(note);
      if (!supabase || !user) return cleaned;

      if (!cleaned) {
        await supabase.from("listing_notes").delete().eq("user_id", user.id).eq("listing_slug", slug);
      } else {
        await supabase
          .from("listing_notes")
          .upsert(
            { user_id: user.id, listing_slug: slug, note: cleaned, updated_at: new Date().toISOString() },
            { onConflict: "user_id,listing_slug" }
          );
      }

      setNoteBySlug((current) => {
        const next = { ...current };
        if (cleaned) {
          next[slug] = cleaned;
        } else {
          delete next[slug];
        }
        return next;
      });
      return cleaned;
    },
    [supabase, user]
  );

  const signInWithProvider = useCallback(
    async (provider: "google" | "azure") => {
      if (!supabase) return;
      await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin }
      });
    },
    [supabase]
  );

  const signInWithEmail = useCallback(
    async (email: string) => {
      if (!supabase) return;
      await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin }
      });
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, [supabase]);

  useEffect(() => {
    setSavedSlugs(readLocalSavedSlugs());

    function handleStorageChange() {
      if (!user) setSavedSlugs(readLocalSavedSlugs());
    }

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return;
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        await syncSavedSlugs(sessionUser.id);
      } else {
        setSavedSlugs(readLocalSavedSlugs());
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        void syncSavedSlugs(sessionUser.id);
      } else {
        setSavedSlugs(readLocalSavedSlugs());
        setNoteBySlug({});
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase, syncSavedSlugs]);

  const value = useMemo<AccountContextValue>(
    () => ({
      authEnabled,
      loading,
      user,
      savedSlugs,
      noteBySlug,
      signInWithProvider,
      signInWithEmail,
      signOut,
      toggleSavedSlug,
      removeSavedSlug,
      refreshSavedSlugs,
      loadNotesForSlugs,
      saveNote
    }),
    [
      authEnabled,
      loadNotesForSlugs,
      loading,
      noteBySlug,
      refreshSavedSlugs,
      removeSavedSlug,
      saveNote,
      savedSlugs,
      signInWithEmail,
      signInWithProvider,
      signOut,
      toggleSavedSlug,
      user
    ]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used within AccountProvider");
  }
  return context;
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
  window.dispatchEvent(new Event("directory-shortlist-change"));
}
