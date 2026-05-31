import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DirectoryAnalyticsTracker } from "@/components/DirectoryAnalyticsTracker";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { getFacetSeoPage, toSeoMetadata, type SeoPageSearchParams } from "@/lib/seo-pages";

type ServicePageProps = {
  params: Promise<{ service: string }>;
  searchParams: Promise<SeoPageSearchParams>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: ServicePageProps): Promise<Metadata> {
  const { service } = await params;
  return toSeoMetadata(getFacetSeoPage("service", service, await searchParams));
}

export default async function ServicePage({ params, searchParams }: ServicePageProps) {
  const { service } = await params;
  const page = getFacetSeoPage("service", service, await searchParams);
  if (!page) notFound();

  return (
    <>
      <DirectoryAnalyticsTracker pageType="facet_hub" route={page.metadata.canonical} />
      <SeoLandingPage page={page} />
    </>
  );
}
