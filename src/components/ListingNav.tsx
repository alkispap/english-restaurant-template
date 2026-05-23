"use client";

import { useEffect, useState } from "react";
import type { ListingNavTab } from "@/lib/listing-detail-nav";

export function ListingNav({ name, tabs }: { name: string; tabs: ListingNavTab[] }) {
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const threshold = 120; // Distance from top to trigger tab change
      let currentTab = tabs[0].href;

      for (const tab of tabs) {
        const element = document.getElementById(tab.href.substring(1));
        if (element) {
          const rect = element.getBoundingClientRect();
          // If the section top is above our threshold, it might be the active one.
          // Since we iterate in order, the last one that satisfies this is the most specific.
          if (rect.top <= threshold) {
            currentTab = tab.href;
          }
        }
      }
      
      setActiveTab(currentTab);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check after a short delay to ensure elements are rendered
    const timeout = setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeout);
    };
  }, [tabs]);

  return (
    <div className="sticky top-0 z-50 border-b border-line bg-white/90 shadow-sm backdrop-blur-md dark:bg-slate-950/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-8">
          <div className="hidden truncate text-lg font-bold text-ink sm:block">{name}</div>
          <nav className="flex h-full gap-6 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <a
                key={tab.href}
                href={tab.href}
                className={`inline-flex items-center border-b-2 px-1 text-sm font-bold transition-all ${
                  activeTab === tab.href
                    ? "border-emerald-600 text-ink dark:text-white"
                    : "border-transparent text-muted hover:border-emerald-200 hover:text-ink dark:hover:text-white"
                }`}
              >
                {tab.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
