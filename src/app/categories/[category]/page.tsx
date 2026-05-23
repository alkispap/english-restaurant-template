import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { getCategorySeoPage, toSeoMetadata, type SeoPageSearchParams } from "@/lib/seo-pages";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<SeoPageSearchParams>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  return toSeoMetadata(getCategorySeoPage(category, {}));
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = await params;
  const page = getCategorySeoPage(category, await searchParams);
  if (!page) notFound();

  return <SeoLandingPage page={page} />;
}
