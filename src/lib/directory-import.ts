import path from "node:path";
import fs from "node:fs";
import { importRoleLabels, importRoleOptions, type ImportFieldRole } from "@/lib/import-roles";
import { cleanListingUrl } from "@/lib/listing-links";
import { buildListingDescriptions } from "@/lib/listing-description";
import { packListingSearchRecords } from "@/lib/listing-search-index";
import { packShortlistSummaries } from "@/lib/shortlist-index";
import { getAllShortlistListingSummaries } from "@/lib/shortlist";
import type { ListingSearchRecord } from "@/data/listing-search-records";
import { resolveListingEntitySourceId } from "@/data/listing-entity-resolutions";

export type ImportMode = "dry run" | "normal import" | "preview";

export type Row = Record<string, unknown>;

export { importRoleOptions, type ImportFieldRole };

type CountedValue = {
  label: string;
  count: number;
};

type InferredFilter = {
  header: string;
  uniqueValues: string[];
  valueCount: number;
};

type ImportAnalysis = {
  headers: string[];
  mapped: Record<string, string>;
  roleByHeader: Record<string, ImportFieldRole>;
  isOutscraper: boolean;
  skippedCount: number;
  duplicateCount: number;
  nonOperationalCount: number;
  inferredFilters: InferredFilter[];
  ignoredHeaders: string[];
  warnings: string[];
  categoryReview: MissingCategoryReviewItem[];
};

export type MappingReviewColumn = {
  header: string;
  samples: string[];
  detectedRole: ImportFieldRole;
  role: ImportFieldRole;
  confidence: "high" | "medium" | "low";
  filledCount: number;
  status: string;
};

