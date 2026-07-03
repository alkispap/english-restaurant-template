import {
  getAreaCategorySeoPage,
  getAreaSeoPage,
  getCategorySeoPage,
  getFacetSeoPage,
  getNeighborhoodSeoPage,
  getPopularSearchSeoPage,
  type SeoPageModel
} from "@/lib/seo-pages";
import { searchParamsRecordFromUrlSearchParams } from "@/lib/directory-listings-search-params";

type BuildBrowserSeoLandingPageInput = {
  pathname: string;
  searchParams: URLSearchParams;
};

export function buildBrowserSeoLandingPage({
  pathname,
  searchParams
}: BuildBrowserSeoLandingPageInput): SeoPageModel | undefined {
  const params = searchParamsRecordFromUrlSearchParams(searchParams);
  const segments = pathname.replace(/\/+$/, "").split("/").filter(Boolean);

  if (segments[0] === "areas" && segments[1] && segments[2] === "categories" && segments[3]) {
    return getAreaCategorySeoPage(segments[1], segments[3], params);
  }

  if (segments[0] === "areas" && segments[1] && segments.length === 2) {
    return getAreaSeoPage(segments[1], params);
  }

  if (segments[0] === "categories" && segments[1] && segments.length === 2) {
    return getCategorySeoPage(segments[1], params);
  }

  if (segments[0] === "neighborhoods" && segments[1] && segments.length === 2) {
    return getNeighborhoodSeoPage(segments[1], params);
  }

  if (segments[0] === "best" && segments[1] && segments.length === 2) {
    return getPopularSearchSeoPage(segments[1], params);
  }

  if (segments[0] === "services" && segments[1] && segments.length === 2) {
    return getFacetSeoPage("service", segments[1], params);
  }

  if (segments[0] === "dietary" && segments[1] && segments.length === 2) {
    return getFacetSeoPage("dietary", segments[1], params);
  }

  if (segments[0] === "offerings" && segments[1] && segments.length === 2) {
    return getFacetSeoPage("offering", segments[1], params);
  }

  if (segments[0] === "types" && segments[1] && segments.length === 2) {
    return getFacetSeoPage("type", segments[1], params);
  }

  return undefined;
}
