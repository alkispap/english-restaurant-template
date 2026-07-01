import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DirectoryAnalyticsTracker } from "@/components/DirectoryAnalyticsTracker";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { getFacetSeoPage, toSeoMetadata } from "@/lib/seo-pages";
import { getStaticFacetParams } from "@/lib/static-route-params";

type OfferingPageProps = {
  params: Promise<{ offering: string }>;
};

export function generateStaticParams() {
  return getStaticFacetParams("offering", "offering");
}

export async function generateMetadata({ params }: OfferingPageProps): Promise<Metadata> {
  const { offering } = await params;
  return toSeoMetadata(getFacetSeoPage("offering", offering, {}));
}

export default async function OfferingPage({ params }: OfferingPageProps) {
  const { offering } = await params;
  const page = getFacetSeoPage("offering", offering, {});
  if (!page) notFound();

  return (
    <>
      <DirectoryAnalyticsTracker pageType="facet_hub" route={page.metadata.canonical} />
      <SeoLandingPage page={page} />
    </>
  );
}
