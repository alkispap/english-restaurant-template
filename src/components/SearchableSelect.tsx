"use client";

import { useState, useRef, useEffect } from "react";

type Option = { label: string; value: string };

type SearchableSelectProps = {
  label: string;
  name: string;
  value?: string;
  options: Option[];
  placeholder: string;
};

export function SearchableSelect({
  label,
  name,
  value,
  options,
  placeholder
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Option | undefined>(
    options.find((o) => o.value === value)
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  // Update selection if prop value changes (e.g. on form reset)
  useEffect(() => {
    setSelected(options.find((o) => o.value === value));
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <label className="mb-2 block text-sm font-bold text-ink" htmlFor={name}>
        {label}
      </label>
      
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={selected?.value ?? ""} />

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="focus-ring flex w-full items-center justify-between rounded-md border border-line bg-white px-3 py-2 text-left text-sm"
      >
        <span className={selected ? "text-ink" : "text-muted"}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-line bg-white shadow-xl">
          <div className="p-2 border-b border-line">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-md border border-line px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ink"
            />
          </div>
          <ul className="max-h-60 overflow-auto py-1">
            <li
              onClick={() => {
                setSelected(undefined);
                setIsOpen(false);
                setSearch("");
              }}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-100"
            >
              {placeholder}
            </li>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  onClick={() => {
                    setSelected(option);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`cursor-pointer px-3 py-2 text-sm hover:bg-slate-100 ${
                    selected?.value === option.value ? "bg-slate-50 font-bold" : ""
                  }`}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-muted">No results found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
