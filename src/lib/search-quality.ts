const synonymGroups = [
  ["takeaway", "takeout", "take-away"],
  ["delivery", "deliver"],
  ["vegan", "plant-based"],
  ["vegetarian", "veggie"],
  ["halal", "halaal"],
  ["biryani", "indian", "south", "pakistani"],
  ["near", "nearby", "local"]
];

const ignoredTokens = new Set(["a", "an", "and", "for", "in", "me", "near", "of", "the", "to", "with"]);

export function searchTokens(query?: string) {
  return normalizeText(query)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !ignoredTokens.has(token));
}

export function searchableTextMatches(query: string | undefined, values: Array<string | undefined>) {
  return createSearchTextMatcher(query)(normalizeText(values.filter(Boolean).join(" ")));
}

export function createSearchTextMatcher(query?: string) {
  const tokenCandidates = searchTokens(query).map(expandedTokens);
  if (!tokenCandidates.length) return () => true;

  return (normalizedHaystack: string) =>
    tokenCandidates.every((candidates) => candidates.some((candidate) => normalizedHaystack.includes(candidate)));
}

export function createRawSearchTextMatcher(query?: string) {
  const tokenCandidates = searchTokens(query).map(expandedTokens);
  const normalizedMatcher = createSearchTextMatcher(query);
  if (!tokenCandidates.length) return () => true;

  return (lowercaseHaystack: string) => {
    const rawMatch = tokenCandidates.every((candidates) =>
      candidates.some((candidate) => /^[a-z0-9]+$/.test(candidate) && lowercaseHaystack.includes(candidate))
    );
    if (rawMatch) return true;
    if (!/[\u00c0-\u024f]/.test(lowercaseHaystack)) return false;
    return normalizedMatcher(normalizeText(lowercaseHaystack));
  };
}

export function normalizeText(value?: string) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expandedTokens(token: string) {
  const group = synonymGroups.find((items) => items.includes(token));
  return group ?? [token];
}
