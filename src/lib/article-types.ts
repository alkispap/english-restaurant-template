export const ARTICLE_STATUSES = [
  "idea",
  "planned",
  "researched",
  "drafted",
  "reviewed",
  "scheduled",
  "published",
  "skipped"
] as const;

export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export type ArticleInternalLink = {
  label: string;
  href: string;
  reason?: string;
};

export type ArticlePlanItem = {
  id: string;
  cluster: string;
  title: string;
  slug: string;
  primaryKeyword: string;
  supportingKeywords: string[];
  intent: string;
  priority: number;
  status: ArticleStatus;
  plannedPublishDate: string;
  draftPath: string;
  internalLinks: ArticleInternalLink[];
  researchNotesPath: string;
  similarTopicIds: string[];
};

export type ArticleSection = {
  heading: string;
  body: string[];
};

export type ArticleFaq = {
  question: string;
  answer: string;
};

export type ArticleResearchSource = {
  title: string;
  url: string;
  note?: string;
};

export type ArticleImage = {
  src: string;
  alt: string;
  caption?: string;
};

export type ArticleKeyFact = {
  label: string;
  value: string;
  detail?: string;
};

export type ArticleVisualBlock = {
  title: string;
  image: ArticleImage;
  body?: string;
};

export type ArticleDataItem = {
  label: string;
  value: string;
  detail?: string;
};

export type ArticleDataBlock = {
  title: string;
  description?: string;
  sourceLabel?: string;
  items: ArticleDataItem[];
};

export type ArticleComparisonRow = {
  label: string;
  values: string[];
};

export type ArticleComparisonTable = {
  title: string;
  columns: string[];
  rows: ArticleComparisonRow[];
};

export type ArticleCtaBlock = {
  title: string;
  copy: string;
  href: string;
  label: string;
};

export type ArticleContent = {
  slug: string;
  status: ArticleStatus;
  title: string;
  metaTitle: string;
  metaDescription: string;
  answer: string;
  publishedAt: string;
  updatedAt: string;
  cluster: string;
  primaryKeyword: string;
  heroImage?: ArticleImage;
  keyFacts?: ArticleKeyFact[];
  visualBlocks?: ArticleVisualBlock[];
  dataBlocks?: ArticleDataBlock[];
  comparisonTables?: ArticleComparisonTable[];
  ctaBlocks?: ArticleCtaBlock[];
  sections: ArticleSection[];
  faqs: ArticleFaq[];
  internalLinks: ArticleInternalLink[];
  researchSources: ArticleResearchSource[];
};

export type ArticleResearchNotes = {
  articleId: string;
  query: string;
  researchedAt: string;
  sources: ArticleResearchSource[];
  commonThemes: string[];
  commonHeadings: string[];
  relatedQuestions: string[];
  contentGaps: string[];
  internalLinkOpportunities: ArticleInternalLink[];
};

export type ArticleDuplicateWarning = {
  type: "duplicate-slug" | "duplicate-keyword" | "existing-article" | "similar-topic";
  topicIds: string[];
  message: string;
  blocking: boolean;
};
