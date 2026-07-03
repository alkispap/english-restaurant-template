"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { FilterCheckboxGroup } from "./FilterCheckboxGroup";
import { directoryConfig } from "@/config/directory";
import { buildListingsPageHref, type ListingsPageLinkValues } from "@/lib/listings-page";
import { isDirectoryFeatureEnabled } from "@/lib/directory-features";
import { directoryIndexPath } from "@/lib/routes";
import type { FilterOption, FilterPanelOptionGroup } from "@/lib/filter-panel-options";

type FilterPanelProps = {
  values: ListingsPageLinkValues & {
    q?: string;
    area?: string | string[];
    neighborhood?: string | string[];
    category?: string | string[];
    type?: string | string[];
    dietary?: string | string[];
    service?: string | string[];
    offering?: string | string[];
    highlight?: string | string[];
    popularFor?: string | string[];
    dining?: string | string[];
    amenity?: string | string[];
    accessibility?: string | string[];
    atmosphere?: string | string[];
    crowd?: string | string[];
    planning?: string | string[];
    payment?: string | string[];
    children?: string | string[];
    parking?: string | string[];
    pets?: string | string[];
    tube?: string | string[];
    bus?: string | string[];
    nearby?: string | string[];
    price?: string | string[];
    rating?: string;
    sort?: string;
  };
  action?: string;
  optionGroups: FilterPanelOptionGroup[];
  hiddenGroups?: string[];
};

export function FilterPanel({ values, action, optionGroups, hiddenGroups = [] }: FilterPanelProps) {
  const optionGroupsByName = new Map(optionGroups.map((group) => [group.name, group]));
  const labels = directoryConfig.filterLabels;
  const hiddenGroupSet = new Set(hiddenGroups);
  const selectedFilters = getSelectedFilters(values, optionGroups, hiddenGroups);
  const group = (name: SidebarFilterName) => (hiddenGroupSet.has(name) ? undefined : optionGroupsByName.get(name));

  return (
    <form action={action ?? values.basePath ?? directoryIndexPath()} className="space-y-5 rounded-lg border border-line bg-white p-5 shadow-soft">
      <SelectedFilterChips values={values} filters={selectedFilters} />
      <PersistentFilterFields values={values} />
      <FilterGroup group={group("area")} value={values.area} />
      <FilterGroup group={group("neighborhood")} value={values.neighborhood} />
      <FilterGroup group={group("category")} value={values.category} />
      <FilterGroup group={group("price")} value={values.price} />
      <Select
        label="Minimum rating"
        name="rating"
        value={values.rating}
        options={group("rating")?.options ?? []}
        placeholder="Any rating"
      />
      <FilterGroup group={group("dining")} value={values.dining} />
      {isDirectoryFeatureEnabled("dietaryPages") ? <FilterGroup group={group("dietary")} value={values.dietary} /> : null}
      {isDirectoryFeatureEnabled("servicePages") ? <FilterGroup group={group("service")} value={values.service} /> : null}
      <details className="rounded-md border border-line bg-slate-50 p-4" open={hasAdvancedValues(values)}>
        <summary className="cursor-pointer text-sm font-bold text-ink">{labels.advanced}</summary>
        <div className="mt-4 space-y-5">
          {isDirectoryFeatureEnabled("listingTypePages") ? <FilterGroup group={group("type")} value={values.type} /> : null}
          {isDirectoryFeatureEnabled("offeringPages") ? <FilterGroup group={group("offering")} value={values.offering} /> : null}
          <FilterGroup group={group("highlight")} value={values.highlight} />
          <FilterGroup group={group("popularFor")} value={values.popularFor} />
          <FilterGroup group={group("amenity")} value={values.amenity} />
          <FilterGroup group={group("accessibility")} value={values.accessibility} />
          <FilterGroup group={group("atmosphere")} value={values.atmosphere} />
          <FilterGroup group={group("crowd")} value={values.crowd} />
          <FilterGroup group={group("planning")} value={values.planning} />
          <FilterGroup group={group("payment")} value={values.payment} />
          <FilterGroup group={group("children")} value={values.children} />
          <FilterGroup group={group("parking")} value={values.parking} />
          <FilterGroup group={group("pets")} value={values.pets} />
        </div>
      </details>
      {isDirectoryFeatureEnabled("transport") ? (
      <details className="rounded-md border border-line bg-slate-50 p-4" open={hasTransportValues(values)}>
        <summary className="cursor-pointer text-sm font-bold text-ink">{labels.transport}</summary>
        <div className="mt-4 space-y-5">
          <FilterGroup group={group("tube")} value={values.tube} />
          <FilterGroup group={group("bus")} value={values.bus} />
          <FilterGroup group={group("nearby")} value={values.nearby} />
        </div>
      </details>
      ) : null}
    </form>
  );
}

export function getPersistentFilterFields(values: ListingsPageLinkValues) {
  return [
    values.q ? { name: "q", value: values.q } : undefined,
    values.sort ? { name: "sort", value: values.sort } : undefined,
    values.open ? { name: "open", value: "1" } : undefined,
    values.view === "map" ? { name: "view", value: "map" } : undefined
  ].filter((field): field is { name: string; value: string } => Boolean(field));
}

function PersistentFilterFields({ values }: { values: ListingsPageLinkValues }) {
  return (
    <>
      {getPersistentFilterFields(values).map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}
    </>
  );
}

type SidebarFilterName =
  | "area"
  | "neighborhood"
  | "category"
  | "type"
  | "dietary"
  | "service"
  | "offering"
  | "highlight"
  | "popularFor"
  | "dining"
  | "amenity"
  | "accessibility"
  | "atmosphere"
  | "crowd"
  | "planning"
  | "payment"
  | "children"
  | "parking"
  | "pets"
  | "tube"
  | "bus"
  | "nearby"
  | "price"
  | "rating";

