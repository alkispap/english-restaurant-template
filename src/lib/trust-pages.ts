import { siteConfig } from "@/config/site";
import { mapProviderConfig } from "@/config/map-provider";
import type { Metadata } from "next";
import { pageShareMetadata } from "@/lib/share-metadata";

export type TrustPageSection = {
  heading: string;
  body: string;
  links?: readonly {
    label: string;
    href: string;
  }[];
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
    metadataTitle: `About This ${siteConfig.localNicheSingularTitle} Directory`,
    heading: `About This ${siteConfig.localNicheSingularTitle} Directory`,
    href: "/about",
    description: `${siteConfig.name} is a local directory for comparing ${siteConfig.niche}.`,
    sections: [
      {
        heading: `What This ${siteConfig.localNicheSingularTitle} Directory Does`,
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
        heading: `How to Use the ${siteConfig.localNicheSingularTitle} Directory`,
        body: "Use the filters, area pages, category pages, comparison tools, and listing details to shortlist restaurants before checking directly with the restaurant."
      }
    ]
  },
  {
    key: "contact",
    title: "Contact",
    metadataTitle: `Contact the ${siteConfig.localNicheTitle} in ${siteConfig.cityOrRegion} Directory`,
    heading: `Contact the ${siteConfig.localNicheTitle} in ${siteConfig.cityOrRegion} Directory`,
    href: "/contact",
    description: `Contact ${siteConfig.name} about corrections, partnerships, listing updates, or general questions.`,
    sections: [
      {
        heading: "General Directory Questions",
        body: "Use this page as the contact point for directory questions, feedback, corrections, and partnership enquiries."
      },
      {
        heading: `${siteConfig.cuisineLabel} Restaurant Listing Updates`,
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
        heading: "Current Analytics and Data Collection",
        body: "The current site does not send analytics events to an external analytics provider and does not set analytics cookies. Interface events stay in the page unless a separately configured analytics adapter is added later. This policy and any required consent controls must be updated before external analytics is enabled."
      },
      {
        heading: "Browser Storage for Saved Listings and Comments",
        body: "Saved and compared restaurant identifiers and listing comments are stored in the visitor's browser so those requested features work. Browser comments are private to that browser: they are not published or sent to this directory. This data remains on the device until it is removed in the interface or the browser data is cleared."
      },
      {
        heading: "Location Permission",
        body: "The near-you feature asks for location only after the visitor selects it. Coordinates are used in the browser to choose the nearest directory area and are not stored or sent to this directory. The browser, device, or location provider may apply its own privacy terms."
      },
      {
        heading: "Optional Account Synchronisation",
        body: "Account synchronisation is currently disabled. If it is enabled with Supabase, sign-in details, saved restaurant identifiers, and private notes will be sent to the configured account service; Google or Microsoft will also process data when that sign-in option is chosen. The production privacy notice and provider details must be reviewed before activation."
      },
      {
        heading: "Contact and Update Requests",
        body: "The current contact page provides guidance only. The suggest-an-update form prepares correction text in the visitor's browser and does not automatically submit, publish, or retain it. If a corrections email address is configured, choosing to open an email app passes the generated text to the visitor's email provider and the directory mailbox; their retention policies then apply."
      },
      {
        heading: "Embedded OpenStreetMap",
        body: "The interactive directory map does not request map tiles in ordinary list view. When a visitor chooses Map view or opens a map-view URL, their browser requests tiles directly from the OpenStreetMap Foundation. Standard connection information, including the visitor's IP address, browser and device information, referring site origin, request time, and requested tiles, may be processed under the OpenStreetMap Foundation privacy policy. This directory does not use those tile requests for its own analytics.",
        links: [
          { label: "OpenStreetMap Foundation privacy policy", href: mapProviderConfig.privacyPolicyUrl },
          { label: "OpenStreetMap tile usage policy", href: mapProviderConfig.tileUsagePolicyUrl }
        ]
      },
      {
        heading: "Third-Party Restaurant Links",
        body: "Restaurant websites, maps, booking platforms, delivery platforms, review pages, and social links are controlled by third parties with their own privacy practices."
      },
      {
        heading: "Advertising and Cookies",
        body: "Public guide and directory pages may load advertisements from Adsterra and other third-party ad partners. These ads can use third-party scripts, cookies, or similar technologies to deliver and measure advertising. Advertisement placements are not shown in the editor. Review Adsterra's privacy terms and manage any applicable cookie-consent preferences before continuing to use the site."
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
        heading: `${siteConfig.cuisineLabel} Restaurant Directory Information`,
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
    metadataTitle: `How We Rank ${siteConfig.localNicheTitle} in ${siteConfig.cityOrRegion}`,
    heading: `How We Rank ${siteConfig.localNicheTitle} in ${siteConfig.cityOrRegion}`,
    href: "/methodology",
    description: `How ${siteConfig.name} selects, sorts, and compares listings.`,
    sections: [
      {
        heading: `How ${siteConfig.cuisineLabel} Restaurant Listings Are Selected`,
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
    metadataTitle: `Suggest ${indefiniteArticle(siteConfig.cuisineLabel)} ${siteConfig.cuisineLabel} Restaurant Update`,
    heading: `Suggest ${indefiniteArticle(siteConfig.cuisineLabel)} ${siteConfig.cuisineLabel} Restaurant Update`,
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
        body: "Suggested changes are evidence requests, not automatic edits. A directory editor should compare the public source, record the fields checked and check date, and either verify the record or retain conflicting evidence for manual review."
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

function indefiniteArticle(value: string) {
  return /^[aeiou]/i.test(value) ? "an" : "a";
}
