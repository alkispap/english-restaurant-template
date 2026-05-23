import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { getAreaCategorySeoPage, toSeoMetadata, type SeoPageSearchParams } from "@/lib/seo-pages";

type AreaCategoryPageProps = {
  params: Promise<{ area: string; category: string }>;
  searchParams: Promise<SeoPageSearchParams>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: AreaCategoryPageProps): Promise<Metadata> {
  const { area, category } = await params;
  return toSeoMetadata(getAreaCategorySeoPage(area, category, {}));
}

export default async function AreaCategoryPage({ params, searchParams }: AreaCategoryPageProps) {
  const { area, category } = await params;
  const page = getAreaCategorySeoPage(area, category, await searchParams);
  if (!page) notFound();

  return <SeoLandingPage page={page} />;
}
