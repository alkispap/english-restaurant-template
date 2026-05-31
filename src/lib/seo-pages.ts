import type { Metadata } from "next";
import { directoryConfig } from "@/config/directory";
import { siteConfig } from "@/config/site";
import { listings, type Listing } from "@/data/listings";
import { getAreaGuideModel, type AreaGuideModel } from "@/lib/area-guide";
import {
  filterListings,
  getAreas,
  getCategories,
  getFacetLabels,
  getFeaturedAreas,
  getFeaturedCategoryCards,
  getNeighborhoods,
  slugify,
  type FacetKey,
  type ListingFilters,
  type SortKey
} from "@/lib/directory";
import {
  getAreaCategoryCombination,
  getAreaCategoryCombinations,
  getAreaCategoryCombinationsForArea,
  getAreaCategoryCombinationsForCategory,
  getPopularSearchBySlug,
  getPopularSearches
} from "@/lib/directory-growth";
import { isDirectoryFeatureEnabled } from "@/lib/directory-features";
import { isOpenNow } from "@/lib/opening-hours";
import {
  LISTINGS_PAGE_SIZE,
  mapPointsFromListings,
  paginateListings,
  type ListingsPageLinkValues,
  type ListingsViewMode,
  type MapPoint
} from "@/lib/listings-page";
import {
  SEO_POLICY,
  getNoindexFollowRobots,
  isApprovedHighIntentFacet,
  shouldNoindexSearchParams
} from "@/lib/seo-policy";
import {
  areaCategoryPath,
  areaPath,
  categoryPath,
  dietaryPath,
  directoryIndexPath,
  neighborhoodPath,
  offeringPath,
  servicePath,
  typePath
} from "@/lib/routes";
import { seoLandingHeadings } from "@/lib/seo-landing-headings";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/structured-data";

export type SeoPageSearchParams = Record<string, string | string[] | undefined>;

export type SeoSummaryStat = {
  label: string;
  value: string;
};

export type SeoRelatedLink = {
  label: string;
  href: string;
  count?: number;
};

export type SeoRelatedLinkGroup = {
  title: string;
  links: SeoRelatedLink[];
};

export type SeoFaq = {
  question: string;
  answer: string;
};

export type SeoInformationGainBlock = {
  title: string;
  body: string;
  items: string[];
};

export type SeoPageModel = {
  kind: "area" | "neighborhood" | "category" | "areaCategory" | "best" | "facet";
  metadata: {
    title: string;
    description: string;
    canonical: string;
    robots?: Metadata["robots"];
  };
  isIndexable: boolean;
  breadcrumbItems: { name: string; href: string }[];
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    checkedLabel: string;
  };
  guide: {
    title: string;
    body: string;
  };
  areaGuide?: AreaGuideModel;
  informationGainBlocks: SeoInformationGainBlock[];
  faqs: SeoFaq[];
  summaryStats: SeoSummaryStat[];
  relatedLinkGroups: SeoRelatedLinkGroup[];
  listings: Listing[];
  mapPoints: MapPoint[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  viewMode: ListingsViewMode;
  openOnly: boolean;
  linkValues: ListingsPageLinkValues;
  filterPanelValues: ListingsPageLinkValues;
  structuredData: Record<string, unknown>[];
};

type BasePageInput = {
  kind: SeoPageModel["kind"];
  eyebrow: string;
  title: string;
  description: string;
  introSubject: string;
  introCategory?: string;
  guideTitle: string;
  guideBody: string;
  canonical: string;
  minIndexableResults: number;
  baseFilters: ListingFilters;
  searchParams: SeoPageSearchParams;
  breadcrumbs: { name: string; href: string }[];
  relatedLinkGroups: SeoRelatedLinkGroup[];
  faqs: SeoFaq[];
  defaultSort?: SortKey;
  forceNoindex?: boolean;
  areaGuide?: AreaGuideModel;
};

type SeoLandingHeadingSet = ReturnType<typeof seoLandingHeadings.area>;

