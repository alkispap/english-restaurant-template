import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DirectoryAnalyticsTracker } from "@/components/DirectoryAnalyticsTracker";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { getFacetSeoPage, toSeoMetadata, type SeoPageSearchParams } from "@/lib/seo-pages";

type OfferingPageProps = {
  params: Promise<{ offering: string }>;
  searchParams: Promise<SeoPageSearchParams>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: OfferingPageProps): Promise<Metadata> {
  const { offering } = await params;
  return toSeoMetadata(getFacetSeoPage("offering", offering, await searchParams));
}

export default async function OfferingPage({ params, searchParams }: OfferingPageProps) {
  const { offering } = await params;
  const page = getFacetSeoPage("offering", offering, await searchParams);
  if (!page) notFound();

  return (
    <>
      <DirectoryAnalyticsTracker pageType="facet_hub" route={page.metadata.canonical} />
      <SeoLandingPage page={page} />
    </>
  );
}
