import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DirectoryAnalyticsTracker } from "@/components/DirectoryAnalyticsTracker";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { getAreaSeoPage, toSeoMetadata } from "@/lib/seo-pages";
import { getStaticAreaParams } from "@/lib/static-route-params";

type AreaPageProps = {
  params: Promise<{ area: string }>;
};

export function generateStaticParams() {
  return getStaticAreaParams();
}

export async function generateMetadata({ params }: AreaPageProps): Promise<Metadata> {
  const { area } = await params;
  return toSeoMetadata(getAreaSeoPage(area, {}));
}

export default async function AreaPage({ params }: AreaPageProps) {
  const { area } = await params;
  const page = getAreaSeoPage(area, {});
  if (!page) notFound();

  return (
    <>
      <DirectoryAnalyticsTracker pageType="area_hub" route={page.metadata.canonical} />
      <SeoLandingPage page={page} />
    </>
  );
}