export function getAreaSeoPage(areaSlug: string, searchParams: SeoPageSearchParams) {
  const label = getAreas().find((item) => slugify(item) === areaSlug);
  if (!label) return undefined;

  const canonical = areaPath(areaSlug);
  const headings = seoLandingHeadings.area(label);
  const title = headings.heroTitle;
  const description = `${introCount("area", label)} in ${label}, ${siteConfig.cityOrRegion}. Compare ratings, prices, service options, and opening details before choosing where to eat.`;
  const categoryLinks = getAreaCategoryCombinationsForArea(areaSlug, 8).map((item) => ({
    label: `${item.categoryLabel} in ${item.areaLabel}`,
    href: item.href,
    count: item.count
  }));

  return buildSeoPage({
    kind: "area",
    eyebrow: headings.eyebrow,
    title,
    description,
    introSubject: label,
    guideTitle: headings.guideTitle,
    guideBody: headings.guideBody,
    areaGuide: getAreaGuideModel(areaSlug),
    canonical,
    minIndexableResults: SEO_POLICY.routeThresholds.area,
    baseFilters: { area: areaSlug, sort: directoryConfig.defaultSort },
    searchParams,
    breadcrumbs: [
      { name: directoryConfig.listingPluralLabel, href: directoryIndexPath() },
      { name: label, href: canonical }
    ],
    relatedLinkGroups: [
      { title: headings.related.areaCategoryLinksTitle, links: categoryLinks },
      { title: headings.related.areaLinksTitle, links: areaLinks(areaSlug) },
      { title: headings.related.usefulSearchesTitle, links: usefulSearchLinks() }
    ],
    faqs: areaFaqs(headings)
  });
}

export function getNeighborhoodSeoPage(neighborhoodSlug: string, searchParams: SeoPageSearchParams) {
  const label = getNeighborhoods().find((item) => slugify(item) === neighborhoodSlug);
  if (!label) return undefined;

  const canonical = neighborhoodPath(neighborhoodSlug);
  const headings = seoLandingHeadings.neighborhood(label);
  const title = headings.heroTitle;
  const description = `${introCount("neighborhood", label)} in ${label}, ${siteConfig.cityOrRegion}. Compare local restaurants by rating, cuisine, price, and service options.`;
  const matchingAreas = topValues(
    listings
      .filter((listing) => listing.neighborhood && slugify(listing.neighborhood) === neighborhoodSlug)
      .map((listing) => listing.area)
      .filter(isString)
  );

  return buildSeoPage({
    kind: "neighborhood",
    eyebrow: headings.eyebrow,
    title,
    description,
    introSubject: label,
    guideTitle: headings.guideTitle,
    guideBody: headings.guideBody,
    canonical,
    minIndexableResults: SEO_POLICY.routeThresholds.neighborhood,
    baseFilters: { neighborhood: neighborhoodSlug, sort: directoryConfig.defaultSort },
    searchParams,
    breadcrumbs: [
      { name: directoryConfig.listingPluralLabel, href: directoryIndexPath() },
      { name: label, href: canonical }
    ],
    relatedLinkGroups: [
      {
        title: headings.related.areaLinksTitle,
        links: matchingAreas.map((area) => ({ label: area.label, href: areaPath(slugify(area.label)), count: area.count }))
      },
      { title: headings.related.categoryLinksTitle, links: categoryLinks() },
      { title: headings.related.usefulSearchesTitle, links: usefulSearchLinks() }
    ],
    faqs: localFaqs(headings)
  });
}

export function getCategorySeoPage(categorySlug: string, searchParams: SeoPageSearchParams) {
  const label = getCategories().find((item) => slugify(item) === categorySlug);
  if (!label) return undefined;

  const canonical = categoryPath(categorySlug);
  const headings = seoLandingHeadings.category(label);
  const title = headings.heroTitle;
  const description = `${introCount("category", label)} for ${label.toLowerCase()} ${directoryConfig.listingPluralLabel.toLowerCase()} in ${siteConfig.cityOrRegion}. Compare ratings, reviews, areas, and practical restaurant details.`;

  return buildSeoPage({
    kind: "category",
    eyebrow: headings.eyebrow,
    title,
    description,
    introSubject: label,
    introCategory: label,
    guideTitle: headings.guideTitle,
    guideBody: headings.guideBody,
    canonical,
    minIndexableResults: SEO_POLICY.routeThresholds.category,
    baseFilters: { category: categorySlug, sort: "rating" },
    searchParams,
    breadcrumbs: [
      { name: directoryConfig.categoryPluralLabel, href: "/categories" },
      { name: label, href: canonical }
    ],
    relatedLinkGroups: [
      {
        title: headings.related.areaCategoryLinksTitle,
        links: getAreaCategoryCombinationsForCategory(categorySlug, 8).map((item) => ({
          label: item.areaLabel,
          href: item.href,
          count: item.count
        }))
      },
      { title: headings.related.categoryLinksTitle, links: categoryLinks(categorySlug) },
      { title: headings.related.usefulSearchesTitle, links: usefulSearchLinks() }
    ],
    faqs: categoryFaqs(label, headings)
  });
}

