import { directoryIndexPath } from "@/lib/routes";

type SearchValues = {
  q?: string;
  area?: string;
};

export function buildSearchHref(values: SearchValues, basePath = directoryIndexPath()) {
  const params = new URLSearchParams();
  const query = values.q?.trim();
  const area = values.area?.trim();

  if (query) params.set("q", query);
  if (area) params.set("area", area);

  const serialized = params.toString();
  return serialized ? `${basePath}?${serialized}` : basePath;
}
