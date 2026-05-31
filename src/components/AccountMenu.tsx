"use client";

import { LogIn, LogOut, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { directoryConfig } from "@/config/directory";

export function AccountMenu() {
  const { authEnabled, loading, user, signInWithProvider, signInWithEmail, signOut } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  if (!authEnabled) return null;

  async function submitEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    await signInWithEmail(email.trim());
    setMessage("Check your email for the sign-in link.");
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-bold text-ink hover:border-primary dark:bg-slate-800 dark:text-slate-100"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {user ? <UserRound className="h-4 w-4 text-primary" aria-hidden /> : <LogIn className="h-4 w-4 text-primary" aria-hidden />}
        <span className="hidden sm:inline">{user ? "Account" : "Sign in"}</span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-lg border border-line bg-white p-4 text-sm shadow-soft dark:bg-slate-900">
          {user ? (
            <div>
              <p className="font-bold text-ink">Signed in</p>
              <p className="mt-1 break-words text-muted">{user.email}</p>
              <button
                type="button"
                  className="focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-line px-3 py-2 font-bold text-ink hover:border-primary dark:text-slate-100"
                onClick={() => void signOut()}
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Sign out
              </button>
            </div>
          ) : (
            <div>
              <p className="font-bold text-ink">Sync saved {directoryConfig.listingPluralLabel.toLowerCase()}</p>
              <p className="mt-1 text-muted">Sign in to keep saved listings and private notes across devices.</p>
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  className="focus-ring rounded-md border border-line px-3 py-2 font-bold text-ink hover:border-primary dark:text-slate-100"
                  disabled={loading}
                  onClick={() => void signInWithProvider("google")}
                >
                  Continue with Google
                </button>
                <button
                  type="button"
                  className="focus-ring rounded-md border border-line px-3 py-2 font-bold text-ink hover:border-primary dark:text-slate-100"
                  disabled={loading}
                  onClick={() => void signInWithProvider("azure")}
                >
                  Continue with Microsoft
                </button>
              </div>
              <form className="mt-4 grid gap-2" onSubmit={submitEmail}>
                <label className="font-bold text-ink" htmlFor="account-email">
                  Email magic link
                </label>
                <div className="flex gap-2">
                  <input
                    id="account-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="min-w-0 flex-1 rounded-md border border-line px-3 py-2 text-ink outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="focus-ring inline-flex items-center justify-center rounded-md bg-ink px-3 py-2 text-white"
                    aria-label="Send magic link"
                    disabled={loading}
                  >
                    <Mail className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                {message ? <p className="text-xs font-semibold text-emerald-700">{message}</p> : null}
              </form>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