export function getAreaCategorySeoPage(
  areaSlug: string,
  categorySlug: string,
  searchParams: SeoPageSearchParams
) {
  const combination = getAreaCategoryCombination(areaSlug, categorySlug);
  if (!combination) return undefined;

  const canonical = areaCategoryPath(areaSlug, categorySlug);
  const headings = seoLandingHeadings.areaCategory(combination.areaLabel, combination.categoryLabel);
  const title = headings.heroTitle;
  const description = `${introCount("areaCategory", combination.categoryLabel, combination.areaLabel)} for ${combination.categoryLabel.toLowerCase()} ${directoryConfig.listingPluralLabel.toLowerCase()} in ${combination.areaLabel}. Compare ratings, prices, opening details, and service options.`;

  return buildSeoPage({
    kind: "areaCategory",
    eyebrow: headings.eyebrow,
    title,
    description,
    introSubject: combination.areaLabel,
    introCategory: combination.categoryLabel,
    guideTitle: headings.guideTitle,
    guideBody: headings.guideBody,
    canonical,
    minIndexableResults: SEO_POLICY.routeThresholds.areaCategory,
    baseFilters: { area: areaSlug, category: categorySlug, sort: "rating" },
    searchParams,
    breadcrumbs: [
      { name: directoryConfig.listingPluralLabel, href: directoryIndexPath() },
      { name: combination.areaLabel, href: areaPath(areaSlug) },
      { name: combination.categoryLabel, href: categoryPath(categorySlug) }
    ],
    relatedLinkGroups: [
      {
        title: headings.related.categoryLinksTitle,
        links: getAreaCategoryCombinationsForArea(areaSlug, 8)
          .filter((item) => item.categorySlug !== categorySlug)
          .map((item) => ({ label: item.categoryLabel, href: item.href, count: item.count }))
      },
      {
        title: headings.related.areaLinksTitle,
        links: getAreaCategoryCombinationsForCategory(categorySlug, 8)
          .filter((item) => item.areaSlug !== areaSlug)
          .map((item) => ({ label: item.areaLabel, href: item.href, count: item.count }))
      },
      { title: headings.related.usefulSearchesTitle, links: usefulSearchLinks() }
    ],
    faqs: areaCategoryFaqs(headings)
  });
}

export function getPopularSearchSeoPage(slug: string, searchParams: SeoPageSearchParams) {
  const search = getPopularSearchBySlug(slug);
  if (!search) return undefined;
  const headings = seoLandingHeadings.best(search.title);

  return buildSeoPage({
    kind: "best",
    eyebrow: headings.eyebrow,
    title: headings.heroTitle,
    description: `${search.description} Compare matching ${directoryConfig.listingPluralLabel.toLowerCase()} by rating, review volume, price, and location.`,
    introSubject: search.title,
    guideTitle: headings.guideTitle,
    guideBody: headings.guideBody,
    canonical: search.href,
    minIndexableResults: SEO_POLICY.routeThresholds.best,
    baseFilters: { ...search.filters, sort: search.sort ?? directoryConfig.defaultSort },
    searchParams,
    defaultSort: search.sort,
    breadcrumbs: [
      { name: directoryConfig.listingPluralLabel, href: directoryIndexPath() },
      { name: search.title, href: search.href }
    ],
    relatedLinkGroups: [
      { title: headings.related.areaLinksTitle, links: areaLinks() },
      { title: headings.related.categoryLinksTitle, links: categoryLinks() },
      {
        title: headings.related.areaCategoryLinksTitle,
        links: getAreaCategoryCombinations()
          .slice(0, 8)
          .map((item) => ({ label: `${item.categoryLabel} in ${item.areaLabel}`, href: item.href, count: item.count }))
      }
    ],
    faqs: bestFaqs(headings)
  });
}

