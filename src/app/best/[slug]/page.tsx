import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DirectoryAnalyticsTracker } from "@/components/DirectoryAnalyticsTracker";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { getPopularSearchSeoPage, toSeoMetadata, type SeoPageSearchParams } from "@/lib/seo-pages";

type PopularSearchPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SeoPageSearchParams>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: PopularSearchPageProps): Promise<Metadata> {
  const { slug } = await params;
  return toSeoMetadata(getPopularSearchSeoPage(slug, await searchParams));
}

export default async function PopularSearchPage({ params, searchParams }: PopularSearchPageProps) {
  const { slug } = await params;
  const page = getPopularSearchSeoPage(slug, await searchParams);
  if (!page) notFound();

  return (
    <>
      <DirectoryAnalyticsTracker pageType="best_hub" route={page.metadata.canonical} />
      <SeoLandingPage page={page} />
    </>
  );
}
