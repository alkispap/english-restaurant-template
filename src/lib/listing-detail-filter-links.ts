import { directoryRouteLink } from "@/lib/directory-route-links";
import { directorySearchPath } from "@/lib/routes";
import { slugify } from "@/lib/slug";

export type DetailFilterName =
  | "service"
  | "highlight"
  | "popularFor"
  | "offering"
  | "dining"
  | "amenity"
  | "accessibility"
  | "atmosphere"
  | "crowd"
  | "planning"
  | "payment"
  | "children"
  | "parking"
  | "pets";

export function buildDetailFilterHref(filterName: DetailFilterName, value: string, area?: string) {
  const params = new URLSearchParams();
  const areaSlug = area ? slugify(area) : "";
  const valueSlug = slugify(value);

  if (filterName === "service" || filterName === "offering") {
    return directoryRouteLink(filterName, valueSlug, { area });
  }

  if (areaSlug) params.set("area", areaSlug);
  params.set(filterName, valueSlug);

  return directorySearchPath(`?${params.toString()}`);
}
