"use client";

import { DirectoryListingsView } from "@/components/DirectoryListingsView";
import type { DirectoryListingsModel } from "@/lib/directory-listings-types";

type DirectoryListingsInteractiveShellProps = {
  initialModel: DirectoryListingsModel;
};

export function DirectoryListingsInteractiveShell({ initialModel }: DirectoryListingsInteractiveShellProps) {
  return <DirectoryListingsView model={initialModel} viewId="directory-listings-client-main" />;
}