export type ImportedListing = {
  name: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  description?: string;
  logo?: string;
  images: string[];
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
  provenance: {
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
  featured?: boolean;
  contact?: Record<string, unknown>;
  location?: Record<string, unknown>;
  details?: Record<string, unknown>;
};

export type ImportProvenanceOptions = {
  sourceName?: string;
  sourceUrl?: string;
  importedAt?: string;
};

type NewImportProvenance = {
  sourceName: string;
  sourceUrl?: string;
  importedAt: string;
  verificationStatus: "unverified";
};

export type ImportSummary = {
  sourceFile: string;
  provenanceSourceName: string;
  importedAt: string;
  verificationStatus: "unverified";
  sourceRows: number;
  importedListings: number;
  skippedRows: number;
  mode: ImportMode;
};

export type ImportReportData = {
  summary: ImportSummary;
  columnMapping: Record<string, string>;
  mappingReview: MappingReviewColumn[];
  sourceKind: "outscraper" | "generic";
  duplicateCount: number;
  nonOperationalCount: number;
  categories: CountedValue[];
  filters: {
    types: CountedValue[];
    areas: CountedValue[];
    neighborhoods: CountedValue[];
    dietary: CountedValue[];
    services: CountedValue[];
    offerings: CountedValue[];
    prices: CountedValue[];
    ratings: CountedValue[];
  };
  inferredFilters: InferredFilter[];
  ignoredColumns: string[];
  warnings: string[];
  previewListings: ImportedListing[];
};

export type MissingCategoryReviewItem = {
  rowNumber: number;
  name: string;
  slug?: string;
  area?: string;
  neighborhood?: string;
  reviewCount?: number;
  status: "source" | "inferred" | "manual_review";
  suggestedCategories: string[];
  evidence: string[];
};

type ListingSourceOverride = {
  name?: string;
  address?: string;
  postcode?: string;
  area?: string;
  neighborhood?: string;
  borough?: string;
  fullAddress?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  phoneAlt?: string;
};

export type ImportResult = {
  listings: ImportedListing[];
  report: string;
  reportData: ImportReportData;
  categoryReview: MissingCategoryReviewItem[];
  listingsFile: string;
  listingsJsonFile: string;
  listingSearchRecordsJsonFile: string;
  listingSearchIndexJsonFile: string;
  listingFilterCountsJsonFile: string;
  shortlistSummariesJsonFile: string;
  shortlistIndexJsonFile: string;
  sourceFile: string;
  rows: Row[];
};

export type SampleOptions = {
  size?: number;
};

const fieldAliases: Record<string, string[]> = {
  name: ["name", "business", "business name", "listing name", "restaurant name", "cafe name", "title"],
  slug: ["slug", "url slug", "permalink"],
  metaTitle: ["meta title", "seo title", "meta_restaurant name"],
  metaDescription: ["meta description", "seo description", "meta_description"],
  description: ["description", "summary", "business description"],
  logo: ["logo", "logo url", "brand image"],
  images: ["images", "image", "photo", "photos", "photo/images", "gallery"],
  category: [
    "category",
    "categories",
    "business category",
    "main category",
    "primary category",
    "coffee type",
    "cuisine",
    "cuisines",
    "cuisine type",
    "cuisine types"
  ],
  type: ["type", "types", "business type", "listing type", "restaurant type", "cafe type"],
  dietary: ["dietary", "dietary options", "food options"],
  services: ["service options", "services", "features", "amenities", "seating", "outdoor seating", "parking", "delivery", "opening style"],
  offerings: ["offerings", "products", "specialties", "specialities", "specialty", "speciality"],
  tags: ["tags", "keywords"],
  area: ["area", "district", "region"],
  neighborhood: ["neighborhood", "neighbourhood", "locality"],
  borough: ["borough", "county"],
  postcode: ["postcode", "post code", "zip", "zip code"],
  address: ["address", "street address"],
  fullAddress: ["full address"],
  city: ["city", "town"],
  website: ["website", "url", "site"],
  phone: ["phone", "telephone"],
  phoneAlt: ["phone 2", "phone_2", "alternate phone"],
  email: ["email"],
  contactUrl: ["contact", "contact us", "contact url"],
  rating: ["rating", "google rating", "review score", "score"],
  reviewCount: ["review count", "reviews", "google reviews"],
  price: ["range", "price", "price level", "price range"],
  orderOnlineUrl: ["order online", "order online url", "order url", "order_links"],
  reserveUrl: ["reserve a table", "reserve url", "booking url", "book url", "reservation_links"],
  appointmentUrl: ["book appointment", "appointment url", "booking_appointment_link"],
  menuUrl: ["menu", "menu link", "menu_link", "menu url"],
  latitude: ["latitude", "lat"],
  longitude: ["longitude", "lng", "long"],
  googleMapsUrl: ["google maps url", "maps url", "location_link"],
  sourceId: ["source id", "place id", "place_id", "google id", "google_id", "cid"],
  facebook: ["facebook"],
  instagram: ["instagram"],
  whatsapp: ["whatsapp"],
  tiktok: ["tiktok"],
  x: ["x", "twitter", "x ex twitter", "x (ex twitter)"],
  linkedin: ["linkedin"],
  youtube: ["youtube"],
  featured: ["featured", "highlighted"]
};

export function analyzeDirectoryFile(
  filePath: string,
  mode: ImportMode,
  roleOverrides?: Record<string, ImportFieldRole>,
  provenanceOptions?: ImportProvenanceOptions
): ImportResult {
  const sourceFile = path.basename(filePath);
  assertCsvSource(sourceFile);
  return analyzeRows(parseCsvRows(fs.readFileSync(filePath, "utf8")), sourceFile, mode, roleOverrides, provenanceOptions);
}

export function analyzeDirectoryBuffer(
  buffer: ArrayBuffer | Buffer,
  sourceFile: string,
  mode: ImportMode = "preview",
  roleOverrides?: Record<string, ImportFieldRole>,
  provenanceOptions?: ImportProvenanceOptions
) {
  assertCsvSource(sourceFile);
  const text = Buffer.isBuffer(buffer) ? buffer.toString("utf8") : Buffer.from(new Uint8Array(buffer)).toString("utf8");
  return analyzeRows(parseCsvRows(text), sourceFile, mode, roleOverrides, provenanceOptions);
}

export function analyzeDirectoryRows(
  rows: Row[],
  sourceFile: string,
  mode: ImportMode,
  roleOverrides?: Record<string, ImportFieldRole>,
  provenanceOptions?: ImportProvenanceOptions
): ImportResult {
  return analyzeRows(rows, sourceFile, mode, roleOverrides, provenanceOptions);
}

function analyzeRows(
  rows: Row[],
  sourceFile: string,
  mode: ImportMode,
  roleOverrides?: Record<string, ImportFieldRole>,
  provenanceOptions?: ImportProvenanceOptions
): ImportResult {
  const headers = Object.keys(rows[0] ?? {});
  const analysis = analyzeColumns(headers, rows, roleOverrides);
  const provenance = importProvenance(sourceFile, provenanceOptions);
  const listings: ImportedListing[] = [];
  const usedSlugs = new Map<string, number>();
  const listingBySourceId = new Map<string, ImportedListing>();

  rows.forEach((row, index) => {
    if (isRepeatedHeaderRow(row, headers)) {
      analysis.skippedCount += 1;
      analysis.warnings.push(`Row ${index + 2}: skipped repeated header row.`);
      return;
    }

    const sourceId = dedupeKey(row, analysis);
    const entitySourceId = resolveListingEntitySourceId(sourceId);
    if (isNonOperational(row, analysis)) {
      analysis.nonOperationalCount += 1;
      analysis.warnings.push(`Row ${index + 2}: "${firstByRole(row, analysis, "name") || "Listing"}" is not marked operational.`);
    }

    const listing = toListing(row, index, analysis, provenance, sourceId);
    if (!listing.name) {
      analysis.skippedCount += 1;
      analysis.warnings.push(`Row ${index + 2}: skipped because no listing name was found.`);
      return;
    }

    if (entitySourceId && listingBySourceId.has(entitySourceId)) {
      analysis.duplicateCount += 1;
      mergeDuplicateListing(listingBySourceId.get(entitySourceId)!, listing);
      const reason = entitySourceId === sourceId
        ? `duplicate source ID "${sourceId}"`
        : `confirmed entity alias "${sourceId}" -> "${entitySourceId}"`;
      analysis.warnings.push(`Row ${index + 2}: ${reason} was merged into the existing listing.`);
      return;
    }

    const baseSlug = listing.slug || stableSlug(listing.name, row, index, analysis);
    listing.slug = uniqueListingSlug(baseSlug, listing, usedSlugs, index, analysis);
    if (entitySourceId) listingBySourceId.set(entitySourceId, listing);

    addRowWarnings(row, index, listing, analysis);
    listings.push(listing);
  });

  const reportData = buildReportData(sourceFile, rows.length, listings, analysis, mode, rows, provenance);
  const report = renderReport(reportData);

  return {
    listings,
    report,
    reportData,
    categoryReview: analysis.categoryReview,
    listingsFile: renderListingsFile(),
    listingsJsonFile: renderListingsJsonFile(listings),
    listingSearchRecordsJsonFile: renderListingSearchRecordsJsonFile(listings),
    listingSearchIndexJsonFile: renderListingSearchIndexJsonFile(listings),
    listingFilterCountsJsonFile: renderListingFilterCountsJsonFile(listings),
    shortlistSummariesJsonFile: renderShortlistSummariesJsonFile(listings),
    shortlistIndexJsonFile: renderShortlistIndexJsonFile(listings),
    sourceFile,
    rows
  };
}

function analyzeColumns(headers: string[], rows: Row[], roleOverrides?: Record<string, ImportFieldRole>): ImportAnalysis {
  const mapped: Record<string, string> = {};
  const usedHeaders = new Set<string>();
  const warnings: string[] = [];
  const isOutscraper = detectOutscraper(headers);
  const roleByHeader = isOutscraper ? outscraperRoles(headers) : genericRoles(headers);

  Object.entries(roleOverrides ?? {}).forEach(([header, role]) => {
    if (headers.includes(header)) roleByHeader[header] = role;
  });

  Object.entries(fieldAliases).forEach(([field, aliases]) => {
    const header = findColumn(headers, aliases);
    if (header) {
      mapped[field] = header;
      usedHeaders.add(header);
    }
  });

  if (!mapped.category && mapped.type) mapped.category = mapped.type;
  applyRolesToMapped(mapped, roleByHeader);

  Object.entries(roleByHeader).forEach(([header, role]) => {
    if (role !== "ignore") usedHeaders.add(header);
  });
  headers.forEach((header) => {
    if (isManuallyHandledHeader(header)) usedHeaders.add(header);
  });
  const inferredFilters = inferFilterColumns(headers, rows, usedHeaders);
  inferredFilters.forEach((filter) => usedHeaders.add(filter.header));

  return {
    headers,
    mapped,
    roleByHeader,
    isOutscraper,
    skippedCount: 0,
    duplicateCount: 0,
    nonOperationalCount: 0,
    inferredFilters,
    ignoredHeaders: headers.filter((header) => !usedHeaders.has(header)),
    warnings,
    categoryReview: []
  };
}

function detectOutscraper(headers: string[]) {
  const keys = new Set(headers.map(normalizeKey));
  const matches = ["googleid", "placeid", "about", "locationlink", "reviews", "photo", "businessstatus"].filter((key) =>
    keys.has(key)
  );
  return matches.length >= 4;
}

function outscraperRoles(headers: string[]): Record<string, ImportFieldRole> {
  const roles = Object.fromEntries(headers.map((header) => [header, "ignore" as ImportFieldRole]));
  const roleForKey: Record<string, ImportFieldRole> = {
    name: "name",
    category: "category",
    type: "typeFilter",
    subtypes: "typeFilter",
    query: "area",
    address: "address",
    city: "city",
    postalcode: "postcode",
    phone: "phone",
    website: "website",
    email: "email",
    rating: "rating",
    reviews: "reviews",
    range: "price",
    photo: "image",
    streetview: "image",
    logo: "logo",
    latitude: "latitude",
    longitude: "longitude",
    locationlink: "mapReviewLink",
    reviewslink: "mapReviewLink",
    locationreviewslink: "mapReviewLink",
    workinghours: "workingHours",
    workinghourscsvcompatible: "workingHours",
    otherhours: "workingHours",
    verified: "verified",
    orderlinks: "actionLink",
    reservationlinks: "actionLink",
    bookingappointmentlink: "actionLink",
    menulink: "actionLink",
    about: "rawFeatureJson",
    placeid: "dedupeId",
    googleid: "dedupeId",
    cid: "dedupeId",
    businessstatus: "sourceStatus"
  };

  headers.forEach((header) => {
    const key = normalizeKey(header);
    roles[header] = roleForKey[key] ?? roles[header];
  });

  return roles;
}

function genericRoles(headers: string[]): Record<string, ImportFieldRole> {
  const roles = Object.fromEntries(headers.map((header) => [header, "ignore" as ImportFieldRole]));
  const roleByField: Record<string, ImportFieldRole> = {
    name: "name",
    slug: "slug",
    category: "category",
    type: "typeFilter",
    area: "area",
    neighborhood: "neighborhood",
    address: "address",
    fullAddress: "address",
    phone: "phone",
    website: "website",
    email: "email",
    images: "image",
    rating: "rating",
    reviewCount: "reviews",
    price: "price",
    description: "description",
    googleMapsUrl: "mapReviewLink",
    city: "city",
    postcode: "postcode",
    latitude: "latitude",
    longitude: "longitude",
    logo: "logo",
    sourceId: "dedupeId"
  };

  Object.entries(fieldAliases).forEach(([field, aliases]) => {
    const header = findColumn(headers, aliases);
    const role = roleByField[field];
    if (header && role) roles[header] = role;
  });

  headers.forEach((header) => {
    if (normalizeKey(header) === "areaservice") roles[header] = "ignore";
  });

  return roles;
}

function applyRolesToMapped(mapped: Record<string, string>, roleByHeader: Record<string, ImportFieldRole>) {
  const first = (role: ImportFieldRole) => Object.entries(roleByHeader).find(([, value]) => value === role)?.[0];
  const roleFields: Array<[string, ImportFieldRole]> = [
    ["name", "name"],
    ["slug", "slug"],
    ["category", "category"],
    ["type", "typeFilter"],
    ["area", "area"],
    ["neighborhood", "neighborhood"],
    ["address", "address"],
    ["phone", "phone"],
    ["website", "website"],
    ["email", "email"],
    ["images", "image"],
    ["rating", "rating"],
    ["reviewCount", "reviews"],
    ["price", "price"],
    ["description", "description"],
    ["googleMapsUrl", "mapReviewLink"],
    ["city", "city"],
    ["postcode", "postcode"],
    ["latitude", "latitude"],
    ["longitude", "longitude"],
    ["logo", "logo"]
  ];

  roleFields.forEach(([field, role]) => {
    const header = first(role);
    if (header) mapped[field] = header;
  });
}

function isManuallyHandledHeader(header: string) {
  return /^(google reviews link|working_hours|working_hours_csv_compatible|working_hours_old_format|business hours|service options|highlights|popular for|accessibility|offerings|dinning options|dining options|amenities|atmosphere|crowd|planning|payments|children|parking|pets|google verified|place_id|tube station|tube lines|tube distance \(m\)|walk from tube \(mins\)|night tube \(available\)|bus stop|bus routes|bus distance \(m\)|walk from bus \(mins\)|night line \(available\)|nearby park|park distance \(m\)|nearby place of worship|worship distance \(m\)|nearby shopping centre|shopping distance \(m\)|nearby cinema|cinema distance \(m\)|nearby museum|museum distance \(m\)|nearby theatre|theatre distance \(m\)|nearby tourist attraction|attraction distance \(m\)|nearby monument|monument distance \(m\)|nearby university|university distance \(m\)|nearby college|college distance \(m\)|nearby hospital|hospital distance \(m\)|nearby sports centre|sports distance \(m\))$/i.test(header);
}

function buildMappingReview(headers: string[], rows: Row[], analysis: ImportAnalysis): MappingReviewColumn[] {
  return headers.map((header) => {
    const role = analysis.roleByHeader[header] ?? "ignore";
    const values = rows.map((row) => valueAt(row, header)).filter(Boolean);
    const sampleValues = unique(values).slice(0, 3).map(shortSample);
    return {
      header,
      samples: sampleValues,
      detectedRole: role,
      role,
      confidence: mappingConfidence(header, role, analysis.isOutscraper),
      filledCount: values.length,
      status: mappingStatus(header, role, values.length)
    };
  });
}

function mappingConfidence(header: string, role: ImportFieldRole, isOutscraper: boolean): MappingReviewColumn["confidence"] {
  if (role === "ignore") return "low";
  if (isOutscraper && outscraperRoles([header])[header] === role) return "high";
  if (genericRoles([header])[header] === role) return "medium";
  return "low";
}

function mappingStatus(header: string, role: ImportFieldRole, filledCount: number) {
  if (!filledCount) return "Empty column";
  if (role === "ignore") return /company|contact|enrich|owner|verified|source/i.test(header) ? "Ignored enrichment/contact column" : "Ignored";
  if (role === "rawFeatureJson") return "Parses feature groups";
  if (role === "area" && normalizeKey(header) === "query") return "Extracts area from query text";
  if (role === "workingHours") return "Used for opening hours";
  if (role === "verified") return "Used for Google profile badge";
  if (role === "actionLink") return "Used for detail-page action buttons";
  return "Used";
}

function shortSample(value: string) {
  return value.length > 80 ? `${value.slice(0, 77)}...` : value;
}

function inferFilterColumns(headers: string[], rows: Row[], usedHeaders: Set<string>) {
  return headers
    .filter((header) => !usedHeaders.has(header))
    .map((header) => {
      const values = rows.flatMap((row) => list(valueAt(row, header))).filter(Boolean);
      const uniqueValues = unique(values);
      return { header, uniqueValues, valueCount: values.length };
    })
    .filter(({ header, uniqueValues, valueCount }) => {
      if (!valueCount || uniqueValues.length < 2 || uniqueValues.length > 40) return false;
      if (looksLikeLongTextColumn(header) || looksLikeUrlColumn(header)) return false;
      return looksLikeFilterHeader(header) || uniqueValues.length <= Math.max(12, Math.ceil(valueCount * 0.35));
    });
}

function toListing(
  row: Row,
  index: number,
  analysis: ImportAnalysis,
  provenance: NewImportProvenance,
  sourceId: string
): ImportedListing {
  const get = (field: string) => valueAt(row, analysis.mapped[field]);
  const sourceCategoryValues = unique([...valuesByRole(row, analysis, "category"), ...list(get("category"))]);
  const typeValues = unique([...valuesByRole(row, analysis, "typeFilter"), ...list(get("type"))]).filter((value) => !sourceCategoryValues.includes(value));
  const dietaryValues = list(get("dietary"));
  const inferredValues = analysis.inferredFilters.flatMap((filter) => list(valueAt(row, filter.header)));
  const aboutFeatures = featuresFromAbout(firstByRole(row, analysis, "rawFeatureJson"));
  const serviceValues = unique([...list(get("services")), ...aboutFeatures.serviceOptions, ...serviceLikeValues(row, analysis)]);
  const offeringValues = unique([...list(get("offerings")), ...aboutFeatures.offerings]);
  const categoryInference = inferMissingCategories(row, analysis, {
    sourceCategoryValues,
    typeValues,
    dietaryValues,
    serviceValues,
    offeringValues,
    rowNumber: index + 2
  });
  const categoryValues = categoryInference.categories;
  const tagValues = unique([
    ...categoryValues,
    ...typeValues,
    ...dietaryValues,
    ...serviceValues,
    ...offeringValues,
    ...inferredValues,
    ...list(get("tags"))
  ]);
  const address = get("address");
  const city = get("city");
  const postcode = get("postcode");
  const fullAddress = get("fullAddress") || [address, city, postcode].filter(Boolean).join(", ");
  const socials = compact({
    facebook: cleanListingUrl(get("facebook")),
    instagram: cleanListingUrl(get("instagram")),
    whatsapp: cleanListingUrl(get("whatsapp")),
    tiktok: cleanListingUrl(get("tiktok")),
    x: cleanListingUrl(get("x")),
    linkedin: cleanListingUrl(get("linkedin")),
    youtube: cleanListingUrl(get("youtube"))
  });

  const listing: ImportedListing = {
    name: get("name") || firstByRole(row, analysis, "name"),
    slug: stableSlug(get("slug") || firstByRole(row, analysis, "slug") || get("name"), row, index, analysis),
    metaTitle: get("metaTitle") || undefined,
    metaDescription: cleanListingText(get("metaDescription")) || undefined,
    description: "", // Placeholder, will be generated below
    logo: get("logo") || firstByRole(row, analysis, "logo") || undefined,
    images: unique([...list(get("images")), ...valuesByRole(row, analysis, "image")]),
    imageFallbackLabel: categoryValues[0] || typeValues[0] || "Listing",
    area: get("borough") || areaValue(row, analysis, get("area")) || undefined,
    neighborhood: areaValue(row, analysis, get("area")) || firstByRole(row, analysis, "neighborhood") || get("neighborhood") || undefined,
    borough: get("borough") || undefined,
    postcode: postcode || undefined,
    address: address || undefined,
    fullAddress: fullAddress || undefined,
    city: city || undefined,
    categories: categoryValues,
    listingTypes: typeValues,
    dietaryOptions: dietaryValues,
    tags: tagValues,
    priceLevel: normalizePrice(firstByRole(row, analysis, "price") || get("price")),
    rating: number(firstByRole(row, analysis, "rating") || get("rating")),
    reviewCount: number(firstByRole(row, analysis, "reviews") || get("reviewCount")),
    businessStatus: firstByRole(row, analysis, "sourceStatus") || undefined,
    provenance: {
      ...provenance,
      sourceId:
        sourceId ||
        firstByRole(row, analysis, "dedupeId") ||
        valueAt(row, "place_id") ||
        `${provenance.sourceName}#row=${index + 2}`
    },
    featured: truthy(get("featured")),
    contact: compact({
      website: cleanListingUrl(get("website")),
      phone: get("phone"),
      phoneAlt: get("phoneAlt"),
      email: get("email"),
      contactUrl: cleanListingUrl(get("contactUrl")),
      googleReviewsUrl: cleanListingUrl(valueAt(row, "Google Reviews Link") || valueAt(row, "reviews_link") || valueAt(row, "location_reviews_link")),
      orderOnlineUrl: cleanListingUrl(get("orderOnlineUrl")),
      reserveUrl: cleanListingUrl(get("reserveUrl")),
      appointmentUrl: cleanListingUrl(get("appointmentUrl")),
      menuUrl: cleanListingUrl(get("menuUrl")),
      socials
    }),
    location: compact({
      latitude: number(get("latitude")),
      longitude: number(get("longitude")),
      googleMapsUrl: cleanListingUrl(valueAt(row, "location_link") || get("googleMapsUrl") || firstByRole(row, analysis, "mapReviewLink")),
      tubeStation: placeValue(row, "Tube Station"),
      tubeLines: list(valueAt(row, "Tube Lines")),
      tubeDistanceMeters: number(valueAt(row, "Tube Distance (m)")),
      tubeWalkMinutes: number(valueAt(row, "Walk from Tube (mins)")),
      nightTubeAvailable: truthy(valueAt(row, "Night Tube (available)")),
      busStop: placeValue(row, "Bus Stop"),
      busRoutes: list(valueAt(row, "Bus Routes")),
      busDistanceMeters: number(valueAt(row, "Bus Distance (m)")),
      busWalkMinutes: number(valueAt(row, "Walk from Bus (mins)")),
      nightBusAvailable: truthy(valueAt(row, "Night Line (available)")),
      nearbyPlaces: nearbyPlaces(row)
    }),
    details: compact({
      workingHours: parseWorkingHours(valueAt(row, "working_hours")),
      workingHoursText: valueAt(row, "working_hours_csv_compatible") || valueAt(row, "other_hours"),
      serviceOptions: serviceValues,
      highlights: unique([...listByHeader(row, /^highlights$/i), ...aboutFeatures.highlights]),
      offerings: offeringValues,
      amenities: unique([...listByHeader(row, /amenit/i), ...aboutFeatures.amenities]),
      atmosphere: unique([...listByHeader(row, /^atmosphere$/i), ...aboutFeatures.atmosphere]),
      popularFor: unique([...listByHeader(row, /^popular for$/i), ...aboutFeatures.popularFor]),
      accessibility: unique([...listByHeader(row, /^accessibility$/i), ...aboutFeatures.accessibility]),
      diningOptions: unique([...listByHeader(row, /^dinning options$|^dining options$/i), ...aboutFeatures.diningOptions]),
      crowd: unique([...listByHeader(row, /^crowd$/i), ...aboutFeatures.crowd]),
      planning: unique([...listByHeader(row, /^planning$/i), ...aboutFeatures.planning]),
      payments: unique([...listByHeader(row, /^payments$/i), ...aboutFeatures.payments]),
      children: unique([...listByHeader(row, /^children$/i), ...aboutFeatures.children]),
      parking: unique([...listByHeader(row, /parking/i), ...aboutFeatures.parking]),
      pets: unique([...listByHeader(row, /^pets$/i), ...aboutFeatures.pets]),
      googleVerified: truthy(valueAt(row, "Google Verified") || valueAt(row, "verified")),
      placeId: firstByRole(row, analysis, "dedupeId") || valueAt(row, "place_id")
    })
  };
  applyListingSourceOverride(listing);

  const generatedDescriptions = buildListingDescriptions(listing);
  listing.description = generatedDescriptions.description;
  listing.metaDescription = generatedDescriptions.metaDescription;
  if (categoryInference.review) {
    categoryInference.review.slug = listing.slug;
    categoryInference.review.area = listing.area;
    categoryInference.review.neighborhood = listing.neighborhood;
    categoryInference.review.reviewCount = listing.reviewCount;
    analysis.categoryReview.push(categoryInference.review);
  }
  return listing;
}

const LISTING_SOURCE_OVERRIDES: Record<string, ListingSourceOverride> = {
  ChIJocOA2Stm2qoRoXP2Vrhu6T4: {
    name: "Yummy Dosa",
    address: "68 Cranbrook Rd",
    postcode: "IG1 4NH",
    area: "Redbridge",
    neighborhood: "Ilford",
    borough: "Redbridge",
    fullAddress: "68 Cranbrook Rd, Ilford, IG1 4NH, London",
    latitude: 51.5606646,
    longitude: 0.0697829,
    phone: "+44 20 8637 3026",
    phoneAlt: "+44 7776 675146"
  },
  ChIJDQ9xSacEdkgRIXfW2iPUYkQ: {
    address: "6 Trinity Street",
    postcode: "SE1 1DB",
    area: "Southwark",
    neighborhood: "The Borough",
    borough: "Southwark",
    fullAddress: "6 Trinity Street, The Borough, SE1 1DB, London",
    latitude: 51.4996898,
    longitude: -0.0951699
  }
};

function applyListingSourceOverride(listing: ImportedListing) {
  const placeId = typeof listing.details?.placeId === "string" ? listing.details.placeId : "";
  const override = LISTING_SOURCE_OVERRIDES[placeId];
  if (!override) return;

  if (override.name) listing.name = override.name;
  if (override.address) listing.address = override.address;
  if (override.postcode) listing.postcode = override.postcode;
  if (override.area) listing.area = override.area;
  if (override.neighborhood) listing.neighborhood = override.neighborhood;
  if (override.borough) listing.borough = override.borough;
  if (override.fullAddress) listing.fullAddress = override.fullAddress;

  listing.location = {
    ...(listing.location ?? {}),
    ...(override.latitude !== undefined ? { latitude: override.latitude } : {}),
    ...(override.longitude !== undefined ? { longitude: override.longitude } : {})
  };

  listing.contact = {
    ...(listing.contact ?? {}),
    ...(override.phone ? { phone: override.phone } : {}),
    ...(override.phoneAlt ? { phoneAlt: override.phoneAlt } : {})
  };
}

export function mergeDuplicateListing(target: ImportedListing, duplicate: ImportedListing) {
  target.categories = unique([...target.categories, ...duplicate.categories]);
  target.listingTypes = unique([...target.listingTypes, ...duplicate.listingTypes]);
  target.dietaryOptions = unique([...target.dietaryOptions, ...duplicate.dietaryOptions]);
  target.tags = unique([...target.tags, ...duplicate.tags]);

  if (duplicate.neighborhood) target.neighborhood = duplicate.neighborhood;
  target.area ||= duplicate.area;
  target.borough ||= duplicate.borough;
  target.postcode ||= duplicate.postcode;
  target.address ||= duplicate.address;
  target.fullAddress ||= duplicate.fullAddress;
  target.city ||= duplicate.city;
  target.priceLevel ||= duplicate.priceLevel;
  target.rating ||= duplicate.rating;
  target.reviewCount ||= duplicate.reviewCount;
  target.logo ||= duplicate.logo;
  target.images = unique([...target.images, ...duplicate.images]);

  target.contact = compact({
    ...(target.contact ?? {}),
    ...(duplicate.contact?.website ? { website: duplicate.contact.website } : {}),
    phone: target.contact?.phone ?? duplicate.contact?.phone,
    phoneAlt: target.contact?.phoneAlt ?? duplicate.contact?.phoneAlt,
    email: target.contact?.email ?? duplicate.contact?.email,
    contactUrl: target.contact?.contactUrl ?? duplicate.contact?.contactUrl,
    googleReviewsUrl: target.contact?.googleReviewsUrl ?? duplicate.contact?.googleReviewsUrl,
    orderOnlineUrl: duplicate.contact?.orderOnlineUrl ?? target.contact?.orderOnlineUrl,
    reserveUrl: duplicate.contact?.reserveUrl ?? target.contact?.reserveUrl,
    appointmentUrl: duplicate.contact?.appointmentUrl ?? target.contact?.appointmentUrl,
    menuUrl: duplicate.contact?.menuUrl ?? target.contact?.menuUrl,
    socials: compact({
      ...((target.contact?.socials as Record<string, unknown> | undefined) ?? {}),
      ...((duplicate.contact?.socials as Record<string, unknown> | undefined) ?? {})
    })
  });

  target.location = compact({
    ...(target.location ?? {}),
    latitude: target.location?.latitude ?? duplicate.location?.latitude,
    longitude: target.location?.longitude ?? duplicate.location?.longitude,
    googleMapsUrl: target.location?.googleMapsUrl ?? duplicate.location?.googleMapsUrl,
    tubeStation: target.location?.tubeStation ?? duplicate.location?.tubeStation,
    tubeLines: unique([
      ...asStringArray(target.location?.tubeLines),
      ...asStringArray(duplicate.location?.tubeLines)
    ]),
    tubeDistanceMeters: target.location?.tubeDistanceMeters ?? duplicate.location?.tubeDistanceMeters,
    tubeWalkMinutes: target.location?.tubeWalkMinutes ?? duplicate.location?.tubeWalkMinutes,
    nightTubeAvailable: target.location?.nightTubeAvailable ?? duplicate.location?.nightTubeAvailable,
    busStop: target.location?.busStop ?? duplicate.location?.busStop,
    busRoutes: unique([
      ...asStringArray(target.location?.busRoutes),
      ...asStringArray(duplicate.location?.busRoutes)
    ]),
    busDistanceMeters: target.location?.busDistanceMeters ?? duplicate.location?.busDistanceMeters,
    busWalkMinutes: target.location?.busWalkMinutes ?? duplicate.location?.busWalkMinutes,
    nightBusAvailable: target.location?.nightBusAvailable ?? duplicate.location?.nightBusAvailable,
    nearbyPlaces: target.location?.nearbyPlaces ?? duplicate.location?.nearbyPlaces
  });

  target.details = compact({
    ...(target.details ?? {}),
    workingHours: target.details?.workingHours ?? duplicate.details?.workingHours,
    workingHoursText: target.details?.workingHoursText ?? duplicate.details?.workingHoursText,
    serviceOptions: unique([
      ...asStringArray(target.details?.serviceOptions),
      ...asStringArray(duplicate.details?.serviceOptions)
    ]),
    highlights: unique([...asStringArray(target.details?.highlights), ...asStringArray(duplicate.details?.highlights)]),
    offerings: unique([...asStringArray(target.details?.offerings), ...asStringArray(duplicate.details?.offerings)]),
    amenities: unique([...asStringArray(target.details?.amenities), ...asStringArray(duplicate.details?.amenities)]),
    atmosphere: unique([...asStringArray(target.details?.atmosphere), ...asStringArray(duplicate.details?.atmosphere)]),
    popularFor: unique([...asStringArray(target.details?.popularFor), ...asStringArray(duplicate.details?.popularFor)]),
    accessibility: unique([...asStringArray(target.details?.accessibility), ...asStringArray(duplicate.details?.accessibility)]),
    diningOptions: unique([...asStringArray(target.details?.diningOptions), ...asStringArray(duplicate.details?.diningOptions)]),
    crowd: unique([...asStringArray(target.details?.crowd), ...asStringArray(duplicate.details?.crowd)]),
    planning: unique([...asStringArray(target.details?.planning), ...asStringArray(duplicate.details?.planning)]),
    payments: unique([...asStringArray(target.details?.payments), ...asStringArray(duplicate.details?.payments)]),
    children: unique([...asStringArray(target.details?.children), ...asStringArray(duplicate.details?.children)]),
    parking: unique([...asStringArray(target.details?.parking), ...asStringArray(duplicate.details?.parking)]),
    pets: unique([...asStringArray(target.details?.pets), ...asStringArray(duplicate.details?.pets)]),
    googleVerified: target.details?.googleVerified ?? duplicate.details?.googleVerified,
    placeId: target.details?.placeId ?? duplicate.details?.placeId
  });

  const generatedDescriptions = buildListingDescriptions(target);
  target.description = generatedDescriptions.description;
  target.metaDescription = generatedDescriptions.metaDescription;
}

type CategoryInferenceInput = {
  sourceCategoryValues: string[];
  typeValues: string[];
  dietaryValues: string[];
  serviceValues: string[];
  offeringValues: string[];
  rowNumber: number;
};

function inferMissingCategories(row: Row, analysis: ImportAnalysis, input: CategoryInferenceInput) {
  if (input.sourceCategoryValues.length) {
    return {
      categories: input.sourceCategoryValues,
      review: undefined as MissingCategoryReviewItem | undefined
    };
  }

  const name = firstByRole(row, analysis, "name") || valueAt(row, analysis.mapped.name) || "Listing";
  const text = categoryEvidenceText(row, analysis, input);
  const evidence: string[] = [];
  const suggestedCategories: string[] = [];

  function add(category: string, reason: string) {
    if (!suggestedCategories.includes(category)) suggestedCategories.push(category);
    if (!evidence.includes(reason)) evidence.push(reason);
  }

  if (/\b(dosa|chennai|tamil|malabar|kerala|sri\s*lalitha|srilalitha|idli|uttapam|uttapam|uttappam)\b/i.test(text)) {
    add("South Indian", "South Indian wording in name or listing text");
    add("Indian", "South Indian is part of Indian cuisine");
  } else if (/\b(indian|indiya|tandoori|curry|masala|biryani|balti|naan|dhaba|chaat|samosa|saffron|spice|spices|coriander|papadom|papadoms|tiffin|madras|bombay|delhi|bhavan|nawaab|nawab|namaste|maharaja|mahal|khushboo|kushboo|voujon|mirch|mirchi|roti|thali|vada pav|chapati)\b/i.test(text)) {
    add("Indian", "Indian cuisine wording in name or listing text");
  }

  if (/\b(punjab|punjabi|bhangra)\b/i.test(text)) {
    add("Indian", "Punjabi cuisine wording in name or listing text");
    add("Punjabi", "Punjabi cuisine wording in name or listing text");
  }
  if (/\b(bangla|bangladeshi|bengal|sylhet|surma|purbani)\b/i.test(text)) {
    add("Bangladeshi", "Bangladeshi cuisine wording in name or listing text");
  }
  if (/\b(nepal|nepalese|momo|momos|gurkha)\b/i.test(text)) {
    add("Nepalese", "Nepalese cuisine wording in name or listing text");
  }
  if (/\b(sri lanka|sri-lankan|srilankan|kothu)\b/i.test(text)) {
    add("Sri Lankan", "Sri Lankan cuisine wording in name or listing text");
  }
  if (/\b(qasr|kebab|shawarma|lebanese|persian|turkish|arabic|arab|middle eastern)\b/i.test(text)) {
    add("Middle Eastern", "Middle Eastern cuisine wording in name or listing text");
  }
  if (/\b(caribbean|jamaican|jerk)\b/i.test(text)) {
    add("Caribbean", "Caribbean cuisine wording in name or listing text");
  }

  const review: MissingCategoryReviewItem = {
    rowNumber: input.rowNumber,
    name,
    status: suggestedCategories.length ? "inferred" : "manual_review",
    suggestedCategories,
    evidence: suggestedCategories.length ? evidence : ["Source Cuisine Type is blank and no conservative cuisine rule matched"]
  };

  return {
    categories: suggestedCategories,
    review
  };
}

function categoryEvidenceText(row: Row, analysis: ImportAnalysis, input: CategoryInferenceInput) {
  void input;
  return [
    firstByRole(row, analysis, "name"),
    valueAt(row, analysis.mapped.name)
  ]
    .filter(Boolean)
    .join(" ");
}

export function selectCuratedRestaurantSample(items: ImportedListing[], options: SampleOptions = {}) {
  const size = options.size ?? 120;
  const selected = new Map<string, ImportedListing>();
  const sorted = [...items].sort(
    (a, b) =>
      Number(Boolean(b.images.length)) - Number(Boolean(a.images.length)) ||
      Number(b.rating ?? 0) - Number(a.rating ?? 0) ||
      Number(b.reviewCount ?? 0) - Number(a.reviewCount ?? 0)
  );

  addDiverseItems(selected, sorted, (item) => item.area, size);
  addDiverseItems(selected, sorted, (item) => item.categories[0], size);
  addDiverseItems(selected, sorted, (item) => item.listingTypes[0], size);
  addDiverseItems(selected, sorted, (item) => item.priceLevel, size);
  addDiverseItems(selected, sorted, (item) => item.dietaryOptions[0], size);
  addDiverseItems(selected, sorted, (item) => asStringArray(item.details?.serviceOptions)[0], size);

  sorted.forEach((item) => {
    if (selected.size < size) selected.set(item.slug, item);
  });

  return [...selected.values()].slice(0, size);
}

function addDiverseItems(
  selected: Map<string, ImportedListing>,
  items: ImportedListing[],
  keyForItem: (item: ImportedListing) => string | undefined,
  limit: number
) {
  const seen = new Set<string>();
  items.forEach((item) => {
    if (selected.size >= limit) return;
    const key = keyForItem(item);
    if (!key || seen.has(key)) return;
    seen.add(key);
    selected.set(item.slug, item);
  });
}

function isRepeatedHeaderRow(row: Row, headers: string[]) {
  const filled = headers.filter((header) => valueAt(row, header));
  if (!filled.length) return false;
  const matching = filled.filter((header) => normalizeKey(valueAt(row, header)) === normalizeKey(header));
  return matching.length >= Math.min(4, filled.length) || matching.length / filled.length >= 0.75;
}

function nearbyPlaces(row: Row) {
  const pairs: Array<[string, string, string]> = [
    ["Park", "Nearby Park", "Park Distance (m)"],
    ["Place of worship", "Nearby Place of Worship", "Worship Distance (m)"],
    ["Shopping centre", "Nearby Shopping Centre", "Shopping Distance (m)"],
    ["Cinema", "Nearby Cinema", "Cinema Distance (m)"],
    ["Museum", "Nearby Museum", "Museum Distance (m)"],
    ["Theatre", "Nearby Theatre", "Theatre Distance (m)"],
    ["Tourist attraction", "Nearby Tourist Attraction", "Attraction Distance (m)"],
    ["Monument", "Nearby Monument", "Monument Distance (m)"],
    ["University", "Nearby University", "University Distance (m)"],
    ["College", "Nearby College", "College Distance (m)"],
    ["Hospital", "Nearby Hospital", "Hospital Distance (m)"],
    ["Sports centre", "Nearby Sports Centre", "Sports Distance (m)"]
  ];

  return pairs
    .map(([label, nameHeader, distanceHeader]) => ({
      label,
      name: placeValue(row, nameHeader),
      distanceMeters: number(valueAt(row, distanceHeader))
    }))
    .filter((place) => place.name);
}

function placeValue(row: Row, header: string) {
  const value = valueAt(row, header);
  return /^(none|none nearby|n\/a|na|not available)$/i.test(value) ? "" : value;
}

function parseWorkingHours(value: string) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as Record<string, string[] | string>;
    return Object.entries(parsed)
      .map(([day, hours]) => ({
        day,
        hours: Array.isArray(hours) ? hours.join(", ") : String(hours)
      }))
      .filter((item) => item.day && item.hours);
  } catch {
    return value
      .split(/;\s*/)
      .map((item) => {
        const [day, ...hours] = item.split(/:\s*/);
        return { day: day?.trim(), hours: hours.join(": ").trim() };
      })
      .filter((item) => item.day && item.hours);
  }
}

