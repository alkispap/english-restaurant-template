import { listings } from "../src/data/listings";
import { filterListings, getAreas, getCategories, getFacetLabels, getNeighborhoods, slugify, type FacetKey } from "../src/lib/directory";
import { getAreaCategoryCombinations, getPopularSearches } from "../src/lib/directory-growth";
import { isDirectoryFeatureEnabled } from "../src/lib/directory-features";
import { getIndexedListingFilterCount, getListingFilterCount } from "../src/lib/listing-filter-counts";
import { SEO_POLICY, isApprovedHighIntentFacet, isListingIndexable } from "../src/lib/seo-policy";

type AuditRow = {
  label: string;
  indexable: number;
  noindex: number;
};

const BASE_INDEXABLE_ROUTES = ["/", "/restaurants", "/areas", "/categories"];

export function buildSeoAuditReport() {
  const listingIndexable = listings.filter(isListingIndexable).length;
  const rows: AuditRow[] = [
    {
      label: "Listing detail pages",
      indexable: listingIndexable,
      noindex: listings.length - listingIndexable
    },
    countRows("Area hubs", getAreas(), (area) => getListingFilterCount("area", slugify(area)) >= SEO_POLICY.routeThresholds.area),
    countRows(
      "Neighborhood hubs",
      getNeighborhoods(),
      (neighborhood) => getListingFilterCount("neighborhood", slugify(neighborhood)) >= SEO_POLICY.routeThresholds.neighborhood
    ),
    countRows(
      "Category hubs",
      getCategories(),
      (category) => getListingFilterCount("category", slugify(category)) >= SEO_POLICY.routeThresholds.category
    ),
    countRows("Area+category hubs", getAreaCategoryCombinations(), (item) => item.count >= SEO_POLICY.routeThresholds.areaCategory),
    countRows(
      "Popular search hubs",
      getPopularSearches(),
      (search) => routeFilterCount(search.filters) >= SEO_POLICY.routeThresholds.best
    ),
    countFacetRows()
  ];
  const totalIndexable = rows.reduce((sum, row) => sum + row.indexable, BASE_INDEXABLE_ROUTES.length);
  const totalNoindex = rows.reduce((sum, row) => sum + row.noindex, 0);

  return [
    "SEO policy audit",
    `Last modified baseline: ${SEO_POLICY.directoryLastModified.toISOString()}`,
    `Indexable URLs: ${totalIndexable}`,
    `Noindex URLs: ${totalNoindex}`,
    "",
    ...rows.map((row) => `${row.label}: ${row.indexable} indexable / ${row.noindex} noindex`),
    `Noindex listing details: ${listings.length - listingIndexable}`
  ].join("\n");
}

function countRows<T>(label: string, items: T[], isIndexable: (item: T) => boolean): AuditRow {
  const indexable = items.filter(isIndexable).length;
  return {
    label,
    indexable,
    noindex: items.length - indexable
  };
}

function countFacetRows(): AuditRow {
  const facets: FacetKey[] = ["type", "dietary", "service", "offering"];
  const enabledFacets = facets.filter((facet) => {
    if (facet === "type") return isDirectoryFeatureEnabled("listingTypePages");
    if (facet === "dietary") return isDirectoryFeatureEnabled("dietaryPages");
    if (facet === "service") return isDirectoryFeatureEnabled("servicePages");
    return isDirectoryFeatureEnabled("offeringPages");
  });
  const values = enabledFacets.flatMap((facet) =>
    getFacetLabels(facet).map((label) => ({
      facet,
      slug: slugify(label)
    }))
  );

  return countRows(
    "High-intent facet hubs",
    values,
    (value) =>
      isApprovedHighIntentFacet(value.facet, value.slug) &&
      getListingFilterCount(value.facet, value.slug) >= SEO_POLICY.routeThresholds.facet
  );
}

function routeFilterCount(filters: Parameters<typeof getIndexedListingFilterCount>[0]) {
  const indexedCount = getIndexedListingFilterCount(filters);
  if (indexedCount !== undefined) return indexedCount;
  return filterListings(filters).length;
}

if (require.main === module) {
  console.log(buildSeoAuditReport());
}
