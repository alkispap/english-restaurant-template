import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DirectoryAnalyticsTracker } from "@/components/DirectoryAnalyticsTracker";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { getFacetSeoPage, toSeoMetadata } from "@/lib/seo-pages";
import { getStaticFacetParams } from "@/lib/static-route-params";

type ServicePageProps = {
  params: Promise<{ service: string }>;
};

export function generateStaticParams() {
  return getStaticFacetParams("service", "service");
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { service } = await params;
  return toSeoMetadata(getFacetSeoPage("service", service, {}));
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { service } = await params;
  const page = getFacetSeoPage("service", service, {});
  if (!page) notFound();

  return (
    <>
      <DirectoryAnalyticsTracker pageType="facet_hub" route={page.metadata.canonical} />
      <SeoLandingPage page={page} />
    </>
  );
}
