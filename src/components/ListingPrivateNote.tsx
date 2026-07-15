"use client";

import { Lock, Save } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { LISTING_NOTE_MAX_LENGTH } from "@/lib/account-sync";
import { useAccount } from "@/components/AccountProvider";

export function ListingPrivateNote({ slug }: { slug: string }) {
  const { authEnabled, user, noteBySlug, loadNotesForSlugs, saveNote } = useAccount();
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("");
  const [statusIsError, setStatusIsError] = useState(false);
  const [saving, setSaving] = useState(false);
  const noteId = useId();
  const countId = `${noteId}-count`;

  useEffect(() => {
    if (!user) return;
    void loadNotesForSlugs([slug]).catch(() => {
      setStatusIsError(true);
      setStatus("Private notes could not be loaded.");
    });
  }, [user, slug, loadNotesForSlugs]);

  useEffect(() => {
    setValue(noteBySlug[slug] ?? "");
  }, [noteBySlug, slug]);

  if (!authEnabled) return null;

  if (!user) {
    return (
      <section className="mt-6 rounded-lg border border-line bg-orange-50 p-5">
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
    setSaving(true);
    try {
      const saved = await saveNote(slug, value);
      setValue(saved);
      setStatusIsError(false);
      setStatus(saved ? "Note saved." : "Note cleared.");
    } catch {
      setStatusIsError(true);
      setStatus("Note could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-line bg-white p-5">
      <h2 className="font-bold text-ink">Private notes</h2>
      <form className="mt-3 grid gap-3" onSubmit={submitNote}>
        <label htmlFor={noteId} className="sr-only">
          Private note
        </label>
        <textarea
          id={noteId}
          aria-describedby={countId}
          value={value}
          onChange={(event) => {
            setValue(event.target.value.slice(0, LISTING_NOTE_MAX_LENGTH));
            setStatus("");
            setStatusIsError(false);
          }}
          className="min-h-28 rounded-md border border-line px-3 py-2 text-sm leading-6 text-ink outline-none focus:border-primary"
          placeholder="Add your own reminder for this restaurant."
          maxLength={LISTING_NOTE_MAX_LENGTH}
        />
        <div className="flex items-center justify-between gap-3">
          <span id={countId} className="text-xs text-muted">
            {value.length}/{LISTING_NOTE_MAX_LENGTH}
          </span>
          <button type="submit" disabled={saving} aria-busy={saving} className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">
            <Save className="h-4 w-4" aria-hidden />
            {saving ? "Saving note..." : "Save note"}
          </button>
        </div>
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={status ? `text-xs font-semibold ${statusIsError ? "text-red-700" : "text-emerald-700"}` : "sr-only"}
        >
          {status}
        </p>
      </form>
    </section>
  );
}
