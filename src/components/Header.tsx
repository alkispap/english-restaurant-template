"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { siteConfig } from "@/config/site";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SavedListingsLink } from "@/components/SavedListingsLink";
import { AccountMenu } from "@/components/AccountMenu";
import { isDirectoryFeatureEnabled } from "@/lib/directory-features";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 font-bold text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-white">
            {siteConfig.logoInitials}
          </span>
          <span>{siteConfig.name}</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-muted md:flex">
          {siteConfig.navigation.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isDirectoryFeatureEnabled("shortlist") ? <SavedListingsLink /> : null}
          <AccountMenu />
          <ThemeToggle />
          <button
            className="focus-ring rounded-md bg-ink p-2 text-white md:hidden"
            type="button"
            aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>
      {isMenuOpen ? (
        <nav id="mobile-navigation" className="border-t border-line bg-white px-4 py-3 shadow-soft md:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            {siteConfig.navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-semibold text-muted hover:bg-orange-50 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}

