import type { DirectoryTemplatePresetKey } from "@/config/directory-presets";

export type DirectoryDiscoveryCardKey = "area" | "category" | "takeaway" | "halal" | "vegetarian" | "bestRated";

export type DirectoryPack = {
  id: string;
  productionUrl: string;
  templatePreset: DirectoryTemplatePresetKey;
  siteName: string;
  logoInitials: string;
  cuisineLabel: string;
  niche: string;
  localNiche: string;
  cityOrRegion: string;
  listingBasePath: string;
  heroEyebrow: string;
  heroImage: string;
  heroImageMobile: string;
  heroImageAlt: string;
  heroCopy: string;
  description: string;
  copySafety: {
    blockedStaleTerms: readonly string[];
  };
  homepageQuickLinks: readonly { label: string; href: string }[];
  homepageDiscoveryCards: readonly {
    titleKey: DirectoryDiscoveryCardKey;
    copy: string;
    href: string;
    image: string;
    imageAlt: string;
  }[];
};

const indianLondonPack = {
  id: "indian-london",
  productionUrl: "https://indianrestaurantlondon.co.uk",
  templatePreset: "restaurant",
  siteName: "Indian Restaurants London",
  logoInitials: "IR",
  cuisineLabel: "Indian",
  niche: "Indian restaurants in London",
  localNiche: "Indian restaurants",
  cityOrRegion: "London",
  listingBasePath: "restaurants",
  heroEyebrow: "London Indian restaurant directory",
  heroImage: "/images/homepage/indian-restaurants-london-hero-bright-v2.webp",
  heroImageMobile: "/images/homepage/indian-restaurants-london-hero-bright-v2-mobile.webp",
  heroImageAlt: "Indian family sharing curry and naan in a London restaurant with Big Ben outside",
  heroCopy: "Find Indian restaurants across London by area, cuisine, service options, ratings, transport links, and dining style.",
  description: "A searchable directory of Indian restaurants in London with filters for areas, cuisines, ratings, services, transport, and dining options.",
  copySafety: {
    blockedStaleTerms: ["indian", "curry", "tandoor", "biryani"]
  },
  homepageQuickLinks: [
    { label: "Open now", href: "/restaurants?open=1" },
    { label: "Best rated", href: "/restaurants?sort=rating" },
    { label: "Takeaway", href: "/services/takeaway" },
    { label: "Halal", href: "/dietary/halal" }
  ],
  homepageDiscoveryCards: [
    { titleKey: "area", copy: "Start with London neighbourhoods and local hubs.", href: "/areas", image: "/images/homepage/discovery-area.webp", imageAlt: "London street with Indian restaurants for browsing by area" },
    { titleKey: "category", copy: "Narrow the directory by cuisine and restaurant style.", href: "/categories", image: "/images/homepage/discovery-cuisines.webp", imageAlt: "Indian dishes showing different cuisines and restaurant styles" },
    { titleKey: "takeaway", copy: "Find Indian restaurants set up for takeaway orders.", href: "/services/takeaway", image: "/images/homepage/discovery-takeaway.webp", imageAlt: "Indian takeaway containers ready for collection" },
    { titleKey: "halal", copy: "Explore restaurants with halal-friendly details.", href: "/dietary/halal", image: "/images/homepage/discovery-halal.webp", imageAlt: "Halal-friendly Indian restaurant table with shared dishes" },
    { titleKey: "vegetarian", copy: "Compare places with vegetarian options.", href: "/dietary/vegetarian", image: "/images/homepage/discovery-vegetarian.webp", imageAlt: "Vegetarian Indian thali with colourful vegetable dishes" },
    { titleKey: "bestRated", copy: "Jump to restaurants sorted by strong review signals.", href: "/restaurants?sort=rating", image: "/images/homepage/discovery-best-rated.webp", imageAlt: "Highly rated Indian restaurant table with polished dishes" }
  ]
} as const satisfies DirectoryPack;

const mexicanLondonProofPack = {
  ...indianLondonPack,
  id: "mexican-london",
  productionUrl: "https://mexicanrestaurantslondon.example",
  siteName: "Mexican Restaurants London",
  logoInitials: "MR",
  cuisineLabel: "Mexican",
  niche: "Mexican restaurants in London",
  localNiche: "Mexican restaurants",
  heroEyebrow: "London Mexican restaurant directory",
  heroImageAlt: "Mexican dishes shared around a restaurant table in London",
  heroCopy: "Find Mexican restaurants across London by area, cuisine, service options, ratings, transport links, and dining style.",
  description: "A searchable directory of Mexican restaurants in London with filters for areas, cuisines, ratings, services, transport, and dining options.",
  copySafety: {
    blockedStaleTerms: ["mexican", "taco", "burrito"]
  },
  homepageDiscoveryCards: indianLondonPack.homepageDiscoveryCards.map((card) => ({
    ...card,
    copy: card.copy.replace(/Indian/gi, "Mexican"),
    imageAlt: card.imageAlt.replace(/Indian/gi, "Mexican")
  }))
} as const satisfies DirectoryPack;

export const directoryPacks = {
  "indian-london": indianLondonPack,
  "mexican-london": mexicanLondonProofPack
} as const satisfies Record<string, DirectoryPack>;

export type DirectoryPackId = keyof typeof directoryPacks;

export function getDirectoryPack(id = process.env.NEXT_PUBLIC_DIRECTORY_PACK?.trim() || "indian-london"): DirectoryPack {
  const pack = directoryPacks[id as DirectoryPackId];
  if (!pack) throw new Error(`Unknown directory pack "${id}". Available packs: ${Object.keys(directoryPacks).join(", ")}.`);
  return pack;
}

export const activeDirectoryPack = getDirectoryPack();
