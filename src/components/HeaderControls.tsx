"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { AccountMenu } from "@/components/AccountMenu";
import { HeaderSearch } from "@/components/HeaderSearch";
import { SavedListingsLink } from "@/components/SavedListingsLink";
import { useDismissiblePopover } from "@/lib/use-dismissible-popover";

type HeaderControlsProps = {
  navigation: ReadonlyArray<{
    href: string;
    label: string;
  }>;
  shortlistEnabled: boolean;
};

export function HeaderControls({ navigation, shortlistEnabled }: HeaderControlsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useDismissiblePopover({
    open: isMenuOpen,
    onClose: closeMenu,
    popoverRef: menuRef,
    triggerRef: menuTriggerRef,
    initialFocusSelector: 'input[type="search"]'
  });

  return (
    <div className="relative shrink-0">
      <div className="flex items-center gap-2">
        {shortlistEnabled ? <SavedListingsLink /> : null}
        <AccountMenu />
        <button
          ref={menuTriggerRef}
          className="focus-ring rounded-md bg-ink p-2 text-white lg:hidden"
          type="button"
          aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isMenuOpen}
          aria-controls={menuId}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </div>
      {isMenuOpen ? (
        <nav
          ref={menuRef}
          id={menuId}
          aria-label="Mobile navigation"
          className="absolute right-0 top-[calc(100%+0.75rem)] z-[90] w-[min(calc(100vw-2rem),20rem)] rounded-b-md border border-line bg-white px-4 py-3 shadow-soft lg:hidden"
        >
          <HeaderSearch className="mb-3" onSearch={closeMenu} />
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-semibold text-muted hover:bg-orange-50 hover:text-ink"
              onClick={closeMenu}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
