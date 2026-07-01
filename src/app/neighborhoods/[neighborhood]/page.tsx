import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DirectoryAnalyticsTracker } from "@/components/DirectoryAnalyticsTracker";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { getNeighborhoodSeoPage, toSeoMetadata } from "@/lib/seo-pages";
import { getStaticNeighborhoodParams } from "@/lib/static-route-params";

type NeighborhoodPageProps = {
  params: Promise<{ neighborhood: string }>;
};

export function generateStaticParams() {
  return getStaticNeighborhoodParams();
}

export async function generateMetadata({ params }: NeighborhoodPageProps): Promise<Metadata> {
  const { neighborhood } = await params;
  return toSeoMetadata(getNeighborhoodSeoPage(neighborhood, {}));
}

export default async function NeighborhoodPage({ params }: NeighborhoodPageProps) {
  const { neighborhood } = await params;
  const page = getNeighborhoodSeoPage(neighborhood, {});
  if (!page) notFound();

  return (
    <>
      <DirectoryAnalyticsTracker pageType="neighborhood_hub" route={page.metadata.canonical} />
      <SeoLandingPage page={page} />
    </>
  );
}
