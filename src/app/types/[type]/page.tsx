import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { getFacetSeoPage, toSeoMetadata, type SeoPageSearchParams } from "@/lib/seo-pages";

type TypePageProps = {
  params: Promise<{ type: string }>;
  searchParams: Promise<SeoPageSearchParams>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: TypePageProps): Promise<Metadata> {
  const { type } = await params;
  return toSeoMetadata(getFacetSeoPage("type", type, {}));
}

export default async function TypePage({ params, searchParams }: TypePageProps) {
  const { type } = await params;
  const page = getFacetSeoPage("type", type, await searchParams);
  if (!page) notFound();

  return <SeoLandingPage page={page} />;
}
