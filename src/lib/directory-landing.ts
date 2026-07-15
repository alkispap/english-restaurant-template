import { directoryConfig } from "@/config/directory";
import { featuredDiningHubs } from "@/config/featured-dining-hubs";
import { siteConfig } from "@/config/site";
import { listings, type Listing } from "@/data/listings";
import {
  getBestRatedListings,
  filterListings,
  slugify
} from "@/lib/directory";
import { buildDirectoryListingsModel } from "@/lib/directory-listings-model";
import { getDirectorySummary } from "@/lib/directory-summary";
import type { AreaCentroid } from "@/lib/geo-area";
import { dietaryPath, directorySearchPath, listingDetailPath, neighborhoodPath, servicePath } from "@/lib/routes";

export type DirectoryLandingCard = {
  title: string;
  href: string;
  description?: string;
  count?: number;
  image?: string;
  imageAlt: string;
  imageCredit?: DirectoryLandingImageCredit;
};

export type DirectoryLandingImageCredit = {
  title: string;
  author: string;
  sourceUrl: string;
  licenseLabel: string;
  licenseUrl: string;
  note: string;
};

export type DirectoryLandingRestaurantCard = {
  name: string;
  href: string;
  description?: string;
  area?: string;
  rating?: number;
  reviewCount?: number;
  priceLevel?: string;
  image?: string;
  imageAlt: string;
};

export type DirectoryLandingRestaurantRow = {
  id: string;
  title: string;
  description: string;
  seeAllHref: string;
  items: DirectoryLandingRestaurantCard[];
};

export type DirectoryLandingLink = {
  title: string;
  href: string;
  count: number;
};

export type DirectoryLandingModel = {
  summary: string;
  hero: {
    title: string;
    description: string;
    searchBasePath: string;
    searchAreas: Array<{ label: string; value: string }>;
    searchMapPoints: AreaCentroid[];
  };
  primaryNeeds: {
    title: string;
    description: string;
    items: DirectoryLandingCard[];
  };
  diningHubs: {
    title: string;
    description: string;
    items: DirectoryLandingCard[];
  };
  restaurantRows: DirectoryLandingRestaurantRow[];
  serviceNeeds: {
    title: string;
    description: string;
    items: DirectoryLandingCard[];
  };
  regionLinks: {
    title: string;
    description: string;
    items: DirectoryLandingLink[];
  };
  finalCta: {
    title: string;
    description: string;
    href: string;
    label: string;
  };
};

const RESTAURANT_ROW_LIMIT = 4;

const londonRegionGroups = [
  {
    title: "Central London",
    areas: ["Westminster", "Camden", "Islington", "Kensington and Chelsea", "City of London"]
  },
  {
    title: "North London",
    areas: ["Barnet", "Enfield", "Haringey", "Harrow"]
  },
  {
    title: "South London",
    areas: [
      "Bexley",
      "Bromley",
      "Croydon",
      "Greenwich",
      "Kingston upon Thames",
      "Lambeth",
      "Lewisham",
      "Merton",
      "Southwark",
      "Sutton",
      "Wandsworth"
    ]
  },
  {
    title: "East London",
    areas: ["Barking and Dagenham", "Hackney", "Havering", "Newham", "Redbridge", "Tower Hamlets", "Waltham Forest"]
  },
  {
    title: "West London",
    areas: ["Brent", "Ealing", "Hammersmith and Fulham", "Hillingdon", "Hounslow", "Richmond upon Thames"]
  }
] as const;

const primaryNeedDefinitions = [
  {
    title: "Halal",
    slug: "halal",
    image: "/images/homepage/dietary/halal.webp",
    imageAlt: "Illustrated halal Indian biryani, chicken tikka, and grilled kebabs"
  },
  {
    title: "Vegetarian",
    slug: "vegetarian",
    image: "/images/homepage/dietary/vegetarian.webp",
    imageAlt: "Illustrated vegetarian Indian thali with paneer, lentils, rice, and vegetables"
  },
  {
    title: "Vegan",
    slug: "vegan",
    image: "/images/homepage/dietary/vegan.webp",
    imageAlt: "Illustrated vegan Indian spread with chickpeas, cauliflower, spinach, and rice"
  },
  {
    title: "Gluten-free",
    slug: "gluten-free",
    image: "/images/homepage/dietary/gluten-free.webp",
    imageAlt: "Illustrated gluten-free Indian spread with dosa, idli, rice, dal, and chutneys"
  }
] as const;

