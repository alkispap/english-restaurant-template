import type { Metadata } from "next";
import { DirectoryAnalyticsTracker } from "@/components/DirectoryAnalyticsTracker";
import { DirectoryListingsPage } from "@/components/DirectoryListingsPage";
import { siteConfig } from "@/config/site";
import { homepageHeadings } from "@/lib/homepage-headings";
import { pageShareMetadata } from "@/lib/share-metadata";
import { organizationJsonLd, websiteJsonLd } from "@/lib/structured-data";

export function generateMetadata(): Metadata {
  const title = "Indian Restaurants in London Directory";

  return {
    title,
    description: siteConfig.description,
    alternates: {
      canonical: "/"
    },
    ...pageShareMetadata({ title, description: siteConfig.description, path: "/" })
  };
}

export default function HomePage() {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href={siteConfig.heroImageMobile}
        media="(max-width: 639px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href={siteConfig.heroImage}
        media="(min-width: 640px)"
        fetchPriority="high"
      />
      <DirectoryAnalyticsTracker pageType="homepage" route="/" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
      />
      <DirectoryListingsPage
        basePath="/"
        title={homepageHeadings.heroTitle}
        description={homepageHeadings.heroDescription}
      />
    </>
  );
}

