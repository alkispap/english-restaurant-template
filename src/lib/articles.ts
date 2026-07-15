import fs from "node:fs";
import path from "node:path";
import type { Metadata, MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { canonicalPageUrl } from "@/lib/canonical-page-url";
import type { ArticleContent, ArticleImage, ArticlePlanItem } from "@/lib/article-types";
import { pageShareMetadata } from "@/lib/share-metadata";

export const ARTICLE_PLAN_FILE = path.join(process.cwd(), "content", "article-plan.json");
export const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");
export const RESEARCH_DIR = path.join(process.cwd(), "content", "research");

export function guidePath(slug?: string) {
  return slug ? `/guides/${slug}` : "/guides";
}

export function guidePreviewPath(slug?: string) {
  return slug ? `/guides/preview/${slug}` : "/guides/preview";
}

export function getArticlePlan() {
  return readJsonFile<ArticlePlanItem[]>(ARTICLE_PLAN_FILE, []);
}

export function getAllArticles() {
  return readJsonDirectory<ArticleContent>(ARTICLES_DIR);
}

export function getPublicGuideArticles(articles: ArticleContent[] = getAllArticles()) {
  return articles
    .filter((article) => article.status === "published")
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title));
}

export function getDraftPreviewArticles(articles: ArticleContent[] = getAllArticles()) {
  return articles
    .filter((article) => article.status === "drafted")
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getArticleBySlug(slug: string, articles: ArticleContent[] = getAllArticles()) {
  return articles.find((article) => article.slug === slug);
}

export function getPublishedArticleBySlug(slug: string, articles: ArticleContent[] = getAllArticles()) {
  const article = getArticleBySlug(slug, articles);
  return article?.status === "published" ? article : undefined;
}

export function getPreviewArticleBySlug(slug: string, articles: ArticleContent[] = getAllArticles()) {
  const article = getArticleBySlug(slug, articles);
  return article?.status === "drafted" ? article : undefined;
}

export function buildArticlePageTitle(article: Pick<ArticleContent, "metaTitle">) {
  return article.metaTitle.replace(/\s+\|\s+Guide$/i, "");
}

export function getArticleRouteMetadata(article: ArticleContent): Metadata {
  const title = buildArticlePageTitle(article);
  const canonical = guidePath(article.slug);
  const primaryImage = getArticleImages(article)[0];

  return {
    title,
    description: article.metaDescription,
    alternates: {
      canonical
    },
    ...pageShareMetadata({
      title,
      description: article.metaDescription,
      path: canonical,
      image: primaryImage?.src,
      imageAlt: primaryImage?.alt
    })
  };
}

export function getDraftPreviewRouteMetadata(article: ArticleContent): Metadata {
  const title = buildArticlePageTitle(article);
  const canonical = guidePreviewPath(article.slug);
  const primaryImage = getArticleImages(article)[0];

  return {
    title,
    description: article.metaDescription,
    alternates: {
      canonical
    },
    robots: {
      index: false,
      follow: false
    },
    ...pageShareMetadata({
      title,
      description: article.metaDescription,
      path: canonical,
      image: primaryImage?.src,
      imageAlt: primaryImage?.alt
    })
  };
}

export function articleSitemapRoutes(baseUrl: string, articles: ArticleContent[] = getPublicGuideArticles()): MetadataRoute.Sitemap {
  return getPublicGuideArticles(articles).map((article) => ({
    url: canonicalPageUrl(baseUrl, guidePath(article.slug)),
    lastModified: article.updatedAt || article.publishedAt
  }));
}

export function buildArticleJsonLd(article: ArticleContent): Record<string, unknown> {
  const images = getArticleImages(article).map((image) => absoluteUrl(image.src));

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    mainEntityOfPage: canonicalPageUrl(siteConfig.url, guidePath(article.slug)),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      "@type": "Organization",
      name: siteConfig.name
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name
    },
    ...(images.length ? { image: images } : {}),
    keywords: [article.primaryKeyword, article.cluster].filter(Boolean)
  };
}

export function buildArticleFaqJsonLd(article: ArticleContent): Record<string, unknown> | undefined {
  if (!article.faqs.length) return undefined;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
}

export function articleContentPath(slug: string) {
  return path.join(ARTICLES_DIR, `${slug}.json`);
}

export function articleResearchNotesPath(slug: string) {
  return path.join(RESEARCH_DIR, `${slug}.md`);
}

export function getArticleImages(article: ArticleContent): ArticleImage[] {
  const images = [
    article.heroImage,
    ...(article.visualBlocks ?? []).map((block) => block.image)
  ].filter(Boolean) as ArticleImage[];

  return images.filter((image, index) => images.findIndex((candidate) => candidate.src === image.src) === index);
}

export function getArticlePrimaryImage(article: ArticleContent) {
  return getArticleImages(article)[0]?.src;
}

function absoluteUrl(src: string) {
  if (/^https?:\/\//i.test(src)) return src;
  return `${siteConfig.url}${src.startsWith("/") ? src : `/${src}`}`;
}

function readJsonDirectory<T>(dir: string) {
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .flatMap((file) => {
      const value = readJsonFile<T | undefined>(path.join(dir, file), undefined);
      return value ? [value] : [];
    });
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}
