"use client";

import React, { useCallback, useId, useRef, useState } from "react";
import { Share2, Facebook, Twitter, MessageCircle, Copy, Check, X } from "lucide-react";
import {
  inferDirectoryPageTypeFromPath,
  trackDirectoryEvent,
  type DirectoryPageType
} from "@/lib/directory-analytics";
import { useDismissiblePopover } from "@/lib/use-dismissible-popover";

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
  className?: string;
  pageType?: DirectoryPageType;
  route?: string;
  listingSlug?: string;
}

export function ShareButton({ title, text, url, className = "", pageType, route, listingSlug }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const dropdownId = useId();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeDropdown = useCallback(() => setIsOpen(false), []);

  useDismissiblePopover({
    open: isOpen,
    onClose: closeDropdown,
    popoverRef: dropdownRef,
    triggerRef
  });

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;
  const resolvedRoute = route ?? (typeof window === "undefined" ? undefined : window.location.pathname);
  const resolvedPageType = pageType ?? inferDirectoryPageTypeFromPath(resolvedRoute ?? "/");

  const handleShare = async () => {
    trackDirectoryEvent({
      pageType: resolvedPageType,
      action: "share_open",
      route: resolvedRoute,
      listingSlug,
      targetUrl: url
    });

    if (canNativeShare) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
        trackDirectoryEvent({
          pageType: resolvedPageType,
          action: "share_native",
          route: resolvedRoute,
          listingSlug,
          targetUrl: url
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.warn("Native sharing was unavailable; showing share options instead.", error);
          setIsOpen(true);
        }
      }
    } else {
      setIsOpen(true);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      trackDirectoryEvent({
        pageType: resolvedPageType,
        action: "share_copy",
        route: resolvedRoute,
        listingSlug,
        targetUrl: url
      });
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (err) {
      console.warn("The share link could not be copied.", err);
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 3000);
    }
  };

  const socialLinks = [
    {
      name: "Facebook",
      icon: <Facebook className="h-4 w-4" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: "hover:bg-blue-50 hover:text-blue-600",
    },
    {
      name: "Twitter",
      icon: <Twitter className="h-4 w-4" />,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      color: "hover:bg-sky-50 hover:text-sky-600",
    },
    {
      name: "WhatsApp",
      icon: <MessageCircle className="h-4 w-4" />,
      url: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
      color: "hover:bg-green-50 hover:text-green-600",
    },
  ];

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={handleShare}
        className={`focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-line bg-white px-4 py-3 text-sm font-bold text-ink transition hover:bg-slate-50 ${className}`}
        aria-label="Share restaurant"
        aria-expanded={isOpen}
        aria-controls={dropdownId}
      >
        <Share2 className="h-4 w-4" />
        <span>Share</span>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          id={dropdownId}
          aria-label="Share options"
          className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-lg border border-line bg-white p-2 shadow-xl ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="text-sm font-bold text-ink">Share this listing</span>
            <button
              onClick={closeDropdown}
              className="focus-ring rounded-full p-1 text-muted hover:bg-slate-100 hover:text-ink"
              aria-label="Close share options"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="mt-1 grid gap-1">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackDirectoryEvent({
                    pageType: resolvedPageType,
                    action: "share_social",
                    route: resolvedRoute,
                    listingSlug,
                    label: link.name,
                    targetUrl: link.url
                  })
                }
                className={`focus-ring flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors ${link.color}`}
              >
                {link.icon}
                {link.name}
              </a>
            ))}
            
            <button
              onClick={copyToClipboard}
              className="focus-ring flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-slate-100 hover:text-ink"
            >
              {copyStatus === "copied" ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-semibold">Link copied!</span>
                </>
              ) : copyStatus === "error" ? (
                <>
                  <X className="h-4 w-4 text-red-700" />
                  <span className="font-semibold text-red-700">Could not copy link</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy link</span>
                </>
              )}
            </button>
            <p
              role={copyStatus === "error" ? "alert" : "status"}
              aria-live={copyStatus === "error" ? "assertive" : "polite"}
              className="sr-only"
            >
              {copyStatus === "copied"
                ? "Link copied to clipboard."
                : copyStatus === "error"
                  ? "The link could not be copied. Copy it from your browser address bar instead."
                  : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
