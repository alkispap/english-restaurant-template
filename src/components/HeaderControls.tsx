"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { AccountMenu } from "@/components/AccountMenu";
import { SavedListingsLink } from "@/components/SavedListingsLink";

type HeaderControlsProps = {
  navigation: ReadonlyArray<{
    href: string;
    label: string;
  }>;
  shortlistEnabled: boolean;
};

export function HeaderControls({ navigation, shortlistEnabled }: HeaderControlsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <div className="flex items-center gap-2">
        {shortlistEnabled ? <SavedListingsLink /> : null}
        <AccountMenu />
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
      {isMenuOpen ? (
        <nav
          id="mobile-navigation"
          className="absolute right-0 top-[calc(100%+0.75rem)] z-[90] w-[min(calc(100vw-2rem),14rem)] rounded-b-md border border-line bg-white px-4 py-3 shadow-soft md:hidden"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-semibold text-muted hover:bg-orange-50 hover:text-ink"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
