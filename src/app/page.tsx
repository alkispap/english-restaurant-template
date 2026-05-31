import type { Metadata } from "next";
import { DirectoryAnalyticsTracker } from "@/components/DirectoryAnalyticsTracker";
import { DirectoryListingsPage } from "@/components/DirectoryListingsPage";
import { siteConfig } from "@/config/site";
import { homepageHeadings } from "@/lib/homepage-headings";
import {
  getNoindexFollowRobots,
  resolveCanonicalForSearchParams,
  shouldNoindexSearchParams,
  type SeoSearchParams
} from "@/lib/seo-policy";

type HomePageMetadataProps = {
  searchParams: Promise<SeoSearchParams>;
};

type HomePageProps = {
  searchParams: Promise<SeoSearchParams>;
};

export async function generateMetadata({ searchParams }: HomePageMetadataProps): Promise<Metadata> {
  const params = await searchParams;
  const hasQueryState = shouldNoindexSearchParams(params);

  return {
    title: siteConfig.niche,
    description: siteConfig.description,
    alternates: {
      canonical: hasQueryState ? resolveCanonicalForSearchParams(params) : "/"
    },
    robots: hasQueryState ? getNoindexFollowRobots() : undefined
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  return (
    <>
      <DirectoryAnalyticsTracker pageType="homepage" route="/" />
      <DirectoryListingsPage
        searchParams={await searchParams}
        basePath="/"
        title={homepageHeadings.heroTitle}
        description={homepageHeadings.heroDescription}
      />
    </>
  );
}

