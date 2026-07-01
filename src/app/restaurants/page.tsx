import type { Metadata } from "next";
import { DirectoryAnalyticsTracker } from "@/components/DirectoryAnalyticsTracker";
import { DirectoryListingsPage } from "@/components/DirectoryListingsPage";
import { directoryIndexHeadings } from "@/lib/directory-index-headings";
import { directorySearchPath } from "@/lib/routes";
import { pageShareMetadata } from "@/lib/share-metadata";

export function generateMetadata(): Metadata {
  const title = "Search Indian Restaurants in London";
  const description =
    "Search Indian restaurants in London by area, cuisine, rating, service options, dietary needs, transport links, and dining style.";
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