function cleanListingText(value: string) {
  return value
    .replace(/\s*Near None nearby Underground Station\./gi, "")
    .replace(/\s*It is located near None nearby Underground Station\./gi, "")
    .replace(/\s*Visitors can easily reach the restaurant via None nearby Underground Station\./gi, "")
    .replace(/\s*The venue is conveniently close to None nearby Station\./gi, "")
    .replace(/\s*The restaurant is within walking distance of None nearby Station\./gi, "")
    .replace(/near None nearby Underground Station/gi, "near public transport")
    .replace(/via None nearby Underground Station/gi, "via public transport")
    .replace(/close to None nearby Station/gi, "close to public transport")
    .replace(/within walking distance of None nearby Station/gi, "accessible by public transport")
    .replace(/Highlights include \.\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function valuesByRole(row: Row, analysis: ImportAnalysis, role: ImportFieldRole) {
  return unique(
    Object.entries(analysis.roleByHeader)
      .filter(([, mappedRole]) => mappedRole === role)
      .flatMap(([header]) => list(valueAt(row, header)))
  );
}

function firstByRole(row: Row, analysis: ImportAnalysis, role: ImportFieldRole) {
  const header = Object.entries(analysis.roleByHeader).find(([, mappedRole]) => mappedRole === role)?.[0];
  return valueAt(row, header);
}

function areaValue(row: Row, analysis: ImportAnalysis, fallback: string) {
  const areaHeader = Object.entries(analysis.roleByHeader).find(([, role]) => role === "area")?.[0];
  const raw = valueAt(row, areaHeader);
  if (!raw) return fallback;
  if (/^(true|false|yes|no)$/i.test(raw)) return fallback;
  if (normalizeKey(areaHeader ?? "") === "query") return extractAreaFromQuery(raw) || fallback;
  return raw;
}

function extractAreaFromQuery(value: string) {
  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[1];
  return parts[0] ?? "";
}

function featuresFromAbout(value: string) {
  const empty = {
    serviceOptions: [] as string[],
    amenities: [] as string[],
    offerings: [] as string[],
    diningOptions: [] as string[],
    atmosphere: [] as string[],
    crowd: [] as string[],
    children: [] as string[],
    pets: [] as string[],
    parking: [] as string[],
    accessibility: [] as string[],
    popularFor: [] as string[],
    planning: [] as string[],
    payments: [] as string[],
    highlights: [] as string[]
  };
  if (!value) return empty;

  try {
    const parsed = JSON.parse(value) as Record<string, Record<string, unknown>>;
    Object.entries(parsed).forEach(([group, fields]) => {
      const bucket = featureBucket(group);
      if (!bucket) return;
      const labels = Object.entries(fields ?? {})
        .filter(([, enabled]) => enabled === true || String(enabled).toLowerCase() === "true")
        .map(([label]) => label.trim())
        .filter(Boolean);
      empty[bucket] = unique([...empty[bucket], ...labels]);
    });
  } catch {
    return empty;
  }

  return empty;
}

function featureBucket(group: string): keyof ReturnType<typeof featuresFromAbout> | undefined {
  const normalized = normalizeGreekKey(group);
  if (normalized.includes("επιλογεσεξυπηρετηση") || /service/i.test(group)) return "serviceOptions";
  if (normalized.includes("παροχεσ") || /amenit/i.test(group)) return "amenities";
  if (normalized.includes("προσφορεσ") || /offer/i.test(group)) return "offerings";
  if (normalized.includes("επιλογεσγευματο") || /dining/i.test(group)) return "diningOptions";
  if (normalized.includes("ατμοσφαιρα") || /atmosphere/i.test(group)) return "atmosphere";
  if (normalized.includes("πελατεσ") || /crowd/i.test(group)) return "crowd";
  if (normalized.includes("παιδια") || /children/i.test(group)) return "children";
  if (normalized.includes("κατοικιδια") || /pet/i.test(group)) return "pets";
  if (normalized.includes("χωροισταθμευση") || /parking/i.test(group)) return "parking";
  if (normalized.includes("προσβασιμοτητα") || /access/i.test(group)) return "accessibility";
  if (normalized.includes("δημοφιλεσγια") || /popular/i.test(group)) return "popularFor";
  if (normalized.includes("σχεδιασμο") || /planning/i.test(group)) return "planning";
  if (normalized.includes("πληρωμεσ") || /payment/i.test(group)) return "payments";
  if (normalized.includes("σημαντικοτερα") || /highlight/i.test(group)) return "highlights";
  return undefined;
}

function dedupeKey(row: Row, analysis: ImportAnalysis) {
  const sourceIds = Object.entries(analysis.roleByHeader)
    .filter(([header, role]) => role === "dedupeId" && /place_id|google_id|cid/i.test(header))
    .map(([header]) => valueAt(row, header))
    .filter(Boolean);
  if (sourceIds[0]) return sourceIds[0];
  const name = firstByRole(row, analysis, "name");
  const address = firstByRole(row, analysis, "address") || valueAt(row, analysis.mapped.address);
  return name && address ? `${normalizeKey(transliterateGreek(name))}:${normalizeKey(transliterateGreek(address))}` : "";
}

function isNonOperational(row: Row, analysis: ImportAnalysis) {
  const status = firstByRole(row, analysis, "sourceStatus");
  return Boolean(status && !/^operational$/i.test(status));
}

function stableSlug(value: string, row: Row, index: number, analysis: ImportAnalysis) {
  const slug = slugify(value);
  if (slug && slug.length >= 3 && !/^(i-?)+$/.test(slug)) return slug;
  const sourceId = firstByRole(row, analysis, "dedupeId") || valueAt(row, "place_id") || valueAt(row, "google_id") || valueAt(row, "cid");
  const sourceSlug = slugify(sourceId);
  return sourceSlug ? `listing-${sourceSlug}` : `listing-${index + 1}`;
}

function uniqueListingSlug(
  baseSlug: string,
  listing: ImportedListing,
  usedSlugs: Map<string, number>,
  index: number,
  analysis: ImportAnalysis
) {
  const candidates = unique([
    baseSlug,
    listing.area ? `${baseSlug}-${slugify(listing.area)}` : "",
    listing.neighborhood ? `${baseSlug}-${slugify(listing.neighborhood)}` : "",
    listing.area && listing.neighborhood ? `${baseSlug}-${slugify(listing.area)}-${slugify(listing.neighborhood)}` : ""
  ]).filter(Boolean);

  const available = candidates.find((candidate) => !usedSlugs.has(candidate));
  if (available) {
    usedSlugs.set(available, 1);
    if (available !== baseSlug) {
      analysis.warnings.push(`Row ${index + 2}: duplicate slug "${baseSlug}" changed to "${available}".`);
    }
    return available;
  }

  const duplicateCount = usedSlugs.get(baseSlug) ?? 1;
  let fallback = `${baseSlug}-${duplicateCount + 1}`;
  while (usedSlugs.has(fallback)) {
    fallback = `${baseSlug}-${(usedSlugs.get(baseSlug) ?? duplicateCount) + 1}`;
    usedSlugs.set(baseSlug, (usedSlugs.get(baseSlug) ?? duplicateCount) + 1);
  }
  usedSlugs.set(baseSlug, (usedSlugs.get(baseSlug) ?? duplicateCount) + 1);
  usedSlugs.set(fallback, 1);
  analysis.warnings.push(`Row ${index + 2}: duplicate slug "${baseSlug}" changed to "${fallback}".`);
  return fallback;
}

function serviceLikeValues(row: Row, analysis: ImportAnalysis) {
  return analysis.inferredFilters
    .filter((filter) => /service|feature|amenit|seating|parking|delivery|opening/i.test(filter.header))
    .flatMap((filter) => list(valueAt(row, filter.header)));
}

function addRowWarnings(row: Row, index: number, listing: ImportedListing, analysis: ImportAnalysis) {
  const rowNumber = index + 2;
  if (!listing.categories.length) analysis.warnings.push(`Row ${rowNumber}: "${listing.name}" has no category values.`);
  if (!listing.images.length) analysis.warnings.push(`Row ${rowNumber}: "${listing.name}" has no images.`);
  warnInvalidNumber(row, analysis, "rating", rowNumber, listing.name, "rating");
  warnInvalidNumber(row, analysis, "reviewCount", rowNumber, listing.name, "review count");
  if (analysis.mapped.price && valueAt(row, analysis.mapped.price) && !listing.priceLevel) {
    analysis.warnings.push(`Row ${rowNumber}: "${listing.name}" has an unrecognized price value "${valueAt(row, analysis.mapped.price)}".`);
  }
}

function warnInvalidNumber(row: Row, analysis: ImportAnalysis, field: string, rowNumber: number, name: string, label: string) {
  const header = analysis.mapped[field];
  const raw = valueAt(row, header);
  if (raw && number(raw) === undefined) {
    analysis.warnings.push(`Row ${rowNumber}: "${name}" has an invalid ${label} value "${raw}".`);
  }
}

function buildReportData(
  sourceFile: string,
  sourceCount: number,
  items: ImportedListing[],
  analysis: ImportAnalysis,
  mode: ImportMode,
  rows: Row[],
  provenance: NewImportProvenance
): ImportReportData {
  return {
    summary: {
      sourceFile,
      provenanceSourceName: provenance.sourceName,
      importedAt: provenance.importedAt,
      verificationStatus: provenance.verificationStatus,
      sourceRows: sourceCount,
      importedListings: items.length,
      skippedRows: analysis.skippedCount,
      mode
    },
    columnMapping: analysis.mapped,
    mappingReview: buildMappingReview(analysis.headers, rows, analysis),
    sourceKind: analysis.isOutscraper ? "outscraper" : "generic",
    duplicateCount: analysis.duplicateCount,
    nonOperationalCount: analysis.nonOperationalCount,
    categories: countValues(items.flatMap((item) => item.categories)),
    filters: {
      types: countValues(items.flatMap((item) => item.listingTypes)),
      areas: countValues(items.map((item) => item.area)),
      neighborhoods: countValues(items.map((item) => item.neighborhood)),
      dietary: countValues(items.flatMap((item) => item.dietaryOptions)),
      services: countValues(items.flatMap((item) => allFeatureValues(item))),
      offerings: countValues(items.flatMap((item) => asStringArray(item.details?.offerings))),
      prices: countValues(items.map((item) => item.priceLevel)),
      ratings: countValues(items.map((item) => item.rating?.toString()))
    },
    inferredFilters: analysis.inferredFilters,
    ignoredColumns: analysis.ignoredHeaders,
    warnings: analysis.warnings,
    previewListings: items.slice(0, 6)
  };
}

export function renderReport(data: ImportReportData) {
  return `# Import Report

- Source file: ${data.summary.sourceFile}
- Provenance source name: ${data.summary.provenanceSourceName}
- Imported at: ${data.summary.importedAt}
- Initial verification status: ${data.summary.verificationStatus}
- Source rows: ${data.summary.sourceRows}
- Imported listings: ${data.summary.importedListings}
- Skipped rows: ${data.summary.skippedRows}
- Mode: ${data.summary.mode}
- Source type: ${data.sourceKind === "outscraper" ? "Outscraper export" : "Generic CSV"}
- Duplicate rows merged: ${data.duplicateCount}
- Non-operational rows flagged: ${data.nonOperationalCount}

## Column Mapping

${renderMappings(data.columnMapping)}

## Field Mapping Review

${data.mappingReview.map((column) => `- ${column.header}: ${roleLabel(column.role)} (${column.confidence} confidence, ${column.filledCount} filled)`).join("\n") || "- No columns found"}

## Detected Filter Values

${renderValueGroup("Categories", data.categories)}
${renderValueGroup("Types", data.filters.types)}
${renderValueGroup("Areas", data.filters.areas)}
${renderValueGroup("Neighborhoods", data.filters.neighborhoods)}
${renderValueGroup("Dietary Options", data.filters.dietary)}
${renderValueGroup("Services and Features", data.filters.services)}
${renderValueGroup("Offerings", data.filters.offerings)}
${renderValueGroup("Prices", data.filters.prices)}
${renderValueGroup("Ratings", data.filters.ratings)}

## Inferred Extra Filter Columns

${data.inferredFilters.length ? data.inferredFilters.map((filter) => `- ${filter.header}: ${filter.uniqueValues.slice(0, 8).join(", ")}${filter.uniqueValues.length > 8 ? "..." : ""}`).join("\n") : "- None"}

## Ignored Columns

${data.ignoredColumns.length ? data.ignoredColumns.map((header) => `- ${header}`).join("\n") : "- None"}

## Warnings

${data.warnings.length ? data.warnings.slice(0, 80).map((warning) => `- ${warning}`).join("\n") : "- None"}
${data.warnings.length > 80 ? `\n- ${data.warnings.length - 80} more warnings not shown.` : ""}

Generated by \`npm run import:directory\`.
`;
}

export function renderMissingCategoryReview(items: MissingCategoryReviewItem[]) {
  const inferred = items.filter((item) => item.status === "inferred");
  const manualReview = items.filter((item) => item.status === "manual_review");
  const sorted = [...items].sort(
    (a, b) =>
      statusWeight(a.status) - statusWeight(b.status) ||
      Number(b.reviewCount ?? 0) - Number(a.reviewCount ?? 0) ||
      a.rowNumber - b.rowNumber
  );

  return `# Missing Category Review

This file is generated by \`npm run import:directory\`.

It only covers rows where the source category column was blank. High-confidence
matches are inferred from stable cuisine wording in the restaurant name or
listing text. Unclear rows stay uncategorized and require manual review.

## Summary

- Rows with blank source category: ${items.length.toLocaleString()}
- Categories inferred: ${inferred.length.toLocaleString()}
- Manual review required: ${manualReview.length.toLocaleString()}

## Review Rows

| Row | Status | Listing | Area | Reviews | Suggested categories | Evidence |
| --- | --- | --- | --- | ---: | --- | --- |
${sorted.length ? sorted.map(renderMissingCategoryReviewRow).join("\n") : "| - | - | - | - | - | - | - |"}
`;
}

function renderMissingCategoryReviewRow(item: MissingCategoryReviewItem) {
  return [
    item.rowNumber.toString(),
    item.status,
    escapeMarkdownTable(item.name),
    escapeMarkdownTable([item.neighborhood, item.area].filter(Boolean).join(", ") || "-"),
    item.reviewCount?.toLocaleString() ?? "-",
    escapeMarkdownTable(item.suggestedCategories.join(", ") || "-"),
    escapeMarkdownTable(item.evidence.join("; "))
  ]
    .map((value) => ` ${value} `)
    .join("|")
    .replace(/^/, "|")
    .replace(/$/, "|");
}

function statusWeight(status: MissingCategoryReviewItem["status"]) {
  if (status === "manual_review") return 0;
  if (status === "inferred") return 1;
  return 2;
}

function escapeMarkdownTable(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

export function renderReportForListings(data: ImportReportData, items: ImportedListing[], _modeLabel?: string): ImportReportData {
  void _modeLabel;
  return {
    ...data,
    summary: {
      ...data.summary,
      importedListings: items.length,
      skippedRows: Math.max(0, data.summary.sourceRows - items.length),
      mode: data.summary.mode
    },
    categories: countValues(items.flatMap((item) => item.categories)),
    filters: {
      types: countValues(items.flatMap((item) => item.listingTypes)),
      areas: countValues(items.map((item) => item.area)),
      neighborhoods: countValues(items.map((item) => item.neighborhood)),
      dietary: countValues(items.flatMap((item) => item.dietaryOptions)),
      services: countValues(items.flatMap((item) => allFeatureValues(item))),
      offerings: countValues(items.flatMap((item) => asStringArray(item.details?.offerings))),
      prices: countValues(items.map((item) => item.priceLevel)),
      ratings: countValues(items.map((item) => item.rating?.toString()))
    },
    previewListings: items.slice(0, 6)
  };
}

export function renderListingsFile() {
  return `import listingsData from "../../data/listings.json";

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
  priceLevel?: "\\u00a3" | "\\u00a3\\u00a3" | "\\u00a3\\u00a3\\u00a3";
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
`;
}

export function renderListingsJsonFile(items: ImportedListing[]) {
  return `${JSON.stringify(items, null, 2)}\n`;
}

export function renderListingSearchRecordsJsonFile(items: ImportedListing[]) {
  return `${JSON.stringify(items.map(toListingSearchRecord))}\n`;
}

export function renderListingSearchIndexJsonFile(items: ImportedListing[]) {
  const records = items.map(toListingSearchRecord) as ListingSearchRecord[];
  return `${JSON.stringify(packListingSearchRecords(records))}\n`;
}

export function renderListingFilterCountsJsonFile(items: ImportedListing[]) {
  const counts = {
    area: {} as Record<string, number>,
    neighborhood: {} as Record<string, number>,
    category: {} as Record<string, number>,
    type: {} as Record<string, number>,
    dietary: {} as Record<string, number>,
    service: {} as Record<string, number>,
    offering: {} as Record<string, number>,
    price: {} as Record<string, number>
  };

  for (const listing of items) {
    incrementSlugCount(counts.area, listing.area);
    incrementSlugCount(counts.neighborhood, listing.neighborhood);
    listing.categories.forEach((value) => incrementSlugCount(counts.category, value));
    listing.listingTypes.forEach((value) => incrementSlugCount(counts.type, value));
    listing.dietaryOptions.forEach((value) => incrementSlugCount(counts.dietary, value));
    asStringArray(listing.details?.serviceOptions).forEach((value) => incrementSlugCount(counts.service, value));
    asStringArray(listing.details?.offerings).forEach((value) => incrementSlugCount(counts.offering, value));
    incrementExactCount(counts.price, listing.priceLevel);
  }

  return `${JSON.stringify(counts)}\n`;
}

export function renderShortlistSummariesJsonFile(items: ImportedListing[]) {
  return `${JSON.stringify(getAllShortlistListingSummaries(items))}\n`;
}

export function renderShortlistIndexJsonFile(items: ImportedListing[]) {
  return `${JSON.stringify(packShortlistSummaries(getAllShortlistListingSummaries(items)))}\n`;
}

function toListingSearchRecord(listing: ImportedListing) {
  const contact = listing.contact as
    | {
        website?: string;
        googleReviewsUrl?: string;
        menuUrl?: string;
        reserveUrl?: string;
        appointmentUrl?: string;
      }
    | undefined;
  const location = listing.location as
    | {
        googleMapsUrl?: string;
        latitude?: number;
        longitude?: number;
        tubeStation?: string;
        busStop?: string;
        nearbyPlaces?: { name?: string }[];
      }
    | undefined;
  const details = listing.details as
    | {
        workingHours?: unknown[];
        serviceOptions?: string[];
        offerings?: string[];
        highlights?: string[];
        popularFor?: string[];
        diningOptions?: string[];
        amenities?: string[];
        accessibility?: string[];
        atmosphere?: string[];
        crowd?: string[];
        planning?: string[];
        payments?: string[];
        children?: string[];
        parking?: string[];
        pets?: string[];
        googleVerified?: boolean;
      }
    | undefined;

  return {
    slug: listing.slug,
    name: listing.name,
    description: listing.description,
    images: asStringArray(listing.images).slice(0, 3),
    imageFallbackLabel: listing.imageFallbackLabel,
    area: listing.area,
    neighborhood: listing.neighborhood,
    borough: listing.borough,
    address: listing.address,
    fullAddress: listing.fullAddress,
    postcode: listing.postcode,
    categories: asStringArray(listing.categories),
    listingTypes: asStringArray(listing.listingTypes),
    dietaryOptions: asStringArray(listing.dietaryOptions),
    priceLevel: listing.priceLevel,
    rating: listing.rating,
    reviewCount: listing.reviewCount,
    featured: Boolean(listing.featured),
    contact: {
      website: contact?.website,
      googleReviewsUrl: contact?.googleReviewsUrl,
      menuUrl: contact?.menuUrl,
      reserveUrl: contact?.reserveUrl,
      appointmentUrl: contact?.appointmentUrl
    },
    location: {
      googleMapsUrl: location?.googleMapsUrl,
      latitude: location?.latitude,
      longitude: location?.longitude,
      tubeStation: location?.tubeStation,
      busStop: location?.busStop,
      nearbyPlaces: asStringArray(location?.nearbyPlaces?.map((place) => place.name))
    },
    details: {
      workingHours: details?.workingHours ?? [],
      serviceOptions: asStringArray(details?.serviceOptions),
      offerings: asStringArray(details?.offerings),
      highlights: asStringArray(details?.highlights),
      popularFor: asStringArray(details?.popularFor),
      diningOptions: asStringArray(details?.diningOptions),
      amenities: asStringArray(details?.amenities),
      accessibility: asStringArray(details?.accessibility),
      atmosphere: asStringArray(details?.atmosphere),
      crowd: asStringArray(details?.crowd),
      planning: asStringArray(details?.planning),
      payments: asStringArray(details?.payments),
      children: asStringArray(details?.children),
      parking: asStringArray(details?.parking),
      pets: asStringArray(details?.pets),
      googleVerified: Boolean(details?.googleVerified)
    },
    tags: asStringArray(listing.tags)
  };
}

function findColumn(headers: string[], aliases: string[]) {
  const exact = headers.find((header) => aliases.some((alias) => normalizeKey(header) === normalizeKey(alias)));
  if (exact) return exact;
  return headers.find((header) =>
    aliases.some((alias) => {
      const normalizedAlias = normalizeKey(alias);
      if (normalizedAlias.length < 5) return false;
      return normalizeKey(header).includes(normalizedAlias);
    })
  );
}

function valueAt(row: Row, header?: string) {
  if (!header) return "";
  const value = row[header];
  return value === undefined || value === null ? "" : String(value).trim();
}

function importProvenance(
  sourceFile: string,
  options?: ImportProvenanceOptions
): NewImportProvenance {
  const sourceName = options?.sourceName?.trim() || sourceFile;
  const requestedImportedAt = options?.importedAt?.trim() || new Date().toISOString();
  const parsedImportedAt = new Date(requestedImportedAt);
  if (Number.isNaN(parsedImportedAt.getTime())) {
    throw new Error(`Invalid provenance import timestamp: ${requestedImportedAt}`);
  }

  const sourceUrl = options?.sourceUrl?.trim();
  if (sourceUrl) {
    let parsedSourceUrl: URL;
    try {
      parsedSourceUrl = new URL(sourceUrl);
    } catch {
      throw new Error(`Invalid provenance source URL: ${sourceUrl}`);
    }
    if (parsedSourceUrl.protocol !== "http:" && parsedSourceUrl.protocol !== "https:") {
      throw new Error(`Provenance source URL must use HTTP(S): ${sourceUrl}`);
    }
  }

  return {
    sourceName,
    sourceUrl: sourceUrl || undefined,
    importedAt: parsedImportedAt.toISOString(),
    verificationStatus: "unverified"
  };
}

function assertCsvSource(sourceFile: string) {
  if (!sourceFile.toLowerCase().endsWith(".csv")) {
    throw new Error("Only CSV files are supported. Save your spreadsheet as .csv before importing.");
  }
}

function parseCsvRows(text: string): Row[] {
  const records = parseCsvRecords(text.replace(/^\uFEFF/, ""));
  if (!records.length) return [];

  const headers = records[0].map((header) => header.trim());
  return records
    .slice(1)
    .filter((record) => record.some((value) => value.trim()))
    .map((record) =>
      Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""]))
    );
}

