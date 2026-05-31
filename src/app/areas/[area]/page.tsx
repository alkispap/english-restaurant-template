import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DirectoryAnalyticsTracker } from "@/components/DirectoryAnalyticsTracker";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { getAreaSeoPage, toSeoMetadata, type SeoPageSearchParams } from "@/lib/seo-pages";

type AreaPageProps = {
  params: Promise<{ area: string }>;
  searchParams: Promise<SeoPageSearchParams>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: AreaPageProps): Promise<Metadata> {
  const { area } = await params;
  return toSeoMetadata(getAreaSeoPage(area, await searchParams));
}

export default async function AreaPage({ params, searchParams }: AreaPageProps) {
  const { area } = await params;
  const page = getAreaSeoPage(area, await searchParams);
  if (!page) notFound();

  return (
    <>
      <DirectoryAnalyticsTracker pageType="area_hub" route={page.metadata.canonical} />
      <SeoLandingPage page={page} />
    </>
  );
}
