"use client";

import React, { useState, useEffect, useRef } from "react";
import { Share2, Facebook, Twitter, MessageCircle, Copy, Check, X } from "lucide-react";

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
  className?: string;
}

export function ShareButton({ title, text, url, className = "" }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleShare = async () => {
    if (canNativeShare) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleShare}
        className={`focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-line bg-white px-4 py-3 text-sm font-bold text-ink transition hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 ${className}`}
        aria-label="Share restaurant"
      >
        <Share2 className="h-4 w-4" />
        <span>Share</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-lg border border-line bg-white p-2 shadow-xl ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in duration-200 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="text-sm font-bold text-ink">Share this listing</span>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-muted hover:bg-slate-100 hover:text-ink"
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
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors dark:hover:bg-slate-800 ${link.color}`}
              >
                {link.icon}
                {link.name}
              </a>
            ))}
            
            <button
              onClick={copyToClipboard}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-slate-100 hover:text-ink dark:hover:bg-slate-800 dark:hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-semibold">Link copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy link</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
