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
  const tokens = searchTokens(query);
  if (!tokens.length) return true;

  const haystack = normalizeText(values.filter(Boolean).join(" "));
  return tokens.every((token) => expandedTokens(token).some((candidate) => haystack.includes(candidate)));
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
