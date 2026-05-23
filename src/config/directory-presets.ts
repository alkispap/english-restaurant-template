import type { SortKey } from "@/lib/directory";

export type DirectoryTemplatePresetKey = "genericLocalBusiness" | "restaurant" | "cafe";

export type DirectoryFeatureFlags = {
  popularSearchPages: boolean;
  areaCategoryPages: boolean;
  shortlist: boolean;
  homepageSections: boolean;
  sidebarBlocks: boolean;
  transport: boolean;
  listingTypePages: boolean;
  dietaryPages: boolean;
  servicePages: boolean;
  offeringPages: boolean;
  serviceDetails: boolean;
  guestInfoDetails: boolean;
  trustBadges: boolean;
};

export type DirectoryFilterLabels = {
  type: string;
  typeModal: string;
  dietary: string;
  service: string;
  offering: string;
  highlight: string;
  popularFor: string;
  dining: string;
  advanced: string;
  transport: string;
};

export type DirectoryActionLabels = {
  googleMaps: string;
  googleReviews: string;
  website: string;
  reserve: string;
  orderOnline: string;
  appointment: string;
  menu: string;
  email: string;
};

export type DirectoryDetailLabels = {
  servicesTitle: string;
  serviceOptions: string;
  highlights: string;
  popularFor: string;
  offerings: string;
  dining: string;
  amenities: string;
  guestInfoTitle: string;
  trustBadge: string;
  transportTitle: string;
  nearbyTitle: string;
};

export type DirectoryHomeSectionConfig = {
  id: string;
  title: string;
  copy?: string;
  source:
    | "localEats"
    | "budgetFriendly"
    | "highlyRated"
    | "popularSearches"
    | "userNeeds"
    | "openNow"
    | "recentListings"
    | "topAreas"
    | "topCategories"
    | "topNeighborhoods"
    | "transport"
    | "listingTypes"
    | "seoFeatures"
    | "usefulShortcuts";
  display?: "linkGrid" | "listingRow";
  enabled?: boolean;
  limit?: number;
  seeAllHref?: string;
};

export type DirectorySidebarBlockConfig = {
  id: string;
  title: string;
  source: DirectoryHomeSectionConfig["source"];
  enabled?: boolean;
  limit?: number;
};

export type DirectoryFooterGroupConfig = {
  title: string;
  links?: readonly { label: string; href: string }[];
  source?: "popularSearches" | "topAreas" | "topCategories";
  limit?: number;
};

export type DirectoryPopularSearchConfig = {
  slug: string;
  title: string;
  description: string;
  filters: Record<string, unknown>;
  sort?: SortKey;
};

export type DirectoryShortlistConfig = {
  enabled: boolean;
  storageKey: string;
  limit: number;
  label: string;
  comparePath: string;
};

export type DirectoryTemplatePreset = {
  listingLabel: string;
  listingPluralLabel: string;
  primaryCategory: string;
  categoryLabel: string;
  categoryPluralLabel: string;
  defaultSort: SortKey;
  priceLevels: readonly string[];
  ratingOptions: readonly number[];
  featuredAreasLimit: number;
  featuredCategoryLimit: number;
  features: DirectoryFeatureFlags;
  filterLabels: DirectoryFilterLabels;
  actionLabels: DirectoryActionLabels;
  detailLabels: DirectoryDetailLabels;
  homeSections: readonly DirectoryHomeSectionConfig[];
  sidebarBlocks: readonly DirectorySidebarBlockConfig[];
  shortlist: DirectoryShortlistConfig;
  popularSearches: readonly DirectoryPopularSearchConfig[];
  footerGroups: readonly DirectoryFooterGroupConfig[];
};

export type DirectoryPresetSettings = Partial<
  Pick<
    DirectoryTemplatePreset,
    "listingLabel" | "listingPluralLabel" | "categoryLabel" | "categoryPluralLabel"
  >
> & {
  features?: Partial<DirectoryFeatureFlags>;
};

