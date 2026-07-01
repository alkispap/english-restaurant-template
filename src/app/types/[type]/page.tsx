import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DirectoryAnalyticsTracker } from "@/components/DirectoryAnalyticsTracker";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { getFacetSeoPage, toSeoMetadata } from "@/lib/seo-pages";
import { getStaticFacetParams } from "@/lib/static-route-params";

type TypePageProps = {
  params: Promise<{ type: string }>;
};

export function generateStaticParams() {
  return getStaticFacetParams("type", "type");
}

export async function generateMetadata({ params }: TypePageProps): Promise<Metadata> {
  const { type } = await params;
  return toSeoMetadata(getFacetSeoPage("type", type, {}));
}

export default async function TypePage({ params }: TypePageProps) {
  const { type } = await params;
  const page = getFacetSeoPage("type", type, {});
  if (!page) notFound();

  return (
    <>
      <DirectoryAnalyticsTracker pageType="facet_hub" route={page.metadata.canonical} />
      <SeoLandingPage page={page} />
    </>
  );
}
