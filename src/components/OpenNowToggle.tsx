"use client";

import { Clock } from "lucide-react";

type OpenNowToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function OpenNowToggle({ checked, onChange }: OpenNowToggleProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 shadow-soft transition hover:border-primary">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-line text-primary accent-primary focus:ring-primary"
      />
      <Clock className="h-4 w-4 text-primary" aria-hidden />
      <span className="text-sm font-bold text-ink">Open now</span>
    </label>
  );
}
