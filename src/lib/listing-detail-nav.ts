import type { Listing } from "@/data/listings";
import { directoryConfig } from "@/config/directory";
import { isDirectoryFeatureEnabled } from "@/lib/directory-features";

export type ListingNavTab = {
  label: string;
  href: `#${string}`;
};

export function buildListingDetailTabs(listing: Listing): ListingNavTab[] {
  const tabs: ListingNavTab[] = [
    { label: "Photos", href: "#photos" },
    { label: "Overview", href: "#overview" }
  ];

  if (isDirectoryFeatureEnabled("serviceDetails") && hasServiceFeatures(listing)) {
    tabs.push({ label: "Services", href: "#services" });
  }

  if (isDirectoryFeatureEnabled("guestInfoDetails") && hasGuestInfo(listing)) {
    tabs.push({ label: "Guest Info", href: "#guest-info" });
  }

  if (hasContact(listing)) {
    tabs.push({ label: "Contact", href: "#contact" });
  }

  if (hasHours(listing)) {
    tabs.push({ label: "Hours", href: "#hours" });
  }

  if (isDirectoryFeatureEnabled("transport") && hasTransport(listing)) {
    tabs.push({ label: directoryConfig.detailLabels.transportTitle, href: "#transport" });
  }

  if (isDirectoryFeatureEnabled("transport") && hasNearby(listing)) {
    tabs.push({ label: "Nearby", href: "#nearby" });
  }

  if (hasReviews(listing)) {
    tabs.push({ label: "Reviews", href: "#reviews" });
  }

  return tabs;
}

export function hasHours(listing: Listing) {
  return Boolean(listing.details?.workingHours?.length);
}

export function hasServiceFeatures(listing: Listing) {
  return hasAny([
    listing.details?.serviceOptions,
    listing.details?.highlights,
    listing.details?.popularFor,
    listing.details?.offerings,
    listing.details?.diningOptions,
    listing.details?.amenities
  ]);
}

export function hasGuestInfo(listing: Listing) {
  return hasAny([
    listing.details?.accessibility,
    listing.details?.atmosphere,
    listing.details?.crowd,
    listing.details?.planning,
    listing.details?.payments,
    listing.details?.children,
    listing.details?.parking,
    listing.details?.pets
  ]);
}

export function hasContact(listing: Listing) {
  return Boolean(
    listing.location?.googleMapsUrl ||
      listing.contact?.website ||
      listing.contact?.phone ||
      listing.contact?.email ||
      listing.contact?.googleReviewsUrl ||
      listing.contact?.reserveUrl ||
      listing.contact?.orderOnlineUrl ||
      listing.contact?.appointmentUrl ||
      listing.contact?.menuUrl ||
      listing.location?.latitude
  );
}

export function hasTransport(listing: Listing) {
  return Boolean(listing.location?.tubeStation || listing.location?.busStop);
}

export function hasNearby(listing: Listing) {
  return Boolean(listing.location?.nearbyPlaces?.length);
}

export function hasReviews(listing: Listing) {
  return Boolean(listing.rating || listing.reviewCount);
}

function hasAny(groups: Array<string[] | undefined>) {
  return groups.some((group) => Boolean(group?.length));
}
