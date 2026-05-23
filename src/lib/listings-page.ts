import type { Listing } from "@/data/listings";
import { directoryIndexPath } from "@/lib/routes";

export type ListingsViewMode = "grid" | "map";

export type ListingsPageLinkValues = {
  basePath?: string;
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
  open?: boolean;
  view?: ListingsViewMode;
  page?: number;
};

export type MapPoint = {
  slug: string;
  name: string;
  area?: string;
  categories: string[];
  rating?: number;
  reviewCount?: number;
  latitude: number;
  longitude: number;
};

export const LISTINGS_PAGE_SIZE = 12;

export function paginateListings<T>(items: T[], requestedPage = 1, pageSize = LISTINGS_PAGE_SIZE) {
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    currentPage,
    pageSize,
    totalCount,
    totalPages
  };
}

export function buildListingsPageHref(values: ListingsPageLinkValues, overrides: Partial<ListingsPageLinkValues> = {}) {
  const next = { ...values, ...overrides };
  const params = new URLSearchParams();

  stringParams.forEach((key) => {
    const value = next[key];
    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((item) => params.append(key, item));
    } else if (value) {
      params.set(key, value);
    }
  });

  if (next.open) params.set("open", "1");
  if (next.view === "map") params.set("view", "map");
  if (next.page && next.page > 1) params.set("page", String(next.page));

  const query = params.toString();
  const basePath = next.basePath || directoryIndexPath();
  return query ? `${basePath}?${query}` : basePath;
}

export function mapPointFromListing(listing: Listing): MapPoint | undefined {
  const latitude = listing.location?.latitude;
  const longitude = listing.location?.longitude;
  if (!latitude || !longitude) return undefined;

  return {
    slug: listing.slug,
    name: listing.name,
    area: listing.area,
    categories: listing.categories.slice(0, 2),
    rating: listing.rating,
    reviewCount: listing.reviewCount,
    latitude,
    longitude
  };
}

export function mapPointsFromListings(listings: Listing[]) {
  const points = listings.flatMap((listing) => {
    const point = mapPointFromListing(listing);
    return point ? [point] : [];
  });

  return excludeCoordinateOutliers(points);
}

function excludeCoordinateOutliers(points: MapPoint[]) {
  if (points.length < 4) return points;

  const center = {
    latitude: median(points.map((point) => point.latitude)),
    longitude: median(points.map((point) => point.longitude))
  };
  const distances = points.map((point) => ({
    point,
    distance: distanceKm(center.latitude, center.longitude, point.latitude, point.longitude)
  }));
  const sortedDistances = distances.map((item) => item.distance).sort((a, b) => a - b);
  const upperQuartile = sortedDistances[Math.floor(sortedDistances.length * 0.75)] ?? 0;
  const thresholdKm = Math.max(50, upperQuartile * 3);

  return distances.filter((item) => item.distance <= thresholdKm).map((item) => item.point);
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function distanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const lat1 = toRadians(fromLat);
  const lat2 = toRadians(toLat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

const stringParams = [
  "q",
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
  "rating",
  "sort"
] as const;
