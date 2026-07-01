import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DirectoryAnalyticsTracker } from "@/components/DirectoryAnalyticsTracker";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { getFacetSeoPage, toSeoMetadata } from "@/lib/seo-pages";
import { getStaticFacetParams } from "@/lib/static-route-params";

type DietaryPageProps = {
  params: Promise<{ dietary: string }>;
};

export function generateStaticParams() {
  return getStaticFacetParams("dietary", "dietary");
}

export async function generateMetadata({ params }: DietaryPageProps): Promise<Metadata> {
  const { dietary } = await params;
  return toSeoMetadata(getFacetSeoPage("dietary", dietary, {}));
}

export default async function DietaryPage({ params }: DietaryPageProps) {
  const { dietary } = await params;
  const page = getFacetSeoPage("dietary", dietary, {});
  if (!page) notFound();

  return (
    <>
      <DirectoryAnalyticsTracker pageType="facet_hub" route={page.metadata.canonical} />
      <SeoLandingPage page={page} />
    </>
  );
}
