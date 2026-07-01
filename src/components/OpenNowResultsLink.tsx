"use client";

import Link from "next/link";
import { Clock } from "lucide-react";

type OpenNowResultsLinkProps = {
  href: string;
  active: boolean;
};

export function OpenNowResultsLink({ href, active }: OpenNowResultsLinkProps) {
  function applyWithoutJump(event: React.MouseEvent<HTMLAnchorElement>) {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();

    const scrollY = window.scrollY;
    window.history.pushState({}, "", href);
    window.requestAnimationFrame(() => window.scrollTo({ top: scrollY }));
  }

  return (
    <Link
      href={href}
      onClick={applyWithoutJump}
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-soft transition ${
        active
          ? "border-primary bg-orange-50 text-ink"
          : "border-line bg-white text-ink hover:border-primary"
      }`}
    >
      <Clock className="h-4 w-4 text-primary" aria-hidden />
      <span className="text-sm font-bold">Open now</span>
    </Link>
  );
}
