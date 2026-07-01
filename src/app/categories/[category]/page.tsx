import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DirectoryAnalyticsTracker } from "@/components/DirectoryAnalyticsTracker";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { getCategorySeoPage, toSeoMetadata } from "@/lib/seo-pages";
import { getStaticCategoryParams } from "@/lib/static-route-params";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  return getStaticCategoryParams();
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  return toSeoMetadata(getCategorySeoPage(category, {}));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const page = getCategorySeoPage(category, {});
  if (!page) notFound();

  return (
    <>
      <DirectoryAnalyticsTracker pageType="category_hub" route={page.metadata.canonical} />
      <SeoLandingPage page={page} />
    </>
  );
}
