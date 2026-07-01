import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideArticleContent } from "@/components/GuideArticleContent";
import { getArticleRouteMetadata, getPublishedArticleBySlug, getPublicGuideArticles } from "@/lib/articles";
import { shouldGenerateFullStaticParams } from "@/lib/static-build";

type GuideArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  if (!shouldGenerateFullStaticParams()) return [];

  return getPublicGuideArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: GuideArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getPublishedArticleBySlug(slug);
  if (!article) return {};

  return getArticleRouteMetadata(article);
}

export default async function GuideArticlePage({ params }: GuideArticlePageProps) {
  const { slug } = await params;
  const article = getPublishedArticleBySlug(slug) ?? notFound();
  return <GuideArticleContent article={article} />;
}
