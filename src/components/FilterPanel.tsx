import Link from "next/link";
import { X } from "lucide-react";
import { FilterCheckboxGroup } from "./FilterCheckboxGroup";
import { directoryConfig } from "@/config/directory";
import { buildListingsPageHref, type ListingsPageLinkValues } from "@/lib/listings-page";
import { isDirectoryFeatureEnabled } from "@/lib/directory-features";
import { directoryIndexPath } from "@/lib/routes";
import {
  getFilterPanelOptionGroups,
  type FilterOption,
  type FilterPanelOptionGroup
} from "@/lib/filter-panel-options";

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
};

export function FilterPanel({ values, action }: FilterPanelProps) {
  const optionGroups = getFilterPanelOptionGroups(values);
  const optionGroupsByName = new Map(optionGroups.map((group) => [group.name, group]));
  const labels = directoryConfig.filterLabels;
  const selectedFilters = buildSelectedFilters(
    values,
    optionGroups.map((group) => ({
      name: group.name as SidebarFilterName,
      value: filterValue(values, group.name),
      options: group.options
    }))
  );
  const group = (name: SidebarFilterName) => optionGroupsByName.get(name);

  return (
    <form action={action ?? values.basePath ?? directoryIndexPath()} className="space-y-5 rounded-lg border border-line bg-white p-5 shadow-soft">
      <SelectedFilterChips values={values} filters={selectedFilters} />
      <PersistentFilterFields values={values} />
      <FilterGroup group={group("area")} value={values.area} />
      <FilterGroup group={group("neighborhood")} value={values.neighborhood} />
      <FilterGroup group={group("category")} value={values.category} />
      {isDirectoryFeatureEnabled("listingTypePages") ? <FilterGroup group={group("type")} value={values.type} /> : null}
      {isDirectoryFeatureEnabled("dietaryPages") ? <FilterGroup group={group("dietary")} value={values.dietary} /> : null}
      {isDirectoryFeatureEnabled("servicePages") ? <FilterGroup group={group("service")} value={values.service} /> : null}
      {isDirectoryFeatureEnabled("offeringPages") ? <FilterGroup group={group("offering")} value={values.offering} /> : null}
      <FilterGroup group={group("highlight")} value={values.highlight} />
      <FilterGroup group={group("popularFor")} value={values.popularFor} />
      <FilterGroup group={group("dining")} value={values.dining} />
      <details className="rounded-md border border-line bg-slate-50 p-4" open={hasAdvancedValues(values)}>
        <summary className="cursor-pointer text-sm font-bold text-ink">{labels.advanced}</summary>
        <div className="mt-4 space-y-5">
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
      <FilterGroup group={group("price")} value={values.price} />
      <Select
        label="Minimum rating"
        name="rating"
        value={values.rating}
        options={group("rating")?.options ?? []}
        placeholder="Any rating"
      />
      <button className="focus-ring w-full rounded-md bg-ink px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">
        Apply filters
      </button>
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

type SelectedFilter = {
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

function SelectedFilterChips({
  values,
  filters
}: {
  values: ListingsPageLinkValues;
  filters: SelectedFilter[];
}) {
  if (!filters.length) return null;

  return (
    <section className="border-b border-line pb-5" aria-label="Selected filters">
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
  return sources.flatMap((source) => {
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
}

function removeFilterValue(value: string | string[] | undefined, selectedValue: string) {
  const remainingValues = normalizeValues(value).filter((item) => item !== selectedValue);
  if (remainingValues.length === 0) return undefined;
  return remainingValues.length === 1 ? remainingValues[0] : remainingValues;
}

function clearSidebarFilterOverrides() {
  return {
    ...Object.fromEntries(sidebarFilterNames.map((name) => [name, undefined])),
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

  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-ink" htmlFor={name}>
        {label}
      </label>
      <select id={name} name={name} defaultValue={value ?? ""} className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm">
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
    values.dining ||
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