export type SelectedFilter = {
  key: string;
  label: string;
  href: string;
};

type FilterChipSource = {
  name: SidebarFilterName;
  value?: string | string[];
  options: FilterOption[];
};

const sidebarFilterNames: SidebarFilterName[] = [
  "area",
  "neighborhood",
  "category",
  "type",
  "dietary",
  "service",
  "offering",
  "highlight",
  "popularFor",
  "dining",
  "amenity",
  "accessibility",
  "atmosphere",
  "crowd",
  "planning",
  "payment",
  "children",
  "parking",
  "pets",
  "tube",
  "bus",
  "nearby",
  "price",
  "rating"
];

export function SelectedFilterChips({
  values,
  filters,
  className = "border-b border-line pb-5"
}: {
  values: ListingsPageLinkValues;
  filters: SelectedFilter[];
  className?: string;
}) {
  if (!filters.length) return null;
  const activeCountLabel = `${filters.length.toLocaleString()} active`;

  return (
    <section className={className} aria-label="Selected filters">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-ink">Selected filters</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-muted">
          {activeCountLabel}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.key}
            href={filter.href}
            className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-emerald-900 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50"
            aria-label={`Remove ${filter.label} filter`}
          >
            <span>{filter.label}</span>
            <X className="h-4 w-4" aria-hidden />
          </Link>
        ))}
        <Link
          href={buildListingsPageHref(values, clearSidebarFilterOverrides())}
          className="focus-ring ml-1 rounded-sm text-sm font-bold text-emerald-950 underline decoration-emerald-900 underline-offset-4"
        >
          Clear all filters
        </Link>
      </div>
    </section>
  );
}

function buildSelectedFilters(values: ListingsPageLinkValues, sources: FilterChipSource[]): SelectedFilter[] {
  const stateFilters: SelectedFilter[] = [
    values.q
      ? {
          key: "search-query",
          label: `Search: ${values.q}`,
          href: buildListingsPageHref(values, { q: undefined, page: undefined })
        }
      : undefined,
    values.open
      ? {
          key: "open-now",
          label: "Open now",
          href: buildListingsPageHref(values, { open: undefined, page: undefined })
        }
      : undefined
  ].filter((filter): filter is SelectedFilter => Boolean(filter));

  const sidebarFilters = sources.flatMap((source) => {
    const optionLabels = new Map(source.options.map((option) => [option.value, option.label]));

    return normalizeValues(source.value).map((selectedValue) => ({
      key: `${source.name}-${selectedValue}`,
      label: optionLabels.get(selectedValue) ?? selectedValue,
      href: buildListingsPageHref(values, {
        [source.name]: removeFilterValue(source.value, selectedValue),
        page: undefined
      })
    }));
  });

  return [...stateFilters, ...sidebarFilters];
}

export function getSelectedFilters(
  values: ListingsPageLinkValues,
  optionGroups: FilterPanelOptionGroup[],
  hiddenGroups: string[] = []
) {
  const hiddenGroupSet = new Set(hiddenGroups);

  return buildSelectedFilters(
    values,
    optionGroups
      .filter((group) => !hiddenGroupSet.has(group.name))
      .map((group) => ({
        name: group.name as SidebarFilterName,
        value: filterValue(values, group.name),
        options: group.options
      }))
  );
}

function removeFilterValue(value: string | string[] | undefined, selectedValue: string) {
  const remainingValues = normalizeValues(value).filter((item) => item !== selectedValue);
  if (remainingValues.length === 0) return undefined;
  return remainingValues.length === 1 ? remainingValues[0] : remainingValues;
}

function clearSidebarFilterOverrides() {
  return {
    ...Object.fromEntries(sidebarFilterNames.map((name) => [name, undefined])),
    q: undefined,
    open: undefined,
    page: undefined
  };
}

function FilterGroup({ group, value }: { group?: FilterPanelOptionGroup; value?: string | string[] }) {
  if (!group) return null;

  return (
    <FilterCheckboxGroup
      label={group.label}
      modalLabel={group.modalLabel}
      name={group.name}
      value={value}
      options={group.options}
    />
  );
}

function Select({
  label,
  name,
  value,
  options,
  placeholder
}: {
  label: string;
  name: string;
  value?: string;
  options: { label: string; value: string }[];
  placeholder: string;
}) {
  if (!options.length) return null;

  function applySelectFilter(event: React.ChangeEvent<HTMLSelectElement>) {
    const scrollY = window.scrollY;
    const nextValue = event.target.value;
    const params = new URLSearchParams(window.location.search);

    params.delete(name);
    params.delete("page");
    if (nextValue) params.set(name, nextValue);

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.pushState({}, "", nextUrl);
    window.requestAnimationFrame(() => window.scrollTo({ top: scrollY }));
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-ink" htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={value ?? ""}
        onChange={(event) => applySelectFilter(event)}
        className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function normalizeValues(value?: string | string[]) {
  return Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
}

function filterValue(values: ListingsPageLinkValues, name: string) {
  return values[name as keyof ListingsPageLinkValues] as string | string[] | undefined;
}

function hasAdvancedValues(values: FilterPanelProps["values"]) {
  return Boolean(
    values.type ||
      values.offering ||
      values.highlight ||
      values.popularFor ||
      values.amenity ||
      values.accessibility ||
      values.atmosphere ||
      values.crowd ||
      values.planning ||
      values.payment ||
      values.children ||
      values.parking ||
      values.pets
  );
}

function hasTransportValues(values: FilterPanelProps["values"]) {
  return Boolean(values.tube || values.bus || values.nearby);
}
