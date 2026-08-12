import { activeDirectoryPack, type DirectoryPack } from "@/config/directory-packs";
import { normalizeSiteUrl } from "@/lib/site-url";

export function buildSiteConfig(pack: DirectoryPack, env: Record<string, string | undefined> = process.env) {
  return {
    ...pack,
    name: pack.siteName,
    city: pack.cityOrRegion,
    url: normalizeSiteUrl(env.NEXT_PUBLIC_SITE_URL),
    localNicheTitle: titleCase(pack.localNiche),
    localNicheSingularTitle: titleCase(pack.localNiche).replace(/\bRestaurants\b/i, "Restaurant"),
    navigation: [
      { label: "Restaurants", href: "/restaurants" },
      { label: "Areas", href: "/areas" },
      { label: "Cuisines", href: "/categories" }
    ],
    footerLinks: [
      { label: "All restaurants", href: "/restaurants" },
      { label: "Best rated", href: "/restaurants?sort=rating" },
      { label: "Cuisines", href: "/categories" }
    ]
  } as const;
}

export const siteConfig = buildSiteConfig(activeDirectoryPack);

function titleCase(value: string) {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}
