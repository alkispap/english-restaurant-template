import { siteConfig } from "@/config/site";
import type { Metadata } from "next";
import { pageShareMetadata } from "@/lib/share-metadata";

export type TrustPageSection = {
  heading: string;
  body: string;
};

export type TrustPage = {
  key: "about" | "contact" | "privacy" | "terms" | "methodology" | "suggest-update";
  title: string;
  metadataTitle: string;
  heading?: string;
  href: string;
  description: string;
  sections: TrustPageSection[];
};

export const trustPages = [
  {
    key: "about",
    title: "About",
    metadataTitle: "About This Indian Restaurant Directory",
    heading: "About This Indian Restaurant Directory",
    href: "/about",
    description: `${siteConfig.name} is a local directory for comparing ${siteConfig.niche}.`,
    sections: [
      {
        heading: "What This Indian Restaurant Directory Does",
        body: `${siteConfig.name} helps visitors compare ${siteConfig.niche} by area, cuisine, service options, Google rating, Google review count, transport links, opening hours, and dining details.`
      },
      {
        heading: "Restaurant Data Sources",
        body: "The directory is built from imported local business data, including restaurant names, areas, categories, addresses, opening hours, service options, Google rating, Google review count, and Google review links where available."
      },
      {
        heading: "What This Directory Is Not",
        body: "This site is not a restaurant owner, booking agent, delivery provider, or official representative of the listed businesses."
      },
      {
        heading: "How to Use the Indian Restaurant Directory",
        body: "Use the filters, area pages, category pages, comparison tools, and listing details to shortlist restaurants before checking directly with the restaurant."
      }
    ]
  },
  {
    key: "contact",
    title: "Contact",
    metadataTitle: "Contact the Indian Restaurants in London Directory",
    heading: "Contact the Indian Restaurants in London Directory",
    href: "/contact",
    description: `Contact ${siteConfig.name} about corrections, partnerships, listing updates, or general questions.`,
    sections: [
      {
        heading: "General Directory Questions",
        body: "Use this page as the contact point for directory questions, feedback, corrections, and partnership enquiries."
      },
      {
        heading: "Indian Restaurant Listing Updates",
        body: "Restaurants can request corrections for opening hours, contact links, service options, photos, categories, or closed-status information."
      },
      {
        heading: "What to Include in Your Message",
        body: "Messages should include the restaurant name, location, the detail that needs review, and a source that helps verify the change."
      }
    ]
  },
  {
    key: "privacy",
    title: "Privacy Policy",
    metadataTitle: "Privacy Policy for This Restaurant Directory",
    heading: "Privacy Policy for This Restaurant Directory",
    href: "/privacy-policy",
    description: `Privacy information for visitors using ${siteConfig.name}.`,
    sections: [
      {
        heading: "Information This Restaurant Directory May Use",
        body: "The directory may use privacy-friendly analytics, browser storage for saved listings, and information submitted voluntarily through contact or update requests."
      },
      {
        heading: "Saved Restaurant Listings",
        body: "Saved and compared listings can work in the visitor's browser, so they may remain on the device unless the browser data is cleared."
      },
      {
        heading: "Third-Party Restaurant Links",
        body: "Restaurant websites, maps, booking platforms, delivery platforms, review pages, and social links are controlled by third parties with their own privacy practices."
      }
    ]
  },
  {
    key: "terms",
    title: "Terms",
    metadataTitle: "Terms for Using This Restaurant Directory",
    heading: "Terms for Using This Restaurant Directory",
    href: "/terms",
    description: `Terms for using ${siteConfig.name}.`,
    sections: [
      {
        heading: "Indian Restaurant Directory Information",
        body: "Listing details are provided for comparison and convenience. Restaurant hours, menus, prices, services, links, and availability can change."
      },
      {
        heading: "Check Details Before Visiting",
        body: "Visitors should check directly with the restaurant before travelling, booking, ordering, or relying on a specific service."
      },
      {
        heading: "External Restaurant Services",
        body: "Links to restaurant websites, maps, booking tools, delivery services, review pages, and social platforms are external services."
      }
    ]
  },
  {
    key: "methodology",
    title: "How We Rank",
    metadataTitle: "How We Rank Indian Restaurants in London",
    heading: "How We Rank Indian Restaurants in London",
    href: "/methodology",
    description: `How ${siteConfig.name} selects, sorts, and compares listings.`,
    sections: [
      {
        heading: "How Indian Restaurant Listings Are Selected",
        body: "Pages are built from the current directory dataset and focus on restaurants with enough useful information to help visitors compare options."
      },
      {
        heading: "Data Sources and Review Signals",
        body: "The directory uses imported local business data and Google review signals where available, including Google rating, Google review count, and Google review links for comparing restaurants."
      },
      {
        heading: "Review and Rating Limits",
        body: "The directory currently stores total Google rating and Google review count, but star-by-star review distribution is not currently imported. Visitors should check the restaurant profile and Google listing before relying on current ratings, hours, menus, prices, services, or availability."
      },
      {
        heading: "How Sorting and Filters Work",
        body: "Visitors can sort and filter by signals such as rating, review count, price, area, cuisine, service options, dietary options, and transport details when those fields are available."
      },
      {
        heading: "Quality and Indexation Rules",
        body: "Some listing and hub pages may be held back from search indexing when the available data is too thin, low quality, duplicated, or not useful enough."
      },
      {
        heading: "Paid Placement Disclosure",
        body: "The current template does not require paid placement. If paid placement is added later, it should be disclosed clearly on this page."
      }
    ]
  },
  {
    key: "suggest-update",
    title: "Suggest an Update",
    metadataTitle: "Suggest an Indian Restaurant Update",
    heading: "Suggest an Indian Restaurant Update",
    href: "/suggest-update",
    description: `Suggest corrections or missing restaurant information for ${siteConfig.name}.`,
    sections: [
      {
        heading: "What Restaurant Details to Report",
        body: "Report wrong hours, closed restaurants, broken website links, wrong phone numbers, missing restaurants, incorrect categories, outdated service details, Google rating issues, Google review count issues, or broken Google review links."
      },
      {
        heading: "What to Include in an Update",
        body: "Include the restaurant name, area, the detail that looks wrong, the suggested correction, and a source that helps verify the update."
      },
      {
        heading: "How Restaurant Updates Are Reviewed",
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

export function getTrustPageMetadata(page: TrustPage): Metadata {
  return {
    title: page.metadataTitle,
    description: page.description,
    alternates: { canonical: page.href },
    ...pageShareMetadata({
      title: page.metadataTitle,
      description: page.description,
      path: page.href
    })
  };
}
