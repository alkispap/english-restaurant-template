import { siteConfig } from "@/config/site";

export type TrustPageSection = {
  heading: string;
  body: string;
};

export type TrustPage = {
  key: "about" | "contact" | "privacy" | "terms" | "methodology" | "suggest-update";
  title: string;
  href: string;
  description: string;
  sections: TrustPageSection[];
};

export const trustPages = [
  {
    key: "about",
    title: "About",
    href: "/about",
    description: `${siteConfig.name} is a local directory for comparing ${siteConfig.niche}.`,
    sections: [
      {
        heading: "What this directory does",
        body: `${siteConfig.name} helps visitors compare ${siteConfig.niche} by area, cuisine, service options, ratings, review counts, transport links, and dining details.`
      },
      {
        heading: "What this directory is not",
        body: "This site is not a restaurant owner, booking agent, delivery provider, or official representative of the listed businesses."
      },
      {
        heading: "How to use it",
        body: "Use the filters, area pages, category pages, comparison tools, and listing details to shortlist restaurants before checking directly with the restaurant."
      }
    ]
  },
  {
    key: "contact",
    title: "Contact",
    href: "/contact",
    description: `Contact ${siteConfig.name} about corrections, partnerships, listing updates, or general questions.`,
    sections: [
      {
        heading: "General questions",
        body: "Use this page as the contact point for directory questions, feedback, corrections, and partnership enquiries."
      },
      {
        heading: "Restaurant updates",
        body: "Restaurants can request corrections for opening hours, contact links, service options, photos, categories, or closed-status information."
      },
      {
        heading: "Response expectations",
        body: "Messages should include the restaurant name, location, the detail that needs review, and a source that helps verify the change."
      }
    ]
  },
  {
    key: "privacy",
    title: "Privacy Policy",
    href: "/privacy-policy",
    description: `Privacy information for visitors using ${siteConfig.name}.`,
    sections: [
      {
        heading: "Information this site may use",
        body: "The directory may use privacy-friendly analytics, browser storage for saved listings, and information submitted voluntarily through contact or update requests."
      },
      {
        heading: "Saved listings",
        body: "Saved and compared listings can work in the visitor's browser, so they may remain on the device unless the browser data is cleared."
      },
      {
        heading: "Third-party links",
        body: "Restaurant websites, maps, booking platforms, delivery platforms, review pages, and social links are controlled by third parties with their own privacy practices."
      }
    ]
  },
  {
    key: "terms",
    title: "Terms",
    href: "/terms",
    description: `Terms for using ${siteConfig.name}.`,
    sections: [
      {
        heading: "Directory information",
        body: "Listing details are provided for comparison and convenience. Restaurant hours, menus, prices, services, links, and availability can change."
      },
      {
        heading: "Check before visiting",
        body: "Visitors should check directly with the restaurant before travelling, booking, ordering, or relying on a specific service."
      },
      {
        heading: "External services",
        body: "Links to restaurant websites, maps, booking tools, delivery services, review pages, and social platforms are external services."
      }
    ]
  },
  {
    key: "methodology",
    title: "How We Rank",
    href: "/methodology",
    description: `How ${siteConfig.name} selects, sorts, and compares listings.`,
    sections: [
      {
        heading: "Listing selection",
        body: "Pages are built from the current directory dataset and focus on restaurants with enough useful information to help visitors compare options."
      },
      {
        heading: "Sorting and filters",
        body: "Visitors can sort and filter by signals such as rating, review count, price, area, cuisine, service options, dietary options, and transport details when those fields are available."
      },
      {
        heading: "Quality and indexation",
        body: "Some listing and hub pages may be held back from search indexing when the available data is too thin, low quality, duplicated, or not useful enough."
      },
      {
        heading: "Paid placement",
        body: "The current template does not require paid placement. If paid placement is added later, it should be disclosed clearly on this page."
      }
    ]
  },
  {
    key: "suggest-update",
    title: "Suggest an Update",
    href: "/suggest-update",
    description: `Suggest corrections or missing restaurant information for ${siteConfig.name}.`,
    sections: [
      {
        heading: "What to report",
        body: "Report wrong hours, closed restaurants, broken website links, wrong phone numbers, missing restaurants, incorrect categories, or outdated service details."
      },
      {
        heading: "What to include",
        body: "Include the restaurant name, area, the detail that looks wrong, the suggested correction, and a source that helps verify the update."
      },
      {
        heading: "How updates are handled",
        body: "Suggested changes should be reviewed before publication so the directory stays useful, factual, and consistent."
      }
    ]
  }
] as const satisfies readonly TrustPage[];

export function getTrustPages(): TrustPage[] {
  return [...trustPages];
}

export function getTrustPage(key: TrustPage["key"]): TrustPage {
  const page = trustPages.find((item) => item.key === key);
  if (!page) throw new Error(`Missing trust page: ${key}`);
  return page;
}