function parseCsvRecords(text: string) {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === "\"") {
      if (inQuotes && nextChar === "\"") {
        field += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      record.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      record.push(field);
      records.push(record);
      record = [];
      field = "";
      if (char === "\r" && nextChar === "\n") index += 1;
      continue;
    }

    field += char;
  }

  if (field || record.length) {
    record.push(field);
    records.push(record);
  }

  return records;
}

function listByHeader(row: Row, pattern: RegExp) {
  const header = Object.keys(row).find((key) => pattern.test(key));
  return list(valueAt(row, header));
}

function list(value: unknown) {
  if (!value) return [];
  return unique(
    String(value)
      .split(/[,;|]/)
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function number(value: unknown) {
  if (!value) return undefined;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizePrice(value: unknown): ImportedListing["priceLevel"] {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  if (/£££|\$\$\$|€€€|â.?¬â.?¬â.?¬|3|expensive/i.test(text)) return "\u00a3\u00a3\u00a3";
  if (/££|\$\$|€€|â.?¬â.?¬|2|moderate|medium/i.test(text)) return "\u00a3\u00a3";
  if (/£|\$|€|â.?¬|1|cheap|budget|low/i.test(text)) return "\u00a3";
  return undefined;
}

function truthy(value: unknown) {
  return /^(true|yes|y|1|featured)$/i.test(String(value ?? "").trim());
}

function compact(object: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  Object.entries(object).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length) result[key] = value;
    else if (!Array.isArray(value) && value !== undefined && value !== "") result[key] = value;
  });
  return Object.keys(result).length ? result : undefined;
}

