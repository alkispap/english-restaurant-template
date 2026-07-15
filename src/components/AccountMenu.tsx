"use client";

import { LogIn, LogOut, Mail, UserRound } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { directoryConfig } from "@/config/directory";
import { useDismissiblePopover } from "@/lib/use-dismissible-popover";

export function AccountMenu() {
  const { authEnabled, loading, user, signInWithProvider, signInWithEmail, signOut } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const busy = loading || actionPending;
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => setIsOpen(false), []);

  useDismissiblePopover({
    open: isOpen,
    onClose: closeMenu,
    popoverRef: menuRef,
    triggerRef: menuTriggerRef
  });

  if (!authEnabled) return null;

  async function submitEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setActionPending(true);
    setMessage("");
    try {
      await signInWithEmail(email.trim());
      setMessageIsError(false);
      setMessage("Check your email for the sign-in link.");
    } catch {
      setMessageIsError(true);
      setMessage("The sign-in link could not be sent. Please try again.");
    } finally {
      setActionPending(false);
    }
  }

  async function startProviderSignIn(provider: "google" | "azure") {
    setActionPending(true);
    setMessage("");
    try {
      await signInWithProvider(provider);
    } catch {
      setMessageIsError(true);
      setMessage("Sign-in could not be started. Please try again.");
    } finally {
      setActionPending(false);
    }
  }

  async function submitSignOut() {
    setActionPending(true);
    setMessage("");
    try {
      await signOut();
    } catch {
      setMessageIsError(true);
      setMessage("Sign-out failed. Please try again.");
    } finally {
      setActionPending(false);
    }
  }

  return (
    <div className="relative">
      <button
        ref={menuTriggerRef}
        type="button"
        className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-bold text-ink hover:border-primary"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
      >
        {user ? <UserRound className="h-4 w-4 text-primary" aria-hidden /> : <LogIn className="h-4 w-4 text-primary" aria-hidden />}
        <span className="hidden sm:inline">{user ? "Account" : "Sign in"}</span>
      </button>

      {isOpen ? (
        <div
          ref={menuRef}
          id={menuId}
          aria-label="Account options"
          className="absolute right-0 top-12 z-50 w-80 rounded-lg border border-line bg-white p-4 text-sm shadow-soft"
        >
          {user ? (
            <div>
              <p className="font-bold text-ink">Signed in</p>
              <p className="mt-1 break-words text-muted">{user.email}</p>
              <button
                type="button"
                  className="focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-line px-3 py-2 font-bold text-ink hover:border-primary"
                disabled={busy}
                onClick={() => void submitSignOut()}
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Sign out
              </button>
              <p
                role={messageIsError ? "alert" : "status"}
                aria-live={messageIsError ? "assertive" : "polite"}
                className={message ? `mt-3 text-xs font-semibold ${messageIsError ? "text-red-700" : "text-emerald-700"}` : "sr-only"}
              >
                {message}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-bold text-ink">Sync saved {directoryConfig.listingPluralLabel.toLowerCase()}</p>
              <p className="mt-1 text-muted">Sign in to keep saved listings and private notes across devices.</p>
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  className="focus-ring rounded-md border border-line px-3 py-2 font-bold text-ink hover:border-primary"
                  disabled={busy}
                  onClick={() => void startProviderSignIn("google")}
                >
                  Continue with Google
                </button>
                <button
                  type="button"
                  className="focus-ring rounded-md border border-line px-3 py-2 font-bold text-ink hover:border-primary"
                  disabled={busy}
                  onClick={() => void startProviderSignIn("azure")}
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
                    required
                    autoComplete="email"
                    aria-describedby="account-email-status"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="min-w-0 flex-1 rounded-md border border-line px-3 py-2 text-ink outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="focus-ring inline-flex items-center justify-center rounded-md bg-ink px-3 py-2 text-white"
                    aria-label="Send magic link"
                    disabled={busy}
                  >
                    <Mail className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <p
                  id="account-email-status"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  className={message ? `text-xs font-semibold ${messageIsError ? "text-red-700" : "text-emerald-700"}` : "sr-only"}
                >
                  {message}
                </p>
              </form>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