export function getFacetSeoPage(facet: FacetKey, valueSlug: string, searchParams: SeoPageSearchParams) {
  if (!facetEnabled(facet)) return undefined;
  const label = getFacetLabels(facet).find((item) => slugify(item) === valueSlug);
  if (!label) return undefined;

  const canonical = facetPath(facet, valueSlug);
  const headings = seoLandingHeadings.facet(label);
  const title = headings.heroTitle;
  const description = `${introCount("facet", label)} with ${label.toLowerCase()} in ${siteConfig.cityOrRegion}. Compare matching restaurants by area, rating, price, and practical details.`;

  return buildSeoPage({
    kind: "facet",
    eyebrow: headings.eyebrow,
    title,
    description,
    introSubject: `${label} ${directoryConfig.listingPluralLabel.toLowerCase()} in ${siteConfig.cityOrRegion}`,
    guideTitle: headings.guideTitle,
    guideBody: headings.guideBody,
    canonical,
    minIndexableResults: SEO_POLICY.routeThresholds.facet,
    forceNoindex: !isApprovedHighIntentFacet(facet, valueSlug),
    baseFilters: { [facet]: valueSlug, sort: "rating" },
    searchParams,
    breadcrumbs: [
      { name: directoryConfig.listingPluralLabel, href: directoryIndexPath() },
      { name: label, href: canonical }
    ],
    relatedLinkGroups: [
      { title: headings.related.areaLinksTitle, links: areaLinks() },
      { title: headings.related.categoryLinksTitle, links: categoryLinks() },
      { title: headings.related.usefulSearchesTitle, links: usefulSearchLinks() }
    ],
    faqs: facetFaqs(headings)
  });
}

export function toSeoMetadata(page?: SeoPageModel): Metadata {
  if (!page) return {};

  return {
    title: page.metadata.title,
    description: page.metadata.description,
    alternates: {
      canonical: page.metadata.canonical
    },
    robots: page.metadata.robots
  };
}

export function getIndexableAreaSeoPages() {
  return getAreas().flatMap((area) => {
    const page = getAreaSeoPage(slugify(area), {});
    return page?.isIndexable ? [page] : [];
  });
}

export function getIndexableNeighborhoodSeoPages() {
  return getNeighborhoods().flatMap((neighborhood) => {
    const page = getNeighborhoodSeoPage(slugify(neighborhood), {});
    return page?.isIndexable ? [page] : [];
  });
}

export function getIndexableCategorySeoPages() {
  return getCategories().flatMap((category) => {
    const page = getCategorySeoPage(slugify(category), {});
    return page?.isIndexable ? [page] : [];
  });
}

export function getIndexableAreaCategorySeoPages() {
  return getAreaCategoryCombinations().flatMap((combination) => {
    const page = getAreaCategorySeoPage(combination.areaSlug, combination.categorySlug, {});
    return page?.isIndexable ? [page] : [];
  });
}

export function getIndexablePopularSearchSeoPages() {
  return getPopularSearches().flatMap((search) => {
    const page = getPopularSearchSeoPage(search.slug, {});
    return page?.isIndexable ? [page] : [];
  });
}

export function getIndexableFacetSeoPages() {
  const facets: FacetKey[] = ["type", "dietary", "service", "offering"];
  return facets.flatMap((facet) =>
    getFacetLabels(facet).flatMap((label) => {
      const page = getFacetSeoPage(facet, slugify(label), {});
      return page?.isIndexable ? [page] : [];
    })
  );
}