const serviceNeedDefinitions = [
  { title: "Takeaway", slug: "takeaway" },
  { title: "Delivery", slug: "delivery" },
  { title: "Outdoor seating", slug: "outdoor-seating" }
] as const;

export function getDirectoryLandingModel(): DirectoryLandingModel {
  const searchModel = buildDirectoryListingsModel({
    basePath: directorySearchPath(),
    title: siteConfig.niche,
    description: siteConfig.description
  });
  return {
    summary: getDirectorySummary(),
    hero: {
      title: titleCase(siteConfig.niche),
      description: siteConfig.heroCopy,
      searchBasePath: directorySearchPath(),
      searchAreas: searchModel.searchAreas,
      searchMapPoints: searchModel.searchMapPoints
        .filter(hasCoordinates)
        .map((point) => ({
          slug: point.slug,
          name: point.name,
          area: point.area,
          latitude: point.latitude,
          longitude: point.longitude
        }))
    },
    primaryNeeds: {
      title: "Choose by dietary need",
      description: `Start with the dietary options diners look for most across ${siteConfig.cityOrRegion}.`,
      items: getPrimaryNeedCards()
    },
    diningHubs: {
      title: `Explore ${siteConfig.cityOrRegion} dining hubs`,
      description: `Browse established neighbourhoods with distinctive Indian and South Asian dining scenes.`,
      items: getDiningHubCards()
    },
    restaurantRows: [
      restaurantRow({
        id: "best-rated",
        title: `Best rated ${siteConfig.niche}`,
        description: "Restaurants with strong rating and review signals from the current directory.",
        seeAllHref: directorySearchPath("?sort=rating"),
        listings: getBestRatedListings(RESTAURANT_ROW_LIMIT)
      })
    ].filter((row) => row.items.length > 0),
    serviceNeeds: {
      title: "How do you want to eat?",
      description: `Find ${directoryConfig.listingPluralLabel.toLowerCase()} for takeaway, delivery, or outdoor dining.`,
      items: getServiceNeedCards()
    },
    regionLinks: {
      title: `Browse all ${siteConfig.cityOrRegion} regions`,
      description: `Search more broadly across central, north, south, east, and west ${siteConfig.cityOrRegion}.`,
      items: getRegionLinks()
    },
    finalCta: {
      title: `Search all ${siteConfig.niche}`,
      description: "Use the full directory search to filter by area, rating, price, cuisine, service options, transport, and dining style.",
      href: directorySearchPath(),
      label: `All ${directoryConfig.listingPluralLabel.toLowerCase()}`
    }
  };
}

function restaurantRow({
  id,
  title,
  description,
  seeAllHref,
  listings
}: {
  id: string;
  title: string;
  description: string;
  seeAllHref: string;
  listings: Listing[];
}): DirectoryLandingRestaurantRow {
  return {
    id,
    title,
    description,
    seeAllHref,
    items: listings.map(restaurantCard)
  };
}

function getRegionLinks(): DirectoryLandingLink[] {
  return londonRegionGroups
    .map((region) => {
      const areaSlugs = existingAreaSlugs(region.areas);
      const count = areaSlugs.length ? filterListings({ area: areaSlugs }).length : 0;

      return {
        title: region.title,
        href: regionHref(areaSlugs),
        count
      };
    })
    .filter((card) => card.count > 0);
}

