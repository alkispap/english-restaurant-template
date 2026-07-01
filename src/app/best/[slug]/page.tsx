import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DirectoryAnalyticsTracker } from "@/components/DirectoryAnalyticsTracker";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { getPopularSearchSeoPage, toSeoMetadata } from "@/lib/seo-pages";
import { getStaticPopularSearchParams } from "@/lib/static-route-params";

type PopularSearchPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getStaticPopularSearchParams();
}

export async function generateMetadata({ params }: PopularSearchPageProps): Promise<Metadata> {
  const { slug } = await params;
  return toSeoMetadata(getPopularSearchSeoPage(slug, {}));
}

export default async function PopularSearchPage({ params }: PopularSearchPageProps) {
  const { slug } = await params;
  const page = getPopularSearchSeoPage(slug, {});
  if (!page) notFound();

  return (
    <>
      <DirectoryAnalyticsTracker pageType="best_hub" route={page.metadata.canonical} />
      <SeoLandingPage page={page} />
    </>
  );
}
