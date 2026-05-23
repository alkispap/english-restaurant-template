"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark" | "system";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      applyTheme(stored);
    } else {
      applyTheme("system");
    }
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  }

  // Don't render during SSR to avoid hydration mismatch
  if (!mounted) {
    return <div className="h-9 w-9" />;
  }

  const isDark = theme === "dark" || (theme === "system" && prefersDark());

  return (
    <button
      type="button"
      onClick={toggle}
      className="focus-ring grid h-9 w-9 place-items-center rounded-md border border-line text-muted transition hover:text-ink dark:border-slate-600 dark:hover:text-white"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </button>
  );
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark" || (theme === "system" && prefersDark())) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function prefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
