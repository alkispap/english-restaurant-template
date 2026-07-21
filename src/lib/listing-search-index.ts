import type { ListingSearchRecord } from "@/data/listing-search-records";

export type PackedListingSearchIndex = {
  version: 1;
  dictionary: string[];
  records: unknown[][];
};

const PACKED_INDEX_VERSION = 1;

export function packListingSearchRecords(records: ListingSearchRecord[]): PackedListingSearchIndex {
  const rows = records.map(toPackedRow);
  const frequencies = new Map<string, number>();

  rows.forEach((row) => countStrings(row, frequencies));

  const dictionary = Array.from(frequencies)
    .filter(([, count]) => count > 1)
    .sort(([left, leftCount], [right, rightCount]) => rightCount - leftCount || compareStrings(left, right))
    .map(([value]) => value);
  const dictionaryIds = new Map(dictionary.map((value, index) => [value, index + 1]));

  return {
    version: PACKED_INDEX_VERSION,
    dictionary,
    records: rows.map((row) => encodeStrings(row, dictionaryIds) as unknown[])
  };
}

export function unpackListingSearchRecords(index: PackedListingSearchIndex): ListingSearchRecord[] {
  if (index.version !== PACKED_INDEX_VERSION) {
    throw new Error(`Unsupported listing search index version: ${index.version}`);
  }

  return index.records.map((row) => unpackRow(row, index.dictionary));
}

function toPackedRow(record: ListingSearchRecord): unknown[] {
  return [
    record.slug,
    record.name,
    optionalString(record.description),
    record.images,
    optionalString(record.imageFallbackLabel),
    optionalString(record.area),
    optionalString(record.neighborhood),
    optionalString(record.borough),
    optionalString(record.address),
    optionalString(record.fullAddress),
    optionalString(record.postcode),
    record.categories,
    record.listingTypes,
    record.dietaryOptions,
    optionalString(record.priceLevel),
    optionalNumber(record.rating),
    optionalNumber(record.reviewCount),
    record.featured ? 1 : 0,
    [
      optionalString(record.contact?.website),
      optionalString(record.contact?.googleReviewsUrl),
      optionalString(record.contact?.menuUrl),
      optionalString(record.contact?.reserveUrl),
      optionalString(record.contact?.appointmentUrl)
    ],
    [
      optionalString(record.location?.googleMapsUrl),
      optionalNumber(record.location?.latitude),
      optionalNumber(record.location?.longitude),
      optionalString(record.location?.tubeStation),
      optionalString(record.location?.busStop),
      record.location?.nearbyPlaces ?? []
    ],
    [
      (record.details?.workingHours ?? []).map(({ day, hours }) => [day, hours]),
      record.details?.serviceOptions ?? [],
      record.details?.offerings ?? [],
      record.details?.highlights ?? [],
      record.details?.popularFor ?? [],
      record.details?.diningOptions ?? [],
      record.details?.amenities ?? [],
      record.details?.accessibility ?? [],
      record.details?.atmosphere ?? [],
      record.details?.crowd ?? [],
      record.details?.planning ?? [],
      record.details?.payments ?? [],
      record.details?.children ?? [],
      record.details?.parking ?? [],
      record.details?.pets ?? [],
      record.details?.googleVerified ? 1 : 0
    ],
    record.tags
  ];
}

