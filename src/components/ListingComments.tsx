"use client";

import { MessageSquare, Send, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type ListingComment = {
  id: string;
  message: string;
  createdAt: string;
};

const LISTING_COMMENT_MAX_LENGTH = 400;

function commentsStorageKey(slug: string) {
  return `listing-comments:${slug}`;
}

export function ListingComments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<ListingComment[]>([]);
  const [value, setValue] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(commentsStorageKey(slug));
      if (!raw) return;
      const parsed = JSON.parse(raw) as ListingComment[];
      if (!Array.isArray(parsed)) return;
      setComments(parsed.filter((item) => item?.id && item?.message && item?.createdAt));
    } catch {
      setComments([]);
    }
  }, [slug]);

  useEffect(() => {
    window.localStorage.setItem(commentsStorageKey(slug), JSON.stringify(comments));
  }, [slug, comments]);

  const hasReachedLimit = comments.length >= 50;
  const sortedComments = useMemo(
    () => [...comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [comments]
  );

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = value.trim();
    if (!message || hasReachedLimit) return;

    const nextComment: ListingComment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message: message.slice(0, LISTING_COMMENT_MAX_LENGTH),
      createdAt: new Date().toISOString()
    };

    setComments((current) => [...current, nextComment]);
    setValue("");
  }

  function removeComment(id: string) {
    setComments((current) => current.filter((comment) => comment.id !== id));
  }

  return (
    <section id="comments" className="mt-10 scroll-mt-20 rounded-lg border border-line bg-white p-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" aria-hidden />
        <h2 className="text-2xl font-bold text-ink">Comments</h2>
      </div>
      <p className="mt-2 text-sm text-muted">Share your thoughts about this listing. Comments are saved in this browser only.</p>

      <form onSubmit={submitComment} className="mt-4 grid gap-3">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value.slice(0, LISTING_COMMENT_MAX_LENGTH))}
          className="min-h-28 rounded-md border border-line px-3 py-2 text-sm leading-6 text-ink outline-none focus:border-primary"
          placeholder="Write a comment about this restaurant..."
          maxLength={LISTING_COMMENT_MAX_LENGTH}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted">{value.length}/{LISTING_COMMENT_MAX_LENGTH}</span>
          <button
            type="submit"
            disabled={!value.trim() || hasReachedLimit}
            className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" aria-hidden />
            Post comment
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {sortedComments.length ? (
          sortedComments.map((comment) => (
            <article key={comment.id} className="rounded-md border border-line bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <time className="text-xs font-semibold text-muted" dateTime={comment.createdAt}>
                  {new Date(comment.createdAt).toLocaleString()}
                </time>
                <button
                  type="button"
                  onClick={() => removeComment(comment.id)}
                  className="focus-ring inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-muted hover:bg-white hover:text-accent"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Remove
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink">{comment.message}</p>
            </article>
          ))
        ) : (
          <p className="text-sm text-muted">No comments yet. Be the first to post one.</p>
        )}
      </div>
    </section>
  );
}
