import type { Listing } from "@/data/listings";
import { siteConfig } from "@/config/site";
import { cleanListingUrl } from "@/lib/listing-links";

export function localBusinessJsonLd(listing: Listing) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: listing.name,
    url: `${siteConfig.url}/${siteConfig.listingBasePath}/${listing.slug}`
  };

  if (listing.description) schema.description = listing.description;

  if (listing.images.length) {
    schema.image = listing.images.length === 1 ? listing.images[0] : listing.images;
  }

  const addressParts: Record<string, string> = { "@type": "PostalAddress" };
  if (listing.address) addressParts.streetAddress = listing.address;
  if (listing.city) addressParts.addressLocality = listing.city;
  if (listing.neighborhood) addressParts.addressRegion = listing.neighborhood;
  if (listing.postcode) addressParts.postalCode = listing.postcode;
  if (Object.keys(addressParts).length > 1) {
    schema.address = addressParts;
  }

  if (listing.location?.latitude && listing.location?.longitude) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: listing.location.latitude,
      longitude: listing.location.longitude
    };
  }

  if (listing.contact?.phone) schema.telephone = listing.contact.phone;
  const sameAs = [
    cleanListingUrl(listing.contact?.website),
    ...Object.values(listing.contact?.socials ?? {}).map((url) => cleanListingUrl(url))
  ].filter((url): url is string => Boolean(url));
  if (sameAs.length) schema.sameAs = sameAs;

  if (listing.priceLevel) schema.priceRange = listing.priceLevel;

  if (listing.rating && listing.reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: listing.rating,
      reviewCount: listing.reviewCount,
      bestRating: 5,
      worstRating: 1
    };
  }

  if (listing.details?.workingHours?.length) {
    const specs = listing.details.workingHours
      .map((entry) => {
        const schemaDay = schemaDayName(entry.day);
        if (!schemaDay || isClosed(entry.hours)) return null;

        const range = parseOpeningRange(entry.hours);
        if (!range) return null;

        return {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: schemaDay,
          opens: range.opens,
          closes: range.closes
        };
      })
      .filter(Boolean);

    if (specs.length) {
      schema.openingHoursSpecification = specs;
    }
  }

  return schema;
}

export function breadcrumbJsonLd(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.href}`
    }))
  };
}

export function itemListJsonLd(items: Listing[], pageHref: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url: `${siteConfig.url}${pageHref}`,
    numberOfItems: items.length,
    itemListElement: items.map((listing, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: localBusinessJsonLd(listing)
    }))
  };
}

function schemaDayName(day: string) {
  const dayMap: Record<string, string> = {
    monday: "Monday",
    mon: "Monday",
    tuesday: "Tuesday",
    tue: "Tuesday",
    wednesday: "Wednesday",
    wed: "Wednesday",
    thursday: "Thursday",
    thu: "Thursday",
    friday: "Friday",
    fri: "Friday",
    saturday: "Saturday",
    sat: "Saturday",
    sunday: "Sunday",
    sun: "Sunday"
  };
  const normalized = day.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  return dayMap[normalized];
}

function isClosed(hours: string) {
  return /^closed$/i.test(hours.trim());
}

function parseOpeningRange(hours: string) {
  const rangeMatch = hours.match(
    /(\d{1,2}(?:[:.]\d{2})?)\s*(am|pm)?\s*[-–—]\s*(\d{1,2}(?:[:.]\d{2})?)\s*(am|pm)?/i
  );
  if (!rangeMatch) return undefined;

  const openPeriod = rangeMatch[2] || rangeMatch[4];
  const opens = parseTime(rangeMatch[1], openPeriod);
  const closes = parseTime(rangeMatch[3], rangeMatch[4]);
  if (!opens || !closes) return undefined;

  return { opens, closes };
}

function parseTime(value: string, period?: string) {
  const match = value.match(/^(\d{1,2})(?:[:.](\d{2}))?$/);
  if (!match) return undefined;

  return to24h(parseInt(match[1], 10), match[2] ? parseInt(match[2], 10) : 0, period);
}

function to24h(hours: number, minutes: number, period?: string): string | undefined {
  let h = hours;

  if (period) {
    const normalized = period.toLowerCase().trim();
    if (normalized === "pm" && h !== 12) h += 12;
    if (normalized === "am" && h === 12) h = 0;
  }

  if (h < 0 || h > 23 || minutes < 0 || minutes > 59) return undefined;
  return `${String(h).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
