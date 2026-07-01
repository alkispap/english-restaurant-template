import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideArticleContent } from "@/components/GuideArticleContent";
import { getDraftPreviewArticles, getDraftPreviewRouteMetadata, getPreviewArticleBySlug } from "@/lib/articles";

type GuidePreviewPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getDraftPreviewArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: GuidePreviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getPreviewArticleBySlug(slug);
  if (!article) {
    return {
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return getDraftPreviewRouteMetadata(article);
}

export default async function GuidePreviewPage({ params }: GuidePreviewPageProps) {
  const { slug } = await params;
  const article = getPreviewArticleBySlug(slug) ?? notFound();

  return <GuideArticleContent article={article} preview />;
}
