import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DirectoryAnalyticsTracker } from "@/components/DirectoryAnalyticsTracker";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { getFacetSeoPage, toSeoMetadata, type SeoPageSearchParams } from "@/lib/seo-pages";

type DietaryPageProps = {
  params: Promise<{ dietary: string }>;
  searchParams: Promise<SeoPageSearchParams>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: DietaryPageProps): Promise<Metadata> {
  const { dietary } = await params;
  return toSeoMetadata(getFacetSeoPage("dietary", dietary, await searchParams));
}

export default async function DietaryPage({ params, searchParams }: DietaryPageProps) {
  const { dietary } = await params;
  const page = getFacetSeoPage("dietary", dietary, await searchParams);
  if (!page) notFound();

  return (
    <>
      <DirectoryAnalyticsTracker pageType="facet_hub" route={page.metadata.canonical} />
      <SeoLandingPage page={page} />
    </>
  );
}