function buildSeoPage(input: BasePageInput): SeoPageModel {
  const queryFilters = filtersFromSearchParams(input.searchParams);
  const openOnly = single(input.searchParams.open) === "1";
  const viewMode = asViewMode(single(input.searchParams.view));
  const requestedPage = numeric(single(input.searchParams.page)) ?? 1;
  const filters: ListingFilters = {
    ...queryFilters,
    ...input.baseFilters,
    q: queryFilters.q,
    sort: queryFilters.sort ?? input.defaultSort ?? input.baseFilters.sort
  };
  const filteredResults = filterListings(filters);
  const description = buildDataLedDescription(input, filteredResults);
  const results = openOnly
    ? filteredResults.filter((listing) => isOpenNow(listing.details?.workingHours))
    : filteredResults;
  const page = paginateListings(results, requestedPage, LISTINGS_PAGE_SIZE);
  const queryModified = shouldNoindexSearchParams(input.searchParams);
  const isIndexable = !queryModified && !input.forceNoindex && filteredResults.length >= input.minIndexableResults;
  const linkValues: ListingsPageLinkValues = {
    ...filters,
    basePath: input.canonical,
    rating: filters.rating ? String(filters.rating) : undefined,
    open: openOnly,
    view: viewMode,
    page: page.currentPage
  };

  return {
    kind: input.kind,
    metadata: {
      title: input.title,
      description,
      canonical: input.canonical,
      robots: isIndexable ? undefined : getNoindexFollowRobots()
    },
    isIndexable,
    breadcrumbItems: input.breadcrumbs,
    hero: {
      eyebrow: input.eyebrow,
      title: input.title,
      description,
      checkedLabel: SEO_POLICY.lastCheckedLabel
    },
    guide: {
      title: input.guideTitle,
      body: input.guideBody
    },
    areaGuide: input.areaGuide,
    informationGainBlocks: informationGainBlocks(input, filteredResults),
    faqs: input.faqs,
    summaryStats: summaryStats(filteredResults),
    relatedLinkGroups: input.relatedLinkGroups.filter((group) => group.links.length),
    listings: page.items,
    mapPoints: viewMode === "map" ? mapPointsFromListings(results) : [],
    totalCount: results.length,
    currentPage: page.currentPage,
    pageSize: page.pageSize,
    totalPages: page.totalPages,
    viewMode,
    openOnly,
    linkValues,
    filterPanelValues: linkValues,
    structuredData: [breadcrumbJsonLd(input.breadcrumbs), itemListJsonLd(page.items, input.canonical)]
  };
}

function filtersFromSearchParams(params: SeoPageSearchParams): ListingFilters {
  return {
    q: single(params.q),
    area: multi(params.area),
    neighborhood: multi(params.neighborhood),
    category: multi(params.category) ?? multi(params.cuisine),
    type: multi(params.type),
    dietary: multi(params.dietary),
    service: multi(params.service),
    offering: multi(params.offering),
    highlight: multi(params.highlight),
    popularFor: multi(params.popularFor),
    dining: multi(params.dining),
    amenity: multi(params.amenity),
    accessibility: multi(params.accessibility),
    atmosphere: multi(params.atmosphere),
    crowd: multi(params.crowd),
    planning: multi(params.planning),
    payment: multi(params.payment),
    children: multi(params.children),
    parking: multi(params.parking),
    pets: multi(params.pets),
    tube: multi(params.tube),
    bus: multi(params.bus),
    nearby: multi(params.nearby),
    price: multi(params.price),
    rating: numeric(single(params.rating)),
    sort: asSort(single(params.sort))
  };
}

function summaryStats(results: Listing[]): SeoSummaryStat[] {
  const highRatedCount = results.filter((listing) => Number(listing.rating ?? 0) >= 4.5).length;
  const reviewedCount = results.filter((listing) => Number(listing.reviewCount ?? 0) > 0).length;
  const pricedCount = results.filter((listing) => Boolean(listing.priceLevel)).length;
  const takeawayCount = results.filter((listing) =>
    (listing.details?.serviceOptions ?? []).some((item) => slugify(item) === "takeaway")
  ).length;
  const vegetarianCount = results.filter((listing) =>
    listing.dietaryOptions.some((item) => ["vegetarian", "vegan"].includes(slugify(item)))
  ).length;

  return [
    { label: directoryConfig.listingPluralLabel, value: results.length.toLocaleString() },
    { label: "Rated 4.5+", value: highRatedCount.toLocaleString() },
    { label: "With Google reviews", value: reviewedCount.toLocaleString() },
    { label: "With price data", value: pricedCount.toLocaleString() },
    { label: "Takeaway options", value: takeawayCount.toLocaleString() },
    { label: "Vegetarian or vegan", value: vegetarianCount.toLocaleString() }
  ].filter((stat) => stat.value !== "0");
}

