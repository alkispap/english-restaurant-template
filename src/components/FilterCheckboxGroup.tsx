"use client";

import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

type FilterOption = {
  label: string;
  value: string;
};

type FilterCheckboxGroupProps = {
  label: string;
  modalLabel?: string;
  name: string;
  value?: string | string[];
  options: FilterOption[];
};

export function FilterCheckboxGroup({ label, modalLabel, name, value, options }: FilterCheckboxGroupProps) {
  const id = useId();
  const [expanded, setExpanded] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedValues, setSelectedValues] = useState(() => normalizeValues(value));
  const [draftValues, setDraftValues] = useState(() => normalizeValues(value));

  useEffect(() => {
    const nextValues = normalizeValues(value);
    setSelectedValues(nextValues);
    setDraftValues(nextValues);
  }, [value]);

  if (!options.length) return null;

  const title = modalLabel ?? label;
  const selectedSet = new Set(selectedValues);
  const draftSet = new Set(draftValues);
  const selectedOptions = options.filter((option) => selectedSet.has(option.value));
  const unselectedOptions = options.filter((option) => !selectedSet.has(option.value));
  const visibleOptions = [
    ...selectedOptions,
    ...unselectedOptions.slice(0, Math.max(0, 4 - selectedOptions.length))
  ];
  const hasMore = options.length > 4;
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase())
  );
  const modalContent = modalOpen ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-4 py-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-modal-title`}
        className="flex max-h-[88vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6 sm:px-10 sm:pt-8">
          <h2 id={`${id}-modal-title`} className="text-2xl font-bold text-emerald-950 sm:text-3xl">
            {title}
          </h2>
          <button
            type="button"
            className="focus-ring rounded-sm p-1 text-emerald-950 hover:bg-slate-100"
            aria-label={`Close ${title} filters`}
            onClick={() => setModalOpen(false)}
          >
            <X aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 pb-4 sm:px-10">
          <label className="flex items-center gap-3 rounded-sm border border-emerald-900 px-4 py-3 focus-within:ring-2 focus-within:ring-primary">
            <span className="sr-only">Search {title}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="w-full border-0 bg-transparent text-sm text-ink outline-none"
            />
            <Search aria-hidden="true" className="h-4 w-4 text-emerald-950" />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border-b border-line px-6 pb-6 sm:px-10">
          <div className="grid gap-x-12 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOptions.map((option) => (
              <CheckboxOption
                key={option.value}
                option={option}
                checked={draftSet.has(option.value)}
                onChange={() => toggleDraftValue(option.value)}
              />
            ))}
          </div>
          {filteredOptions.length === 0 ? (
            <p className="py-10 text-sm text-muted">No choices match this search.</p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-4 px-6 py-6 sm:px-10">
          <button
            type="button"
            className="focus-ring rounded-sm text-sm font-bold text-emerald-950 underline underline-offset-4"
            onClick={resetDraftGroup}
          >
            Reset
          </button>
          <button
            type="button"
            className="focus-ring rounded-full bg-emerald-950 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-900"
            onClick={() => applyFilterValues(draftValues)}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  ) : null;

  function toggleValue(optionValue: string) {
    const nextValues = selectedValues.includes(optionValue)
      ? selectedValues.filter((item) => item !== optionValue)
      : [...selectedValues, optionValue];

    setSelectedValues(nextValues);
    applyFilterValues(nextValues);
  }

  function toggleDraftValue(optionValue: string) {
    setDraftValues((currentValues) =>
      currentValues.includes(optionValue)
        ? currentValues.filter((item) => item !== optionValue)
        : [...currentValues, optionValue]
    );
  }

  function openModal() {
    setDraftValues(selectedValues);
    setModalOpen(true);
  }

  function resetDraftGroup() {
    setDraftValues([]);
  }

  function applyFilterValues(nextValues: string[]) {
    const params = new URLSearchParams(window.location.search);
    params.delete(name);
    params.delete("page");
    nextValues.forEach((nextValue) => {
      if (nextValue) params.append(name, nextValue);
    });

    const query = params.toString();
    window.location.assign(query ? `${window.location.pathname}?${query}` : window.location.pathname);
  }

  return (
    <fieldset className="space-y-3">
      <legend className="w-full">
        <button
          type="button"
          className="focus-ring flex w-full items-center gap-2 rounded-sm text-left text-sm font-bold text-ink"
          aria-controls={`${id}-options`}
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          <span>{label}</span>
          {expanded ? (
            <ChevronUp aria-hidden="true" className="h-4 w-4 text-emerald-900" />
          ) : (
            <ChevronDown aria-hidden="true" className="h-4 w-4 text-emerald-900" />
          )}
        </button>
      </legend>

      {selectedValues.map((selectedValue) => (
        <input key={selectedValue} type="hidden" name={name} value={selectedValue} />
      ))}

      {expanded ? (
        <div id={`${id}-options`} className="space-y-3">
          {visibleOptions.map((option) => (
            <CheckboxOption
              key={option.value}
              option={option}
              checked={selectedSet.has(option.value)}
              onChange={() => toggleValue(option.value)}
            />
          ))}
        </div>
      ) : null}

      {hasMore ? (
        <button
          type="button"
          className="focus-ring inline-flex items-center gap-1 rounded-sm text-sm font-bold text-emerald-900 underline decoration-emerald-900 underline-offset-4"
          onClick={openModal}
        >
          <span>Show more</span>
          <ChevronDown aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : null}

      {modalContent ? createPortal(modalContent, document.body) : null}
    </fieldset>
  );
}

function CheckboxOption({
  option,
  checked,
  onChange
}: {
  option: FilterOption;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-3 text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="focus-ring h-4 w-4 rounded-sm border-line accent-emerald-900"
      />
      <span>{option.label}</span>
    </label>
  );
}

function normalizeValues(value?: string | string[]) {
  return Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
}
