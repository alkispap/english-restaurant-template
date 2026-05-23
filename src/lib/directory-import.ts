import path from "node:path";
import fs from "node:fs";
import { importRoleLabels, importRoleOptions, type ImportFieldRole } from "@/lib/import-roles";
import { cleanListingUrl } from "@/lib/listing-links";
import { buildListingDescriptions } from "@/lib/listing-description";

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
  duplicateCount: number;
  nonOperationalCount: number;
  inferredFilters: InferredFilter[];
  ignoredHeaders: string[];
  warnings: string[];
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
  featured?: boolean;
  contact?: Record<string, unknown>;
  location?: Record<string, unknown>;
  details?: Record<string, unknown>;
};

export type ImportSummary = {
  sourceFile: string;
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

export type ImportResult = {
  listings: ImportedListing[];
  report: string;
  reportData: ImportReportData;
  listingsFile: string;
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
  facebook: ["facebook"],
  instagram: ["instagram"],
  whatsapp: ["whatsapp"],
  tiktok: ["tiktok"],
  x: ["x", "twitter", "x ex twitter", "x (ex twitter)"],
  linkedin: ["linkedin"],
  youtube: ["youtube"],
  featured: ["featured", "highlighted"]
};

export function analyzeDirectoryFile(filePath: string, mode: ImportMode, roleOverrides?: Record<string, ImportFieldRole>): ImportResult {
  const sourceFile = path.basename(filePath);
  assertCsvSource(sourceFile);
  return analyzeRows(parseCsvRows(fs.readFileSync(filePath, "utf8")), sourceFile, mode, roleOverrides);
}

export function analyzeDirectoryBuffer(buffer: ArrayBuffer | Buffer, sourceFile: string, mode: ImportMode = "preview", roleOverrides?: Record<string, ImportFieldRole>) {
  assertCsvSource(sourceFile);
  const text = Buffer.isBuffer(buffer) ? buffer.toString("utf8") : Buffer.from(new Uint8Array(buffer)).toString("utf8");
  return analyzeRows(parseCsvRows(text), sourceFile, mode, roleOverrides);
}

export function analyzeDirectoryRows(rows: Row[], sourceFile: string, mode: ImportMode, roleOverrides?: Record<string, ImportFieldRole>): ImportResult {
  return analyzeRows(rows, sourceFile, mode, roleOverrides);
}

function analyzeRows(rows: Row[], sourceFile: string, mode: ImportMode, roleOverrides?: Record<string, ImportFieldRole>): ImportResult {
  const headers = Object.keys(rows[0] ?? {});
  const analysis = analyzeColumns(headers, rows, roleOverrides);
  const listings: ImportedListing[] = [];
  const usedSlugs = new Map<string, number>();
  const seenSourceIds = new Set<string>();

  rows.forEach((row, index) => {
    if (isRepeatedHeaderRow(row, headers)) {
      analysis.warnings.push(`Row ${index + 2}: skipped repeated header row.`);
      return;
    }

    const sourceId = dedupeKey(row, analysis);
    if (sourceId && seenSourceIds.has(sourceId)) {
      analysis.duplicateCount += 1;
      analysis.warnings.push(`Row ${index + 2}: duplicate source ID "${sourceId}" was skipped.`);
      return;
    }
    if (sourceId) seenSourceIds.add(sourceId);

    if (isNonOperational(row, analysis)) {
      analysis.nonOperationalCount += 1;
      analysis.warnings.push(`Row ${index + 2}: "${firstByRole(row, analysis, "name") || "Listing"}" is not marked operational.`);
    }

    const listing = toListing(row, index, analysis);
    if (!listing.name) {
      analysis.warnings.push(`Row ${index + 2}: skipped because no listing name was found.`);
      return;
    }

    const baseSlug = listing.slug || stableSlug(listing.name, row, index, analysis);
    const slugCount = usedSlugs.get(baseSlug) ?? 0;
    usedSlugs.set(baseSlug, slugCount + 1);
    if (slugCount > 0) {
      listing.slug = `${baseSlug}-${slugCount + 1}`;
      analysis.warnings.push(`Row ${index + 2}: duplicate slug "${baseSlug}" changed to "${listing.slug}".`);
    } else {
      listing.slug = baseSlug;
    }

    addRowWarnings(row, index, listing, analysis);
    listings.push(listing);
  });

  const reportData = buildReportData(sourceFile, rows.length, listings, analysis, mode, rows);
  const report = renderReport(reportData);

  return {
    listings,
    report,
    reportData,
    listingsFile: renderListingsFile(listings),
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
    duplicateCount: 0,
    nonOperationalCount: 0,
    inferredFilters,
    ignoredHeaders: headers.filter((header) => !usedHeaders.has(header)),
    warnings
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
    logo: "logo"
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

function toListing(row: Row, index: number, analysis: ImportAnalysis): ImportedListing {
  const get = (field: string) => valueAt(row, analysis.mapped[field]);
  const categoryValues = unique([...valuesByRole(row, analysis, "category"), ...list(get("category"))]);
  const typeValues = unique([...valuesByRole(row, analysis, "typeFilter"), ...list(get("type"))]).filter((value) => !categoryValues.includes(value));
  const dietaryValues = list(get("dietary"));
  const inferredValues = analysis.inferredFilters.flatMap((filter) => list(valueAt(row, filter.header)));
  const aboutFeatures = featuresFromAbout(firstByRole(row, analysis, "rawFeatureJson"));
  const serviceValues = unique([...list(get("services")), ...aboutFeatures.serviceOptions, ...serviceLikeValues(row, analysis)]);
  const offeringValues = unique([...list(get("offerings")), ...aboutFeatures.offerings]);
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

  const generatedDescriptions = buildListingDescriptions(listing);
  listing.description = generatedDescriptions.description;
  listing.metaDescription = generatedDescriptions.metaDescription;
  return listing;
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
  rows: Row[]
): ImportReportData {
  return {
    summary: {
      sourceFile,
      sourceRows: sourceCount,
      importedListings: items.length,
      skippedRows: sourceCount - items.length,
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
- Source rows: ${data.summary.sourceRows}
- Imported listings: ${data.summary.importedListings}
- Skipped rows: ${data.summary.skippedRows}
- Mode: ${data.summary.mode}
- Source type: ${data.sourceKind === "outscraper" ? "Outscraper export" : "Generic CSV"}
- Duplicate rows skipped: ${data.duplicateCount}
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

export function renderListingsFile(items: ImportedListing[]) {
  const json = JSON.stringify(items, null, 2).replaceAll("\u00a3", "\\u00a3");
  const jsonLiteral = JSON.stringify(json);
  return `export type NearbyPlace = {
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

const listingsJson = ${jsonLiteral};

export const listings: Listing[] = JSON.parse(listingsJson) as Listing[];
`;
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