function normalizeKey(value: string) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeGreekKey(value: string) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ς/g, "σ")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function slugify(value: string) {
  return transliterateGreek(String(value))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function transliterateGreek(value: string) {
  const map: Record<string, string> = {
    α: "a",
    β: "v",
    γ: "g",
    δ: "d",
    ε: "e",
    ζ: "z",
    η: "i",
    θ: "th",
    ι: "i",
    κ: "k",
    λ: "l",
    μ: "m",
    ν: "n",
    ξ: "x",
    ο: "o",
    π: "p",
    ρ: "r",
    σ: "s",
    ς: "s",
    τ: "t",
    υ: "y",
    φ: "f",
    χ: "ch",
    ψ: "ps",
    ω: "o"
  };

  return value
    .toLowerCase()
    .replace(/ου/g, "ou")
    .replace(/αι/g, "ai")
    .replace(/ει/g, "ei")
    .replace(/οι/g, "oi")
    .replace(/αυ/g, "av")
    .replace(/ευ/g, "ev")
    .replace(/[α-ωάέήίόύώϊϋΐΰς]/g, (char) => map[char.normalize("NFD").replace(/[\u0300-\u036f]/g, "")] ?? "");
}

function looksLikeFilterHeader(header: string) {
  return /category|type|service|feature|amenit|dietary|area|neigh|price|rating|parking|delivery|seating|opening|style|offer|tag/i.test(header);
}

function looksLikeLongTextColumn(header: string) {
  return /description|summary|about|hours|meta|note|internal|comment/i.test(header);
}

function looksLikeUrlColumn(header: string) {
  return /url|website|link|image|photo|logo|email|phone|address|latitude|longitude|place/i.test(header);
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function countValues(items: Array<string | number | undefined>) {
  const counts = new Map<string, number>();
  items.filter(Boolean).forEach((item) => {
    const label = String(item);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return Array.from(counts, ([label, count]) => ({ label, count })).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label)
  );
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function incrementSlugCount(counts: Record<string, number>, value?: string) {
  if (!value) return;
  const slug = slugify(value);
  counts[slug] = (counts[slug] ?? 0) + 1;
}

function incrementExactCount(counts: Record<string, number>, value?: string) {
  if (!value) return;
  counts[value] = (counts[value] ?? 0) + 1;
}

function allFeatureValues(item: ImportedListing) {
  return [
    ...asStringArray(item.details?.serviceOptions),
    ...asStringArray(item.details?.highlights),
    ...asStringArray(item.details?.amenities),
    ...asStringArray(item.details?.atmosphere),
    ...asStringArray(item.details?.popularFor),
    ...asStringArray(item.details?.accessibility),
    ...asStringArray(item.details?.diningOptions),
    ...asStringArray(item.details?.crowd),
    ...asStringArray(item.details?.planning),
    ...asStringArray(item.details?.children),
    ...asStringArray(item.details?.parking),
    ...asStringArray(item.details?.pets)
  ];
}

function roleLabel(role: ImportFieldRole) {
  return importRoleLabels[role];
}

function renderMappings(mapped: Record<string, string>) {
  const rows = Object.entries(mapped).map(([field, header]) => `- ${field}: ${header}`);
  return rows.length ? rows.join("\n") : "- No columns mapped";
}

function renderValueGroup(title: string, values: CountedValue[]) {
  if (!values.length) return `### ${title}\n\n- None\n`;
  const preview = values.slice(0, 12).map((item) => `- ${item.label}: ${item.count}`).join("\n");
  const suffix = values.length > 12 ? `\n- ${values.length - 12} more values not shown.` : "";
  return `### ${title}\n\n${preview}${suffix}\n`;
}
