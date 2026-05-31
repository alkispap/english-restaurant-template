import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DirectoryAnalyticsTracker } from "@/components/DirectoryAnalyticsTracker";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { getNeighborhoodSeoPage, toSeoMetadata, type SeoPageSearchParams } from "@/lib/seo-pages";

type NeighborhoodPageProps = {
  params: Promise<{ neighborhood: string }>;
  searchParams: Promise<SeoPageSearchParams>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: NeighborhoodPageProps): Promise<Metadata> {
  const { neighborhood } = await params;
  return toSeoMetadata(getNeighborhoodSeoPage(neighborhood, await searchParams));
}

export default async function NeighborhoodPage({ params, searchParams }: NeighborhoodPageProps) {
  const { neighborhood } = await params;
  const page = getNeighborhoodSeoPage(neighborhood, await searchParams);
  if (!page) notFound();

  return (
    <>
      <DirectoryAnalyticsTracker pageType="neighborhood_hub" route={page.metadata.canonical} />
      <SeoLandingPage page={page} />
    </>
  );
}
