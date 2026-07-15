import type { Listing } from "@/data/listings";

export type ListingMediaKind = "gallery" | "logo" | "menu";
export type ListingMediaRightsStatus = "unknown" | "permission-confirmed" | "licensed" | "public-domain";

export type ListingMediaSource = {
  sourceName: string;
  sourceUrl?: string;
  sourceSnapshotSha256?: string;
  importedAt?: string;
  firstRecordedAt?: string;
  sourceCommit?: string;
};

export type ListingMediaRightsDeclaration = {
  sourceRef: string;
  sourceName: string;
  sourceUrl?: string;
  rightsStatus: Exclude<ListingMediaRightsStatus, "unknown">;
  rightsEvidence: string;
  licenseName?: string;
  licenseUrl?: string;
  attributionRequired?: boolean;
  attributionText?: string;
  attributionUrl?: string;
};

export type ListingMediaUsage = {
  listingSlug: string;
  kind: ListingMediaKind;
  sourceId?: string;
};

export type ListingMediaAsset = {
  url: string;
  sourceRef: string;
  usages: ListingMediaUsage[];
  publicationStatus: "quarantined" | "published";
  rightsStatus: ListingMediaRightsStatus;
  rightsEvidence?: string;
  licenseName?: string;
  licenseUrl?: string;
  attributionRequired?: boolean;
  attributionText?: string;
  attributionUrl?: string;
  lastValidatedAt?: string;
};

export type ListingMediaRegistry = {
  version: 1;
  sources: Record<string, ListingMediaSource>;
  assets: ListingMediaAsset[];
};

export function listingMediaUsages(listing: Listing): Array<{ url: string; kind: ListingMediaKind }> {
  return [
    ...listing.images.map((url) => ({ url, kind: "gallery" as const })),
    ...(listing.menuImages ?? []).map((url) => ({ url, kind: "menu" as const })),
    ...(listing.logo ? [{ url: listing.logo, kind: "logo" as const }] : [])
  ];
}

export function isApprovedListingMediaAsset(asset: ListingMediaAsset) {
  if (!asset.rightsEvidence?.trim()) return false;
  if (asset.rightsStatus === "unknown") return false;
  if (asset.rightsStatus === "licensed" && (!asset.licenseName?.trim() || !isHttpUrl(asset.licenseUrl))) return false;
  if (asset.attributionRequired && !asset.attributionText?.trim()) return false;
  if (asset.attributionUrl && !isHttpUrl(asset.attributionUrl)) return false;
  return true;
}

export function validateListingMediaRightsDeclaration(declaration: Partial<ListingMediaRightsDeclaration>) {
  const errors: string[] = [];
  if (!declaration.sourceRef?.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)) errors.push("--source-ref must be a lowercase hyphenated identifier");
  if (!declaration.sourceName?.trim()) errors.push("--source-name is required");
  if (declaration.sourceUrl && !isHttpUrl(declaration.sourceUrl)) errors.push("--source-url must use HTTP(S)");
  if (!declaration.rightsStatus || declaration.rightsStatus === ("unknown" as ListingMediaRightsStatus)) {
    errors.push("--rights-status must be permission-confirmed, licensed, or public-domain");
  }
  if (!declaration.rightsEvidence?.trim()) errors.push("--rights-evidence is required and must reference retained non-secret evidence");
  if (declaration.rightsStatus === "licensed" && !declaration.licenseName?.trim()) errors.push("--license-name is required for licensed media");
  if (declaration.rightsStatus === "licensed" && !isHttpUrl(declaration.licenseUrl)) errors.push("--license-url must use HTTP(S) for licensed media");
  if (declaration.attributionRequired && !declaration.attributionText?.trim()) errors.push("--attribution-text is required when attribution is required");
  if (declaration.attributionUrl && !isHttpUrl(declaration.attributionUrl)) errors.push("--attribution-url must use HTTP(S)");
  return errors;
}

function isHttpUrl(value?: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