const sharedFeatures: DirectoryFeatureFlags = {
  popularSearchPages: true,
  areaCategoryPages: true,
  shortlist: true,
  homepageSections: true,
  sidebarBlocks: true,
  transport: true,
  listingTypePages: true,
  dietaryPages: true,
  servicePages: true,
  offeringPages: true,
  serviceDetails: true,
  guestInfoDetails: true,
  trustBadges: true
};

const sharedHomeSections = [
  {
    id: "local-eats",
    title: "Local picks",
    copy: "Strong all-round listings with useful local signals.",
    source: "localEats",
    display: "listingRow",
    enabled: true,
    limit: 6
  },
  {
    id: "budget-friendly",
    title: "Budget-friendly",
    copy: "Lower-priced listings with known price data.",
    source: "budgetFriendly",
    display: "listingRow",
    enabled: true,
    limit: 6,
    seeAllHref: "/?sort=price"
  },
  {
    id: "highly-rated",
    title: "Highly rated",
    copy: "Top-rated listings from the current dataset.",
    source: "highlyRated",
    display: "listingRow",
    enabled: true,
    limit: 6,
    seeAllHref: "/?sort=rating"
  },
  {
    id: "recently-added",
    title: "Recently added listings",
    copy: "Fresh entries from the imported directory dataset.",
    source: "recentListings",
    display: "listingRow",
    enabled: true,
    limit: 6
  },
  {
    id: "top-neighbourhoods",
    title: "Top neighbourhoods",
    copy: "Neighbourhood pages generated from listing locations.",
    source: "topNeighborhoods",
    display: "linkGrid",
    enabled: true,
    limit: 6
  },
  {
    id: "transport-friendly",
    title: "Transport-friendly links",
    copy: "Find listings with useful transport signals.",
    source: "transport",
    display: "linkGrid",
    enabled: true,
    limit: 6
  },
  {
    id: "listing-types",
    title: "Listing types",
    copy: "Browse the directory by business type.",
    source: "listingTypes",
    display: "linkGrid",
    enabled: true,
    limit: 6
  }
] as const satisfies readonly DirectoryHomeSectionConfig[];

const sharedSidebarBlocks = [
  {
    id: "popular-searches",
    title: "Popular searches",
    source: "popularSearches",
    enabled: true,
    limit: 5
  },
  {
    id: "top-areas",
    title: "Top areas",
    source: "topAreas",
    enabled: true,
    limit: 5
  },
  {
    id: "top-categories",
    title: "Top {categoryPluralLabel}",
    source: "topCategories",
    enabled: true,
    limit: 5
  },
  {
    id: "recently-added",
    title: "Recently added",
    source: "recentListings",
    enabled: true,
    limit: 4
  },
  {
    id: "browse-by-need",
    title: "Browse by need",
    source: "seoFeatures",
    enabled: true,
    limit: 12
  },
  {
    id: "useful-shortcuts",
    title: "Useful shortcuts",
    source: "usefulShortcuts",
    enabled: true,
    limit: 5
  }
] as const satisfies readonly DirectorySidebarBlockConfig[];

const sharedShortlist = {
  enabled: true,
  storageKey: "directory-shortlist",
  limit: 12,
  label: "Saved",
  comparePath: "/compare"
} as const satisfies DirectoryShortlistConfig;

const sharedPopularSearches = [
  {
    slug: "best-rated",
    title: "Best rated {listingPluralLabelLower} in {cityOrRegion}",
    description: "Browse highly rated {listingPluralLabelLower} across {cityOrRegion}.",
    filters: {},
    sort: "rating"
  },
  {
    slug: "most-reviewed",
    title: "Most reviewed {listingPluralLabelLower} in {cityOrRegion}",
    description: "Find {listingPluralLabelLower} with the strongest review volume in {cityOrRegion}.",
    filters: {},
    sort: "reviews"
  },
  {
    slug: "family-friendly",
    title: "Family friendly {listingPluralLabelLower} in {cityOrRegion}",
    description: "Browse {listingPluralLabelLower} with family friendly features in {cityOrRegion}.",
    filters: { children: ["good-for-kids"] },
    sort: "rating"
  },
  {
    slug: "delivery",
    title: "Delivery {listingPluralLabelLower} in {cityOrRegion}",
    description: "Browse {listingPluralLabelLower} offering delivery in {cityOrRegion}.",
    filters: { service: ["delivery"] },
    sort: "rating"
  },
  {
    slug: "budget-friendly",
    title: "Budget friendly {listingPluralLabelLower} in {cityOrRegion}",
    description: "Browse lower priced {listingPluralLabelLower} in {cityOrRegion}.",
    filters: { price: ["\u00a3"] },
    sort: "rating"
  }
] as const satisfies readonly DirectoryPopularSearchConfig[];

