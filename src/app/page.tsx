import type { Metadata } from "next";
import { DirectoryAnalyticsTracker } from "@/components/DirectoryAnalyticsTracker";
import { DirectoryLandingPage } from "@/components/DirectoryLandingPage";
import { JsonLd } from "@/components/JsonLd";
import { siteConfig } from "@/config/site";
import { getDirectorySummary } from "@/lib/directory-summary";
import { pageShareMetadata } from "@/lib/share-metadata";
import { organizationJsonLd, websiteJsonLd } from "@/lib/structured-data";

export function generateMetadata(): Metadata {
  const title = "Indian Restaurants in London Directory";
  const description = getDirectorySummary();

  return {
    title,
    description,
    alternates: {
      canonical: "/"
    },
    ...pageShareMetadata({ title, description, path: "/" })
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
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <DirectoryLandingPage />
    </>
  );
}

