export type SearchableDirectoryCard = {
  label: string;
  slug: string;
  href: string;
  count: number;
  description: string;
};

export type DirectoryCardFilter = {
  query?: string;
  letter?: string;
};

export function filterDirectoryCards<T extends SearchableDirectoryCard>(
  items: T[],
  filter: DirectoryCardFilter
): T[] {
  const query = normalize(filter.query ?? "");
  const letter = normalize(filter.letter ?? "").charAt(0);

  return items.filter((item) => {
    const label = normalize(item.label);
    const description = normalize(item.description);
    const matchesQuery = !query || label.includes(query) || description.includes(query);
    const matchesLetter = !letter || label.startsWith(letter);

    return matchesQuery && matchesLetter;
  });
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
