import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DirectoryAnalyticsTracker } from "@/components/DirectoryAnalyticsTracker";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { getAreaCategorySeoPage, toSeoMetadata } from "@/lib/seo-pages";
import { getStaticAreaCategoryParams } from "@/lib/static-route-params";

type AreaCategoryPageProps = {
  params: Promise<{ area: string; category: string }>;
};

export function generateStaticParams() {
  return getStaticAreaCategoryParams();
}

export async function generateMetadata({ params }: AreaCategoryPageProps): Promise<Metadata> {
  const { area, category } = await params;
  return toSeoMetadata(getAreaCategorySeoPage(area, category, {}));
}

export default async function AreaCategoryPage({ params }: AreaCategoryPageProps) {
  const { area, category } = await params;
  const page = getAreaCategorySeoPage(area, category, {});
  if (!page) notFound();

  return (
    <>
      <DirectoryAnalyticsTracker pageType="area_category_hub" route={page.metadata.canonical} />
      <SeoLandingPage page={page} />
    </>
  );
}
