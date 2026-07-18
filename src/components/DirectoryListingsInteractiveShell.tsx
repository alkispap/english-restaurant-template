"use client";

import { useLayoutEffect, useState } from "react";
import { DirectoryListingsView } from "@/components/DirectoryListingsView";
import type { DirectoryListingsModel } from "@/lib/directory-listings-types";

if (typeof window !== "undefined") performance.mark("directory-interactive-shell-module-evaluated");

type DirectoryListingsInteractiveShellProps = {
  initialModel: DirectoryListingsModel;
};

export function DirectoryListingsInteractiveShell({ initialModel }: DirectoryListingsInteractiveShellProps) {
  const [secondaryModel, setSecondaryModel] = useState<DirectoryListingsModel | null>(null);
  if (typeof window !== "undefined") performance.mark("directory-interactive-shell-rendered");
  useLayoutEffect(() => {
    let secondaryTimer: number | null = null;
    const modelReady = performance.getEntriesByName("directory-model-ready", "mark").at(-1);
    const committedAt = performance.now();
    if (modelReady) {
      performance.mark("directory-primary-results-committed");
      performance.measure("directory-react-commit", { start: modelReady.startTime, end: committedAt });
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        performance.mark("directory-primary-results-painted");
        if (modelReady) {
          performance.measure("directory-result-paint", { start: committedAt, end: performance.now() });
        }
        secondaryTimer = window.setTimeout(() => setSecondaryModel(initialModel), 0);
      });
    });

    return () => {
      if (secondaryTimer !== null) window.clearTimeout(secondaryTimer);
    };
  }, [initialModel]);

  return (
    <DirectoryListingsView
      model={initialModel}
      viewId="directory-listings-client-main"
      includeSecondaryContent={secondaryModel === initialModel}
    />
  );
}
