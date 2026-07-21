import type { ShortlistListingSummary } from "@/lib/shortlist";
import { listingDetailPath } from "@/lib/routes";

export type PackedShortlistIndex = {
  version: 1;
  dictionary: string[];
  records: unknown[][];
};

const PACKED_INDEX_VERSION = 1;

export function packShortlistSummaries(summaries: ShortlistListingSummary[]): PackedShortlistIndex {
  const rows = summaries.map(toPackedRow);
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

export function unpackShortlistSummaries(index: PackedShortlistIndex): ShortlistListingSummary[] {
  if (index.version !== PACKED_INDEX_VERSION) {
    throw new Error(`Unsupported shortlist index version: ${index.version}`);
  }

  return index.records.map((row) => unpackRow(row, index.dictionary));
}

function toPackedRow(summary: ShortlistListingSummary): unknown[] {
  return [
    summary.slug,
    summary.name,
    summary.ratingLabel,
    summary.reviewLabel,
    summary.priceLabel,
    summary.areaLabel,
    summary.categoriesLabel,
    summary.dietaryLabel,
    summary.servicesLabel,
    summary.parkingLabel,
    optionalString(summary.websiteUrl),
    optionalString(summary.menuUrl),
    optionalString(summary.bookingUrl),
    summary.workingHours?.map(({ day, hours }) => [day, hours]) ?? 0
  ];
}

function unpackRow(row: unknown[], dictionary: string[]): ShortlistListingSummary {
  const slug = decodeRequiredString(row[0], dictionary);

  return {
    slug,
    name: decodeRequiredString(row[1], dictionary),
    href: listingDetailPath(slug),
    ratingLabel: decodeRequiredString(row[2], dictionary),
    reviewLabel: decodeRequiredString(row[3], dictionary),
    priceLabel: decodeRequiredString(row[4], dictionary),
    areaLabel: decodeRequiredString(row[5], dictionary),
    categoriesLabel: decodeRequiredString(row[6], dictionary),
    dietaryLabel: decodeRequiredString(row[7], dictionary),
    servicesLabel: decodeRequiredString(row[8], dictionary),
    parkingLabel: decodeRequiredString(row[9], dictionary),
    websiteUrl: decodeOptionalString(row[10], dictionary),
    menuUrl: decodeOptionalString(row[11], dictionary),
    bookingUrl: decodeOptionalString(row[12], dictionary),
    workingHours:
      row[13] === 0
        ? undefined
        : asArray(row[13]).map((entry) => {
            const pair = asArray(entry);
            return {
              day: decodeRequiredString(pair[0], dictionary),
              hours: decodeRequiredString(pair[1], dictionary)
            };
          })
  };
}

function countStrings(value: unknown, frequencies: Map<string, number>) {
  if (typeof value === "string") {
    frequencies.set(value, (frequencies.get(value) ?? 0) + 1);
    return;
  }
  if (Array.isArray(value)) value.forEach((item) => countStrings(item, frequencies));
}

function encodeStrings(value: unknown, dictionaryIds: Map<string, number>): unknown {
  if (typeof value === "string") return dictionaryIds.get(value) ?? value;
  if (Array.isArray(value)) return value.map((item) => encodeStrings(item, dictionaryIds));
  return value;
}

function decodeRequiredString(value: unknown, dictionary: string[]) {
  const decoded = decodeOptionalString(value, dictionary);
  if (decoded === undefined) throw new Error("Packed shortlist index is missing a required string.");
  return decoded;
}

function decodeOptionalString(value: unknown, dictionary: string[]) {
  if (value === 0 || value === null || value === undefined) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    const decoded = dictionary[value - 1];
    if (decoded !== undefined) return decoded;
  }
  throw new Error("Packed shortlist index contains an invalid string token.");
}

function optionalString(value?: string) {
  return value === undefined ? 0 : value;
}

function asArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error("Packed shortlist index contains an invalid row.");
  return value;
}

function compareStrings(left: string, right: string) {
  return left < right ? -1 : left > right ? 1 : 0;
}
