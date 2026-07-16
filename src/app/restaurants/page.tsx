import type { Metadata } from "next";
import { DirectoryAnalyticsTracker } from "@/components/DirectoryAnalyticsTracker";
import { DirectoryListingsPage } from "@/components/DirectoryListingsPage";
import { siteConfig } from "@/config/site";
import { directoryIndexHeadings } from "@/lib/directory-index-headings";
import { directorySearchPath } from "@/lib/routes";
import { pageShareMetadata } from "@/lib/share-metadata";

export function generateMetadata(): Metadata {
  const title = `Search ${siteConfig.localNicheTitle} in ${siteConfig.cityOrRegion}`;
  const description = `Search ${siteConfig.localNiche} in ${siteConfig.cityOrRegion} by area, cuisine, rating, service options, dietary needs, transport links, and dining style.`;
  const canonical = directorySearchPath();

  return {
    title,
    description,
    alternates: {
      canonical
    },
    ...pageShareMetadata({ title, description, path: canonical })
  };
}

export default function RestaurantsPage() {
  return (
    <>
      <DirectoryAnalyticsTracker pageType="directory_search" route={directorySearchPath()} />
      <DirectoryListingsPage
        basePath={directorySearchPath()}
        title={directoryIndexHeadings.title}
        description={directoryIndexHeadings.description}
        headingContext={directoryIndexHeadings.resultsHeadingContext}
      />
    </>
  );
}
