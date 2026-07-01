import searchRecordsData from "../../data/listing-search-records.json";
import type { ListingResultSummary } from "@/lib/listings-page";

export type ListingSearchRecord = ListingResultSummary & {
  borough?: string;
  postcode?: string;
  listingTypes: string[];
  featured: boolean;
  tags: string[];
  contact?: ListingResultSummary["contact"] & {
    menuUrl?: string;
    reserveUrl?: string;
    appointmentUrl?: string;
  };
  location?: ListingResultSummary["location"] & {
    tubeStation?: string;
    busStop?: string;
    nearbyPlaces?: string[];
  };
  details?: ListingResultSummary["details"] & {
    offerings?: string[];
    popularFor?: string[];
    amenities?: string[];
    accessibility?: string[];
    atmosphere?: string[];
    crowd?: string[];
    planning?: string[];
    payments?: string[];
    children?: string[];
    parking?: string[];
    pets?: string[];
  };
};

export const listingSearchRecords = searchRecordsData as ListingSearchRecord[];