function informationGainBlocks(input: BasePageInput, results: Listing[]): SeoInformationGainBlock[] {
  const reviewedCount = countWithReviews(results);
  const pricedCount = countWithPrice(results);
  const takeawayCount = countWithService(results, "takeaway");
  const deliveryCount = countWithService(results, "delivery");
  const vegetarianCount = results.filter((listing) =>
    listing.dietaryOptions.some((item) => ["vegetarian", "vegan"].includes(slugify(item)))
  ).length;
  const halalCount = results.filter((listing) =>
    [...listing.dietaryOptions, ...(listing.details?.offerings ?? [])].some((item) => slugify(item).includes("halal"))
  ).length;
  const topPriceLevels = topValuesFromResults(results, (listing) => [listing.priceLevel], 3).map((item) => item.label);
  const topAreas = topValuesFromResults(results, (listing) => [listing.area, listing.neighborhood].filter(isString), 3).map(
    (item) => item.label
  );
  const topCategories = topValuesFromResults(results, (listing) => listing.categories, 3).map((item) => item.label);
  const topServices = topValuesFromResults(results, (listing) => listing.details?.serviceOptions ?? [], 3).map(
    (item) => item.label
  );
  const stations = topTubeStations(results, 3);
  const subject = input.introCategory ? `${input.introCategory} options` : input.introSubject;

  return [
    {
      title: "Price and review signals",
      body: pricedCount
        ? `${subject} include visible price data on ${pricedCount.toLocaleString()} listings, with ${formatList(topPriceLevels)} appearing most often.`
        : `${subject} can still be compared by rating and review strength where price data is not available.`,
      items: [
        countPhrase(reviewedCount, "have Google reviews"),
        countPhrase(pricedCount, "show price data"),
        topPriceLevels.length ? `Common price bands: ${formatList(topPriceLevels)}` : undefined
      ].filter(isString)
    },
    {
      title: "Best-fit guidance",
      body: topCategories.length
        ? `The strongest matches often overlap with ${formatList(topCategories)}, so visitors can compare by cuisine style as well as location.`
        : `The strongest matches can be compared by rating, review volume, location, and practical service details.`,
      items: [
        topAreas.length ? `Useful local focus: ${formatList(topAreas)}` : undefined,
        topServices.length ? `Common service signals: ${formatList(topServices)}` : undefined,
        countPhrase(vegetarianCount, "mention vegetarian or vegan options")
      ].filter(isString)
    },
    {
      title: "Practical visit notes",
      body: `Use practical signals such as takeaway, delivery, dietary options, and nearby transport to narrow ${directoryConfig.listingPluralLabel.toLowerCase()} before opening a detail page.`,
      items: [
        countPhrase(takeawayCount, "offer takeaway"),
        countPhrase(deliveryCount, "offer delivery"),
        countPhrase(halalCount, "mention halal food or halal options"),
        stations.length ? `Frequent nearby stations: ${formatList(stations)}` : undefined
      ].filter(isString)
    }
  ].filter((block) => block.items.length);
}

function buildDataLedDescription(input: BasePageInput, results: Listing[]) {
  const count = results.length;
  const formattedCount = count.toLocaleString();
  const traits = descriptionTraits(input, results);
  const traitSuffix = traits.length ? `, including ${formatList(traits)}` : "";
  const listingPhrase = localListingPhrase();
  const categoryPhrase = input.introCategory
    ? `${input.introCategory} restaurant listings`
    : listingPhrase;

  let firstSentence: string;
  if (input.kind === "area" || input.kind === "neighborhood") {
    firstSentence = `${input.introSubject} has ${formattedCount} ${listingPhrase}${traitSuffix}.`;
  } else if (input.kind === "areaCategory") {
    firstSentence = `${input.introSubject} has ${formattedCount} ${categoryPhrase}${traitSuffix}.`;
  } else if (input.kind === "category") {
    firstSentence = `${input.introSubject} has ${formattedCount} matching restaurant listings in ${siteConfig.cityOrRegion}${traitSuffix}.`;
  } else {
    firstSentence = `${input.introSubject} include ${formattedCount} matching restaurant listings across ${siteConfig.cityOrRegion}${traitSuffix}.`;
  }

  const secondSentence = descriptionDataSentence(input, results);
  return secondSentence ? `${firstSentence} ${secondSentence}` : firstSentence;
}

function descriptionTraits(input: BasePageInput, results: Listing[]) {
  if (input.kind === "category") {
    return topValuesFromResults(results, (listing) => [listing.area, listing.neighborhood].filter(isString), 4).map(
      (item) => item.label
    );
  }

  if (input.kind === "facet" || input.kind === "best") {
    return topValuesFromResults(results, (listing) => [listing.area, ...listing.categories], 4).map((item) => item.label);
  }

  const excludedCategory = input.introCategory ? slugify(input.introCategory) : undefined;
  const categoryTraits = topValuesFromResults(
    results,
    (listing) => listing.categories.filter((category) => slugify(category) !== excludedCategory),
    2
  ).map((item) => item.label);
  const dietaryTraits = topValuesFromResults(results, (listing) => listing.dietaryOptions, 1).map((item) => item.label);
  const serviceTraits = topValuesFromResults(results, (listing) => listing.details?.serviceOptions ?? [], 1).map(
    (item) => item.label
  );

  return [...categoryTraits, ...dietaryTraits, ...serviceTraits].slice(0, 4);
}

