import fs from "node:fs";
import path from "node:path";
import type { Metadata, MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import type { ArticleContent, ArticlePlanItem } from "@/lib/article-types";

export const ARTICLE_PLAN_FILE = path.join(process.cwd(), "content", "article-plan.json");
export const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");
export const RESEARCH_DIR = path.join(process.cwd(), "content", "research");

export function guidePath(slug?: string) {
  return slug ? `/guides/${slug}` : "/guides";
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

export function getArticleBySlug(slug: string, articles: ArticleContent[] = getAllArticles()) {
  return articles.find((article) => article.slug === slug);
}

export function getPublishedArticleBySlug(slug: string, articles: ArticleContent[] = getAllArticles()) {
  const article = getArticleBySlug(slug, articles);
  return article?.status === "published" ? article : undefined;
}

export function getArticleRouteMetadata(article: ArticleContent): Metadata {
  return {
    title: article.metaTitle,
    description: article.metaDescription,
    alternates: {
      canonical: guidePath(article.slug)
    }
  };
}

export function articleSitemapRoutes(baseUrl: string, articles: ArticleContent[] = getPublicGuideArticles()): MetadataRoute.Sitemap {
  return getPublicGuideArticles(articles).map((article) => ({
    url: `${baseUrl}${guidePath(article.slug)}`,
    lastModified: article.updatedAt || article.publishedAt
  }));
}

export function buildArticleJsonLd(article: ArticleContent): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    mainEntityOfPage: `${siteConfig.url}${guidePath(article.slug)}`,
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
