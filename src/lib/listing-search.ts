import { listingSearchRecords } from "@/data/listing-search-records";
import { initializeListingSearchRuntime } from "@/lib/listing-search-runtime";

initializeListingSearchRuntime(listingSearchRecords);

export * from "@/lib/listing-search-runtime";