function getPrimaryNeedCards(): DirectoryLandingCard[] {
  return primaryNeedDefinitions
    .map((need) => {
      const count = filterListings({ dietary: need.slug }).length;

      return {
        title: need.title,
        href: dietaryPath(need.slug),
        description: `${count.toLocaleString()} ${directoryConfig.listingPluralLabel.toLowerCase()} with ${need.title.toLowerCase()} options.`,
        count,
        image: need.image,
        imageAlt: need.imageAlt
      };
    })
    .filter((card) => card.count > 0);
}

function getServiceNeedCards(): DirectoryLandingCard[] {
  return serviceNeedDefinitions
    .map((need) => {
      const count = filterListings({ service: need.slug }).length;

      return {
        title: need.title,
        href: servicePath(need.slug),
        description: `${count.toLocaleString()} ${directoryConfig.listingPluralLabel.toLowerCase()} with ${need.title.toLowerCase()} options.`,
        count,
        image: imageForFilters({ service: need.slug }),
        imageAlt: `${need.title} ${siteConfig.niche}`
      };
    })
    .filter((card) => card.count > 0);
}

function getDiningHubCards(): DirectoryLandingCard[] {
  return featuredDiningHubs
    .map((hub) => {
      const count = filterListings({ neighborhood: hub.slug }).length;

      return {
        title: hub.title,
        href: neighborhoodPath(hub.slug),
        description: `${count.toLocaleString()} ${directoryConfig.listingPluralLabel.toLowerCase()} in ${hub.title}.`,
        count,
        image: hub.image,
        imageAlt: hub.imageAlt,
        imageCredit: hub.credit
      };
    })
    .filter((card) => card.count > 0);
}

function existingAreaSlugs(areaLabels: readonly string[]) {
  const availableAreaSlugs = new Set(listings.map((listing) => listing.area).filter(isString).map(slugify));
  return areaLabels.map(slugify).filter((areaSlug) => availableAreaSlugs.has(areaSlug));
}

function regionHref(areaSlugs: string[]) {
  const params = new URLSearchParams();
  areaSlugs.forEach((areaSlug) => params.append("area", areaSlug));
  return directorySearchPath(`?${params.toString()}`);
}

function restaurantCard(listing: Listing): DirectoryLandingRestaurantCard {
  return {
    name: listing.name,
    href: listingDetailPath(listing.slug),
    description: listing.description,
    area: listing.area,
    rating: listing.rating,
    reviewCount: listing.reviewCount,
    priceLevel: listing.priceLevel,
    image: listing.images[0],
    imageAlt: listing.images[0] ? `${listing.name} ${directoryConfig.listingLabel.toLowerCase()} in ${siteConfig.cityOrRegion}` : listing.name
  };
}

function imageForFilters(filters: { area?: unknown; category?: unknown; dietary?: unknown; service?: unknown; type?: unknown }) {
  const category = firstString(filters.category);
  const area = firstString(filters.area);
  const dietary = firstString(filters.dietary);
  const service = firstString(filters.service);
  const type = firstString(filters.type);

  return listings.find((listing) => {
    if (area && listing.area && slugMatches(listing.area, area)) return listing.images[0];
    if (category && listing.categories.some((value) => slugMatches(value, category))) return listing.images[0];
    if (dietary && listing.dietaryOptions.some((value) => slugMatches(value, dietary))) return listing.images[0];
    if (service && listing.details?.serviceOptions?.some((value) => slugMatches(value, service))) return listing.images[0];
    if (type && listing.listingTypes.some((value) => slugMatches(value, type))) return listing.images[0];
    return false;
  })?.images[0];
}

function firstString(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function slugMatches(label: string, slug: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") === slug;
}

function hasCoordinates(point: { latitude?: number; longitude?: number }): point is { latitude: number; longitude: number } {
  return typeof point.latitude === "number" && typeof point.longitude === "number";
}

function titleCase(value: string) {
  const smallWords = new Set(["a", "an", "and", "as", "at", "by", "for", "from", "in", "of", "on", "or", "the", "to"]);
  return value
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && smallWords.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function isString(value: string | undefined): value is string {
  return Boolean(value);
}