function unpackRow(row: unknown[], dictionary: string[]): ListingSearchRecord {
  const contact = asArray(row[18]);
  const location = asArray(row[19]);
  const details = asArray(row[20]);

  return {
    slug: decodeRequiredString(row[0], dictionary),
    name: decodeRequiredString(row[1], dictionary),
    description: decodeOptionalString(row[2], dictionary),
    images: decodeStringArray(row[3], dictionary),
    imageFallbackLabel: decodeOptionalString(row[4], dictionary),
    area: decodeOptionalString(row[5], dictionary),
    neighborhood: decodeOptionalString(row[6], dictionary),
    borough: decodeOptionalString(row[7], dictionary),
    address: decodeOptionalString(row[8], dictionary),
    fullAddress: decodeOptionalString(row[9], dictionary),
    postcode: decodeOptionalString(row[10], dictionary),
    categories: decodeStringArray(row[11], dictionary),
    listingTypes: decodeStringArray(row[12], dictionary),
    dietaryOptions: decodeStringArray(row[13], dictionary),
    priceLevel: decodeOptionalString(row[14], dictionary) as ListingSearchRecord["priceLevel"],
    rating: decodeOptionalNumber(row[15]),
    reviewCount: decodeOptionalNumber(row[16]),
    featured: Boolean(row[17]),
    contact: {
      website: decodeOptionalString(contact[0], dictionary),
      googleReviewsUrl: decodeOptionalString(contact[1], dictionary),
      menuUrl: decodeOptionalString(contact[2], dictionary),
      reserveUrl: decodeOptionalString(contact[3], dictionary),
      appointmentUrl: decodeOptionalString(contact[4], dictionary)
    },
    location: {
      googleMapsUrl: decodeOptionalString(location[0], dictionary),
      latitude: decodeOptionalNumber(location[1]),
      longitude: decodeOptionalNumber(location[2]),
      tubeStation: decodeOptionalString(location[3], dictionary),
      busStop: decodeOptionalString(location[4], dictionary),
      nearbyPlaces: decodeStringArray(location[5], dictionary)
    },
    details: {
      workingHours: asArray(details[0]).map((entry) => {
        const pair = asArray(entry);
        return {
          day: decodeRequiredString(pair[0], dictionary),
          hours: decodeRequiredString(pair[1], dictionary)
        };
      }),
      serviceOptions: decodeStringArray(details[1], dictionary),
      offerings: decodeStringArray(details[2], dictionary),
      highlights: decodeStringArray(details[3], dictionary),
      popularFor: decodeStringArray(details[4], dictionary),
      diningOptions: decodeStringArray(details[5], dictionary),
      amenities: decodeStringArray(details[6], dictionary),
      accessibility: decodeStringArray(details[7], dictionary),
      atmosphere: decodeStringArray(details[8], dictionary),
      crowd: decodeStringArray(details[9], dictionary),
      planning: decodeStringArray(details[10], dictionary),
      payments: decodeStringArray(details[11], dictionary),
      children: decodeStringArray(details[12], dictionary),
      parking: decodeStringArray(details[13], dictionary),
      pets: decodeStringArray(details[14], dictionary),
      googleVerified: Boolean(details[15])
    },
    tags: decodeStringArray(row[21], dictionary)
  };
}

function countStrings(value: unknown, frequencies: Map<string, number>) {
  if (typeof value === "string") {
    frequencies.set(value, (frequencies.get(value) ?? 0) + 1);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => countStrings(item, frequencies));
  }
}

function encodeStrings(value: unknown, dictionaryIds: Map<string, number>): unknown {
  if (typeof value === "string") return dictionaryIds.get(value) ?? value;
  if (Array.isArray(value)) return value.map((item) => encodeStrings(item, dictionaryIds));
  return value;
}

function decodeRequiredString(value: unknown, dictionary: string[]) {
  const decoded = decodeOptionalString(value, dictionary);
  if (decoded === undefined) throw new Error("Packed listing search index is missing a required string.");
  return decoded;
}

function decodeOptionalString(value: unknown, dictionary: string[]) {
  if (value === 0 || value === null || value === undefined) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    const decoded = dictionary[value - 1];
    if (decoded !== undefined) return decoded;
  }
  throw new Error("Packed listing search index contains an invalid string token.");
}

function decodeStringArray(value: unknown, dictionary: string[]) {
  return asArray(value).map((item) => decodeRequiredString(item, dictionary));
}

function optionalString(value?: string) {
  return value === undefined ? 0 : value;
}

function optionalNumber(value?: number) {
  return value === undefined ? null : value;
}

function decodeOptionalNumber(value: unknown) {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  throw new Error("Packed listing search index contains an invalid number.");
}

function asArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error("Packed listing search index contains an invalid row.");
  return value;
}

function compareStrings(left: string, right: string) {
  return left < right ? -1 : left > right ? 1 : 0;
}
