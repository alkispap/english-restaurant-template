import { getSiteUrl } from "@/lib/site-url";

export const siteConfig = {
  siteName: "Indian Restaurants London",
  name: "Indian Restaurants London",
  logoInitials: "IR",
  niche: "Indian restaurants in London",
  city: "London",
  cityOrRegion: "London",
  url: getSiteUrl(),
  listingBasePath: "listings",
  heroEyebrow: "London Indian restaurant directory",
  heroImage:
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=80",
  heroImageAlt: "London buildings and local restaurants",
  heroCopy:
    "Find Indian restaurants across London by area, cuisine, service options, ratings, transport links, and dining style.",
  description:
    "A searchable directory of Indian restaurants in London with filters for areas, cuisines, ratings, services, transport, and dining options.",
  navigation: [
    { label: "Restaurants", href: "/" },
    { label: "Areas", href: "/areas" },
    { label: "Categories", href: "/categories" }
  ],
  footerLinks: [
    { label: "All restaurants", href: "/" },
    { label: "Best rated", href: "/?sort=rating" },
    { label: "Categories", href: "/categories" }
  ],
  footerGroups: [
    {
      title: "Browse",
      links: [
        { label: "All {listingPluralLabelLower}", href: "/" },
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
        { label: "Open now", href: "/?open=1" },
        { label: "Best rated", href: "/?sort=rating" },
        { label: "Most reviewed", href: "/?sort=reviews" },
        { label: "Lowest price", href: "/?sort=price" }
      ]
    }
  ]
} as const;
