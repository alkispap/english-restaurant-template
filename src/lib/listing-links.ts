import type { Listing } from "@/data/listings";

export function cleanListingUrl(value: unknown): string | undefined {
  const candidates = splitUrlCandidates(value);

  for (const candidate of candidates) {
    const unwrapped = unwrapGoogleRedirect(candidate);
    const cleaned = validListingUrl(unwrapped);
    if (cleaned) return cleaned;
  }

  return undefined;
}

export function getListingMapsUrl(listing: Pick<Listing, "name" | "fullAddress" | "address" | "postcode" | "city" | "location">) {
  const explicitMapsUrl = cleanListingUrl(listing.location?.googleMapsUrl);
  if (explicitMapsUrl) return explicitMapsUrl;

  const query = [listing.name, listing.fullAddress ?? [listing.address, listing.postcode, listing.city].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(" ");

  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : undefined;
}

function splitUrlCandidates(value: unknown) {
  return String(value ?? "")
    .split(/,\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function unwrapGoogleRedirect(value: string) {
  if (!value.startsWith("/url?")) return value;

  try {
    const redirect = new URL(value, "https://www.google.com");
    return redirect.searchParams.get("q") ?? value;
  } catch {
    return value;
  }
}

function validListingUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:" || url.protocol === "tel:") {
      return url.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
}