const sharedFooterGroups = [
  {
    title: "Browse",
    links: [
      { label: "All {listingPluralLabelLower}", href: "/" },
      { label: "Areas", href: "/areas" },
      { label: "{categoryPluralLabel}", href: "/categories" }
    ]
  },
  {
    title: "Popular searches",
    source: "popularSearches",
    limit: 6
  },
  {
    title: "Top areas",
    source: "topAreas",
    limit: 6
  },
  {
    title: "Restaurant needs",
    links: [
      { label: "Takeaway restaurants", href: "/services/takeaway" },
      { label: "Delivery restaurants", href: "/services/delivery" },
      { label: "Vegetarian restaurants", href: "/dietary/vegetarian" },
      { label: "Vegan restaurants", href: "/dietary/vegan" },
      { label: "Halal restaurants", href: "/dietary/halal" },
      { label: "Casual dining", href: "/types/casual-dining" }
    ]
  },
  {
    title: "Useful filters",
    links: [
      { label: "Open now", href: "/?open=1" },
      { label: "Best rated", href: "/?sort=rating" },
      { label: "Most reviewed", href: "/?sort=reviews" },
      { label: "Lowest price", href: "/?sort=price" }
    ]
  }
] as const satisfies readonly DirectoryFooterGroupConfig[];

const genericLabels = {
  filterLabels: {
    type: "Business type",
    typeModal: "Types",
    dietary: "Options",
    service: "Services",
    offering: "Features",
    highlight: "Highlights",
    popularFor: "Popular for",
    dining: "Service details",
    advanced: "More filters",
    transport: "Transport"
  },
  actionLabels: {
    googleMaps: "Open Google Maps",
    googleReviews: "Read Google reviews",
    website: "Visit website",
    reserve: "Book online",
    orderOnline: "Order online",
    appointment: "Book appointment",
    menu: "View details",
    email: "Email"
  },
  detailLabels: {
    servicesTitle: "Services and features",
    serviceOptions: "Service options",
    highlights: "Highlights",
    popularFor: "Popular for",
    offerings: "Features",
    dining: "Service details",
    amenities: "Amenities",
    guestInfoTitle: "Visitor information",
    trustBadge: "Verified profile",
    transportTitle: "Transport",
    nearbyTitle: "Nearby places"
  }
} as const;

