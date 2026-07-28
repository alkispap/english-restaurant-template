export type DirectoryListingsSearchParams = Record<string, string | string[] | undefined>;

type DirectoryQueryLocation = {
  href: string;
  pathname: string;
  search: string;
};

const directorySearchParamKeys = new Set([
  "q",
  "area",
  "neighborhood",
  "category",
  "cuisine",
  "type",
  "dietary",
  "service",
  "offering",
  "highlight",
  "popularFor",
  "dining",
  "amenity",
  "accessibility",
  "atmosphere",
  "crowd",
  "planning",
  "payment",
  "children",
  "parking",
  "pets",
  "tube",
  "bus",
  "nearby",
  "price",
  "rating",
  "sort",
  "open",
  "view",
  "page"
]);

const directoryQueryRobotsSelector = 'meta[data-directory-query-robots="true"]';

export const DIRECTORY_QUERY_ROBOTS_CONTENT = "noindex, follow";

export function searchParamsRecordFromUrlSearchParams(searchParams: URLSearchParams): DirectoryListingsSearchParams {
  const record: DirectoryListingsSearchParams = {};

  searchParams.forEach((value, key) => {
    if (!directorySearchParamKeys.has(key)) return;

    const current = record[key];
    if (Array.isArray(current)) {
      record[key] = [...current, value];
    } else if (current) {
      record[key] = [current, value];
    } else {
      record[key] = value;
    }
  });

  return record;
}

export function hasActiveDirectoryQuery(searchParams: URLSearchParams) {
  return normalizeSearchParams(searchParamsRecordFromUrlSearchParams(searchParams)).length > 0;
}

export function getDirectoryQueryRobotsContent(searchParams: URLSearchParams) {
  return hasActiveDirectoryQuery(searchParams) ? DIRECTORY_QUERY_ROBOTS_CONTENT : null;
}

export function syncDirectoryQueryRobotsMeta(searchParams: URLSearchParams, documentRoot: Document = document) {
  const existing = documentRoot.head.querySelector<HTMLMetaElement>(directoryQueryRobotsSelector);
  const content = getDirectoryQueryRobotsContent(searchParams);

  if (!content) {
    existing?.remove();
    return;
  }

  const meta = existing ?? documentRoot.createElement("meta");
  meta.name = "robots";
  meta.content = content;
  meta.dataset.directoryQueryRobots = "true";
  if (!existing) documentRoot.head.append(meta);
}

export function captureDirectoryQuerySnapshot(location: DirectoryQueryLocation) {
  const searchParams = new URLSearchParams(location.search);
  return {
    href: location.href,
    pathname: location.pathname,
    searchParams,
    normalizedQuery: normalizeSearchParams(searchParamsRecordFromUrlSearchParams(searchParams))
  };
}

export function normalizeSearchParams(searchParams: DirectoryListingsSearchParams = {}) {
  const params = new URLSearchParams();
  Object.keys(searchParams)
    .sort()
    .forEach((key) => {
      const value = searchParams[key];
      if (Array.isArray(value)) {
        value.filter(Boolean).forEach((item) => params.append(key, item));
      } else if (value) {
        params.set(key, value);
      }
    });

  return params.toString();
}
