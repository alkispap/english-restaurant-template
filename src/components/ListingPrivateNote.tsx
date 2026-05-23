"use client";

import { Lock, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { LISTING_NOTE_MAX_LENGTH } from "@/lib/account-sync";
import { useAccount } from "@/components/AccountProvider";

export function ListingPrivateNote({ slug }: { slug: string }) {
  const { authEnabled, user, noteBySlug, loadNotesForSlugs, saveNote } = useAccount();
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!user) return;
    void loadNotesForSlugs([slug]);
  }, [user, slug, loadNotesForSlugs]);

  useEffect(() => {
    setValue(noteBySlug[slug] ?? "");
  }, [noteBySlug, slug]);

  if (!authEnabled) return null;

  if (!user) {
    return (
      <section className="mt-6 rounded-lg border border-line bg-orange-50 p-5 dark:bg-orange-950/20">
        <div className="flex items-start gap-3">
          <Lock className="mt-1 h-5 w-5 text-accent" aria-hidden />
          <div>
            <h2 className="font-bold text-ink">Private notes</h2>
            <p className="mt-1 text-sm leading-6 text-muted">Sign in to save personal notes for this listing across devices.</p>
          </div>
        </div>
      </section>
    );
  }

  async function submitNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await saveNote(slug, value);
    setValue(saved);
    setStatus(saved ? "Note saved." : "Note cleared.");
  }

  return (
    <section className="mt-6 rounded-lg border border-line bg-white p-5 dark:bg-slate-900">
      <h2 className="font-bold text-ink">Private notes</h2>
      <form className="mt-3 grid gap-3" onSubmit={submitNote}>
        <textarea
          value={value}
          onChange={(event) => {
            setValue(event.target.value.slice(0, LISTING_NOTE_MAX_LENGTH));
            setStatus("");
          }}
          className="min-h-28 rounded-md border border-line px-3 py-2 text-sm leading-6 text-ink outline-none focus:border-primary"
          placeholder="Add your own reminder for this restaurant."
          maxLength={LISTING_NOTE_MAX_LENGTH}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted">
            {value.length}/{LISTING_NOTE_MAX_LENGTH}
          </span>
          <button type="submit" className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">
            <Save className="h-4 w-4" aria-hidden />
            Save note
          </button>
        </div>
        {status ? <p className="text-xs font-semibold text-emerald-700">{status}</p> : null}
      </form>
    </section>
  );
}