function descriptionDataSentence(input: BasePageInput, results: Listing[]) {
  const countPhrases = [
    countPhrase(countWithReviews(results), "have Google reviews"),
    countPhrase(countWithPrice(results), "show price data"),
    countPhrase(countWithService(results, "takeaway"), "offer takeaway"),
    countPhrase(countWithService(results, "delivery"), "offer delivery")
  ].filter(isString);
  const stations = input.kind === "area" || input.kind === "neighborhood" ? topTubeStations(results, 2) : [];
  const stationPhrase = stations.length ? `Several are close to ${formatList(stations)}.` : undefined;

  if (!countPhrases.length) return stationPhrase;

  const countsSentence = `${formatList(countPhrases)}.`;
  return stationPhrase ? `${countsSentence} ${stationPhrase}` : countsSentence;
}

function topValuesFromResults(
  results: Listing[],
  selector: (listing: Listing) => Array<string | undefined>,
  limit: number
) {
  return topValues(results.flatMap((listing) => selector(listing)).filter(isString)).slice(0, limit);
}

function countWithReviews(results: Listing[]) {
  return results.filter((listing) => Number(listing.reviewCount ?? 0) > 0).length;
}

function countWithPrice(results: Listing[]) {
  return results.filter((listing) => Boolean(listing.priceLevel)).length;
}

function countWithService(results: Listing[], service: "takeaway" | "delivery") {
  return results.filter((listing) =>
    (listing.details?.serviceOptions ?? []).some((item) => slugify(item) === service)
  ).length;
}

function topTubeStations(results: Listing[], limit: number) {
  return topValuesFromResults(results, (listing) => [listing.location?.tubeStation], limit).map((item) => item.label);
}

function countPhrase(count: number, phrase: string) {
  return count > 0 ? `${count.toLocaleString()} ${phrase}` : undefined;
}

function localListingPhrase() {
  const niche = siteConfig.niche
    .replace(new RegExp(`\\s+in\\s+${escapeRegExp(siteConfig.cityOrRegion)}$`, "i"), "")
    .replace(/\s+/g, " ")
    .trim();

  if (niche.includes("restaurant")) return niche.replace(/\brestaurants\b/i, "restaurant listings");
  return `${directoryConfig.listingPluralLabel.toLowerCase()} listings`;
}