export const directoryTemplatePresets = {
  genericLocalBusiness: {
    listingLabel: "Business",
    listingPluralLabel: "Businesses",
    primaryCategory: "Business",
    categoryLabel: "Category",
    categoryPluralLabel: "Categories",
    defaultSort: "featured",
    priceLevels: ["\u00a3", "\u00a3\u00a3", "\u00a3\u00a3\u00a3"],
    ratingOptions: [4.8, 4.5, 4.0],
    featuredAreasLimit: 6,
    featuredCategoryLimit: 5,
    features: sharedFeatures,
    ...genericLabels,
    homeSections: sharedHomeSections,
    sidebarBlocks: sharedSidebarBlocks,
    shortlist: sharedShortlist,
    popularSearches: sharedPopularSearches,
    footerGroups: sharedFooterGroups
  },
  restaurant: {
    listingLabel: "Restaurant",
    listingPluralLabel: "Restaurants",
    primaryCategory: "Restaurant",
    categoryLabel: "Cuisine",
    categoryPluralLabel: "Cuisines",
    defaultSort: "rating",
    priceLevels: ["\u00a3", "\u00a3\u00a3", "\u00a3\u00a3\u00a3"],
    ratingOptions: [4.8, 4.5, 4.0],
    featuredAreasLimit: 6,
    featuredCategoryLimit: 5,
    features: sharedFeatures,
    filterLabels: {
      type: "Restaurant type",
      typeModal: "Types",
      dietary: "Dietary",
      service: "Service",
      offering: "Offering",
      highlight: "Highlight",
      popularFor: "Popular for",
      dining: "Dining option",
      advanced: "More restaurant filters",
      transport: "Transport"
    },
    actionLabels: {
      ...genericLabels.actionLabels,
      reserve: "Reserve a table",
      menu: "View menu"
    },
    detailLabels: {
      ...genericLabels.detailLabels,
      dining: "Dining options",
      guestInfoTitle: "Guest information",
      trustBadge: "Verified Google profile"
    },
    homeSections: [
      { ...sharedHomeSections[0], id: "local-eats", title: "Local eats" },
      ...sharedHomeSections.slice(1)
    ],
    sidebarBlocks: sharedSidebarBlocks,
    shortlist: sharedShortlist,
    popularSearches: [
      ...sharedPopularSearches.slice(0, 3),
      {
        slug: "takeaway",
        title: "Takeaway {listingPluralLabelLower} in {cityOrRegion}",
        description: "Find {listingPluralLabelLower} offering takeaway across {cityOrRegion}.",
        filters: { service: ["takeaway"] },
        sort: "rating"
      },
      ...sharedPopularSearches.slice(3),
      {
        slug: "vegan-friendly",
        title: "Vegan friendly {listingPluralLabelLower} in {cityOrRegion}",
        description: "Discover {listingPluralLabelLower} with vegan options in {cityOrRegion}.",
        filters: { dietary: ["vegan"] },
        sort: "rating"
      }
    ],
    footerGroups: sharedFooterGroups
  },
  cafe: {
    listingLabel: "Cafe",
    listingPluralLabel: "Cafes",
    primaryCategory: "Cafe",
    categoryLabel: "Style",
    categoryPluralLabel: "Styles",
    defaultSort: "rating",
    priceLevels: ["\u00a3", "\u00a3\u00a3", "\u00a3\u00a3\u00a3"],
    ratingOptions: [4.8, 4.5, 4.0],
    featuredAreasLimit: 6,
    featuredCategoryLimit: 5,
    features: sharedFeatures,
    filterLabels: {
      ...genericLabels.filterLabels,
      dietary: "Dietary",
      dining: "Visit options"
    },
    actionLabels: {
      ...genericLabels.actionLabels,
      menu: "View menu"
    },
    detailLabels: {
      ...genericLabels.detailLabels,
      dining: "Visit options"
    },
    homeSections: sharedHomeSections,
    sidebarBlocks: sharedSidebarBlocks,
    shortlist: sharedShortlist,
    popularSearches: sharedPopularSearches,
    footerGroups: sharedFooterGroups
  }
} as const satisfies Record<DirectoryTemplatePresetKey, DirectoryTemplatePreset>;

export function getDirectoryTemplatePreset(key: DirectoryTemplatePresetKey): DirectoryTemplatePreset {
  return directoryTemplatePresets[key];
}

export function mergePresetWithSettings(
  key: DirectoryTemplatePresetKey,
  settings: DirectoryPresetSettings = {}
): DirectoryTemplatePreset {
  const preset = getDirectoryTemplatePreset(key);
  return {
    ...preset,
    listingLabel: settings.listingLabel ?? preset.listingLabel,
    listingPluralLabel: settings.listingPluralLabel ?? preset.listingPluralLabel,
    categoryLabel: settings.categoryLabel ?? preset.categoryLabel,
    categoryPluralLabel: settings.categoryPluralLabel ?? preset.categoryPluralLabel,
    features: {
      ...preset.features,
      ...(settings.features ?? {})
    }
  };
}
