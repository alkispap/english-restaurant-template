import listingsData from "../../data/listings.json";

export type NearbyPlace = {
  label: string;
  name: string;
  distanceMeters?: number;
};

export type OpeningHours = {
  day: string;
  hours: string;
};

export type ReviewDistribution = {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
};

export type ListingProvenance = {
  sourceName: string;
  sourceId?: string;
  sourceUrl?: string;
  importedAt?: string;
  firstRecordedAt?: string;
  recordDateBasis?: "first-committed";
  sourceCommit?: string;
  sourceSnapshotSha256?: string;
  lastVerifiedAt?: string;
  lastVerificationEventId?: string;
  verificationStatus: "unverified" | "source-verified" | "editor-verified";
};

export type Listing = {
  name: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  description?: string;
  logo?: string;
  images: string[];
  menuImages?: string[];
  imageFallbackLabel?: string;
  area?: string;
  neighborhood?: string;
  borough?: string;
  postcode?: string;
  address?: string;
  fullAddress?: string;
  city?: string;
  categories: string[];
  listingTypes: string[];
  dietaryOptions: string[];
  tags: string[];
  priceLevel?: "\u00a3" | "\u00a3\u00a3" | "\u00a3\u00a3\u00a3";
  rating?: number;
  reviewCount?: number;
  businessStatus?: string;
  provenance?: ListingProvenance;
  featured?: boolean;
  reviewDistribution?: ReviewDistribution;
  contact?: {
    website?: string;
    phone?: string;
    phoneAlt?: string;
    email?: string;
    contactUrl?: string;
    googleReviewsUrl?: string;
    orderOnlineUrl?: string;
    reserveUrl?: string;
    appointmentUrl?: string;
    menuUrl?: string;
    socials?: Record<string, string>;
  };
  location?: {
    latitude?: number;
    longitude?: number;
    googleMapsUrl?: string;
    tubeStation?: string;
    tubeLines?: string[];
    tubeDistanceMeters?: number;
    tubeWalkMinutes?: number;
    nightTubeAvailable?: boolean;
    busStop?: string;
    busRoutes?: string[];
    busDistanceMeters?: number;
    busWalkMinutes?: number;
    nightBusAvailable?: boolean;
    nearbyPlaces?: NearbyPlace[];
  };
  details?: {
    workingHours?: OpeningHours[];
    workingHoursText?: string;
    serviceOptions?: string[];
    highlights?: string[];
    popularFor?: string[];
    accessibility?: string[];
    offerings?: string[];
    diningOptions?: string[];
    amenities?: string[];
    atmosphere?: string[];
    crowd?: string[];
    planning?: string[];
    payments?: string[];
    children?: string[];
    parking?: string[];
    pets?: string[];
    googleVerified?: boolean;
    placeId?: string;
  };
};

export const listings = listingsData as Listing[];
