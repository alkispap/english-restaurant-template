import type { ListingsPageLinkValues } from "@/lib/listings-page";

export type SeoLandingRouteContextKey = "neighborhood" | "type" | "dietary" | "service" | "offering";
export type SeoLandingLockedFilterGroup = "area" | SeoLandingRouteContextKey;

type SeoLandingFilterContext = {
  kind: string;
  definingContext?: {
    key: SeoLandingRouteContextKey;
  };
};

export function getSeoLandingHiddenFilterGroups(page: SeoLandingFilterContext): SeoLandingLockedFilterGroup[] {
  return [
    ...(page.kind === "area" ? (["area"] as const) : []),
    ...(page.definingContext ? [page.definingContext.key] : [])
  ];
}

export function getSeoLandingPresentationValues(
  values: ListingsPageLinkValues,
  contextKey: SeoLandingRouteContextKey,
  keepExplicitSort: boolean
) {
  const next = { ...values, [contextKey]: undefined };
  if (!keepExplicitSort) next.sort = undefined;
  return next;
}
