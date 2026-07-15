import { getSiteUrl } from "@/lib/site-url";

export const siteConfig = {
  siteName: "Indian Restaurants London",
  name: "Indian Restaurants London",
  logoInitials: "IR",
  niche: "Indian restaurants in London",
  city: "London",
  cityOrRegion: "London",
  url: getSiteUrl(),
  listingBasePath: "restaurants",
  heroEyebrow: "London Indian restaurant directory",
  heroImage:
    "/images/homepage/indian-restaurants-london-hero-bright-v2.webp",
  heroImageMobile:
    "/images/homepage/indian-restaurants-london-hero-bright-v2-mobile.webp",
  heroImageAlt: "Indian family sharing curry and naan in a London restaurant with Big Ben outside",
  heroCopy:
    "Find Indian restaurants across London by area, cuisine, service options, ratings, transport links, and dining style.",
  description:
    "A searchable directory of Indian restaurants in London with filters for areas, cuisines, ratings, services, transport, and dining options.",
  navigation: [
    { label: "Restaurants", href: "/restaurants" },
    { label: "Areas", href: "/areas" },
    { label: "Categories", href: "/categories" }
  ],
  footerLinks: [
    { label: "All restaurants", href: "/restaurants" },
    { label: "Best rated", href: "/restaurants?sort=rating" },
    { label: "Categories", href: "/categories" }
  ],
  footerGroups: [
    {
      title: "Browse",
      links: [
        { label: "All {listingPluralLabelLower}", href: "/restaurants" },
        { label: "Areas", href: "/areas" },
        { label: "{categoryPluralLabel}", href: "/categories" }
      ]
    },
    {
      title: "Popular searches",
      source: "popularSearches",
      limit: 6
    },
    {
      title: "Top areas",
      source: "topAreas",
      limit: 6
    },
    {
      title: "Useful filters",
      links: [
        { label: "Open now", href: "/restaurants?open=1" },
        { label: "Best rated", href: "/restaurants?sort=rating" },
        { label: "Most reviewed", href: "/restaurants?sort=reviews" },
        { label: "Lowest price", href: "/restaurants?sort=price" }
      ]
    }
  ]
} as const;