function formatList(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function introCount(kind: SeoPageModel["kind"], label: string, secondaryLabel?: string) {
  const filters: ListingFilters =
    kind === "area"
      ? { area: slugify(label) }
      : kind === "neighborhood"
        ? { neighborhood: slugify(label) }
        : kind === "category"
          ? { category: slugify(label) }
          : kind === "areaCategory" && secondaryLabel
            ? { category: slugify(label), area: slugify(secondaryLabel) }
            : {};
  const count = Object.keys(filters).length ? filterListings(filters).length : 0;
  return `Compare ${count.toLocaleString()} ${directoryConfig.listingPluralLabel.toLowerCase()}`;
}

function areaLinks(excludeSlug?: string): SeoRelatedLink[] {
  return getFeaturedAreas(8)
    .filter((area) => area.slug !== excludeSlug)
    .map((area) => ({ label: area.label, href: areaPath(area.slug), count: area.count }));
}

function categoryLinks(excludeSlug?: string): SeoRelatedLink[] {
  return getFeaturedCategoryCards(8)
    .filter((category) => category.slug !== excludeSlug)
    .map((category) => ({ label: category.label, href: categoryPath(category.slug), count: category.count }));
}

function usefulSearchLinks(): SeoRelatedLink[] {
  return getPopularSearches()
    .slice(0, 8)
    .map((search) => ({ label: search.title, href: search.href }));
}

function areaFaqs(headings: SeoLandingHeadingSet): SeoFaq[] {
  return [
    {
      question: headings.faq.chooseQuestion,
      answer: `Start with the rating and review count, then narrow by cuisine, price, opening status, and service options such as takeaway or delivery.`
    },
    {
      question: headings.faq.filterQuestion,
      answer: `Yes. Dietary filters show options such as halal, vegetarian, vegan, or gluten-free when those details are available.`
    },
    {
      question: headings.faq.exploreQuestion,
      answer: `Yes. Each result links to a profile with address, rating, review count, contact options, opening details, and related local pages.`
    }
  ];
}

function localFaqs(headings: SeoLandingHeadingSet): SeoFaq[] {
  return [
    {
      question: headings.faq.chooseQuestion,
      answer: `Use the list view for ratings and review volume, or switch to map view when location is the main decision factor.`
    },
    {
      question: headings.faq.filterQuestion,
      answer: `Use the open-now control to narrow the page to restaurants whose opening hours indicate they are currently open.`
    },
    {
      question: headings.faq.exploreQuestion,
      answer: `Yes. Related area and category links help you continue exploring nearby local options.`
    }
  ];
}

function categoryFaqs(label: string, headings: SeoLandingHeadingSet): SeoFaq[] {
  return [
    {
      question: headings.faq.chooseQuestion,
      answer: `Look for a strong rating, a meaningful number of reviews, clear service options, and location details that fit your visit.`
    },
    {
      question: headings.faq.filterQuestion,
      answer: `Yes. The related area links narrow this category to specific parts of ${siteConfig.cityOrRegion}.`
    },
    {
      question: headings.faq.exploreQuestion,
      answer: `Yes. Use the sort control to compare by rating, review volume, price, or featured order.`
    }
  ];
}

function areaCategoryFaqs(headings: SeoLandingHeadingSet): SeoFaq[] {
  return [
    {
      question: headings.faq.chooseQuestion,
      answer: `The result count shows how many matching restaurants are currently listed for this area and cuisine.`
    },
    {
      question: headings.faq.filterQuestion,
      answer: "Yes. Use the related links to browse the same category in other areas or different categories in the selected area."
    },
    {
      question: headings.faq.exploreQuestion,
      answer: `Yes. You can refine by rating, price, dietary needs, service options, and opening status.`
    }
  ];
}

function bestFaqs(headings: SeoLandingHeadingSet): SeoFaq[] {
  return [
    {
      question: headings.faq.chooseQuestion,
      answer: `The shortlist starts from a predefined search intent and uses available details such as ratings, reviews, prices, services, and categories.`
    },
    {
      question: headings.faq.filterQuestion,
      answer: `Yes. Use the area filter or the related area links to focus on a specific part of ${siteConfig.cityOrRegion}.`
    },
    {
      question: headings.faq.exploreQuestion,
      answer: "Yes. Use the map view control to compare matching restaurants by location when coordinates are available."
    }
  ];
}

function facetFaqs(headings: SeoLandingHeadingSet): SeoFaq[] {
  return [
    {
      question: headings.faq.chooseQuestion,
      answer: `It is a feature or service attached to restaurants where that detail is available.`
    },
    {
      question: headings.faq.filterQuestion,
      answer: "Yes. You can combine it with area, cuisine, rating, price, and other practical filters."
    },
    {
      question: headings.faq.exploreQuestion,
      answer: "The page reflects the available restaurant details, so check the restaurant profile and official links before making plans."
    }
  ];
}

function facetEnabled(facet: FacetKey) {
  if (facet === "type") return isDirectoryFeatureEnabled("listingTypePages");
  if (facet === "dietary") return isDirectoryFeatureEnabled("dietaryPages");
  if (facet === "service") return isDirectoryFeatureEnabled("servicePages");
  return isDirectoryFeatureEnabled("offeringPages");
}

function facetPath(facet: FacetKey, valueSlug: string) {
  if (facet === "type") return typePath(valueSlug);
  if (facet === "dietary") return dietaryPath(valueSlug);
  if (facet === "service") return servicePath(valueSlug);
  return offeringPath(valueSlug);
}

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function multi(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value || undefined;
}

function numeric(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asSort(value?: string): SortKey | undefined {
  return value === "rating" || value === "reviews" || value === "price" || value === "featured" ? value : undefined;
}

function asViewMode(value?: string): ListingsViewMode {
  return value === "map" ? "map" : "grid";
}

function topValues(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function isString(value: string | undefined): value is string {
  return Boolean(value);
}
