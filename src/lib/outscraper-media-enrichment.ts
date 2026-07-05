import type { Listing } from "@/data/listings";

export type OutscraperPhotoRow = {
  name?: string;
  place_id?: string;
  photo_url?: string;
  photo_url_big?: string;
  original_photo_url?: string;
  photo_tags?: string;
};

export type OutscraperMediaEnrichmentReport = {
  sourceRows: number;
  usablePhotoRows: number;
  matchedPhotoRows: number;
  matchedRestaurants: number;
  restaurantsWithImages: number;
  restaurantsWithFivePhotos: number;
  restaurantsWithMenuImages: number;
};

export type OutscraperMediaEnrichmentResult = {
  listings: Listing[];
  report: OutscraperMediaEnrichmentReport;
};

export type ListingMediaCleanupReport = {
  removedImageUrls: number;
  removedMenuImageUrls: number;
  listingsWithRemovedMedia: number;
};

export type ListingMediaCleanupResult = {
  listings: Listing[];
  report: ListingMediaCleanupReport;
};

type MediaForPlace = {
  images: string[];
  menuImages: string[];
  matchedRows: number;
};

const MAX_LISTING_IMAGES = 5;

export function enrichListingsWithOutscraperMedia(
  listings: Listing[],
  photoRows: OutscraperPhotoRow[]
): OutscraperMediaEnrichmentResult {
  const listingPlaceIds = new Set(listings.map((listing) => listing.details?.placeId).filter((placeId): placeId is string => Boolean(placeId)));
  const mediaByPlaceId = new Map<string, MediaForPlace>();
  let usablePhotoRows = 0;
  let matchedPhotoRows = 0;

  for (const row of photoRows) {
    const placeId = row.place_id?.trim();
    const photoUrl = preferredPhotoUrl(row);
    if (!placeId || !photoUrl) continue;

    usablePhotoRows += 1;
    if (!listingPlaceIds.has(placeId)) continue;

    matchedPhotoRows += 1;
    const media = mediaByPlaceId.get(placeId) ?? { images: [], menuImages: [], matchedRows: 0 };
    media.matchedRows += 1;

    if (isMenuPhoto(row)) {
      addUnique(media.menuImages, photoUrl);
    } else if (media.images.length < MAX_LISTING_IMAGES) {
      addUnique(media.images, photoUrl);
    }

    mediaByPlaceId.set(placeId, media);
  }

  const enrichedListings = listings.map((listing) => {
    const placeId = listing.details?.placeId;
    const media = placeId ? mediaByPlaceId.get(placeId) : undefined;
    if (!media) return listing;

    return {
      ...listing,
      images: media.images,
      ...(media.menuImages.length ? { menuImages: media.menuImages } : { menuImages: undefined })
    };
  });

  const mediaEntries = [...mediaByPlaceId.values()];

  return {
    listings: enrichedListings,
    report: {
      sourceRows: photoRows.length,
      usablePhotoRows,
      matchedPhotoRows,
      matchedRestaurants: mediaByPlaceId.size,
      restaurantsWithImages: mediaEntries.filter((media) => media.images.length > 0).length,
      restaurantsWithFivePhotos: mediaEntries.filter((media) => media.images.length >= MAX_LISTING_IMAGES).length,
      restaurantsWithMenuImages: mediaEntries.filter((media) => media.menuImages.length > 0).length
    }
  };
}

export function preferredPhotoUrl(row: OutscraperPhotoRow) {
  return cleanUrl(row.photo_url_big) || cleanUrl(row.original_photo_url) || cleanUrl(row.photo_url);
}

export function isMenuPhoto(row: OutscraperPhotoRow) {
  return splitTags(row.photo_tags).some((tag) => tag.toLocaleLowerCase() === "menu");
}

export function cleanUnusableListingMedia(listings: Listing[]): ListingMediaCleanupResult {
  let removedImageUrls = 0;
  let removedMenuImageUrls = 0;
  let listingsWithRemovedMedia = 0;

  const cleanedListings = listings.map((listing) => {
    const images = (listing.images ?? []).filter((url) => !isKnownBlockedGooglePhotoUrl(url));
    const menuImages = (listing.menuImages ?? []).filter((url) => !isKnownBlockedGooglePhotoUrl(url));
    const removedImagesForListing = (listing.images ?? []).length - images.length;
    const removedMenuImagesForListing = (listing.menuImages ?? []).length - menuImages.length;

    if (removedImagesForListing || removedMenuImagesForListing) {
      listingsWithRemovedMedia += 1;
      removedImageUrls += removedImagesForListing;
      removedMenuImageUrls += removedMenuImagesForListing;
    }

    return {
      ...listing,
      images,
      ...(menuImages.length ? { menuImages } : { menuImages: undefined })
    };
  });

  return {
    listings: cleanedListings,
    report: {
      removedImageUrls,
      removedMenuImageUrls,
      listingsWithRemovedMedia
    }
  };
}

export function isKnownBlockedGooglePhotoUrl(url: string) {
  return /https:\/\/lh\d\.googleusercontent\.com\/gps-cs-s\/APNQ/i.test(url);
}

export function parseOutscraperPhotoCsv(csv: string): OutscraperPhotoRow[] {
  const rows = parseCsv(csv);
  const headers = rows.shift();
  if (!headers) return [];

  return rows
    .filter((row) => row.some((value) => value.trim()))
    .map((row) => {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = row[index] ?? "";
      });

      return {
        name: record.name,
        place_id: record.place_id,
        photo_url: record.photo_url,
        photo_url_big: record.photo_url_big,
        original_photo_url: record.original_photo_url,
        photo_tags: record.photo_tags
      };
    });
}

function addUnique(values: string[], value: string) {
  if (!values.includes(value)) values.push(value);
}

function cleanUrl(value?: string) {
  const trimmed = value?.trim();
  return trimmed && /^https?:\/\//i.test(trimmed) ? trimmed : "";
}

function splitTags(value?: string) {
  return (value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseCsv(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];

    if (quoted) {
      if (char === "\"") {
        if (csv[index + 1] === "\"") {
          field += "\"";
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === "\"") {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows;
}
