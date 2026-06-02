import type { ArticleContent, ArticlePlanItem, ArticleResearchNotes } from "@/lib/article-types";

export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

export function buildResearchNotesFromSearchResults(
  plan: ArticlePlanItem,
  results: SearchResult[],
  researchedAt = new Date().toISOString()
): ArticleResearchNotes {
  return {
    articleId: plan.id,
    query: plan.primaryKeyword,
    researchedAt,
    sources: results.map((result) => ({
      title: result.title,
      url: result.url,
      note: result.snippet
    })),
    commonThemes: commonThemes(results),
    commonHeadings: commonHeadings(plan, results),
    relatedQuestions: relatedQuestions(plan),
    contentGaps: ["local directory connection", "clear internal links to relevant directory pages", "practical next steps for choosing a local business"],
    internalLinkOpportunities: plan.internalLinks
  };
}

export function buildDraftArticleFromPlanAndResearch(
  plan: ArticlePlanItem,
  research: ArticleResearchNotes,
  updatedAt = new Date().toISOString().slice(0, 10)
): ArticleContent {
  return {
    slug: plan.slug,
    status: "drafted",
    title: plan.title,
    metaTitle: `${plan.title} | Guide`,
    metaDescription: `Learn ${sentenceCase(plan.primaryKeyword)} with practical context, live-search themes, and useful directory links.`,
    publishedAt: "",
    updatedAt,
    cluster: plan.cluster,
    primaryKeyword: plan.primaryKeyword,
    sections: [
      {
        heading: `What ${plan.title.replace(/[?!.]+$/, "")} Covers`,
        body: [
          `This draft is prepared for the topic "${plan.primaryKeyword}" and should be reviewed before publication.`,
          "It is designed to support topical authority by explaining the subject clearly before linking readers into relevant directory pages."
        ]
      },
      {
        heading: "What Live Search Results Commonly Cover",
        body: [
          research.commonThemes.length
            ? `Current competing pages commonly cover ${humanList(research.commonThemes)}.`
            : "Current competing pages should be reviewed for recurring themes before this article is published.",
          "The final version should add useful context rather than repeating competitor structures."
        ]
      },
      {
        heading: "Content Gaps To Use",
        body: research.contentGaps.map((gap) => `Add a stronger angle around ${gap}.`)
      },
      {
        heading: "Useful Directory Links",
        body: plan.internalLinks.length
          ? plan.internalLinks.map((link) => `Link to ${link.label} at ${link.href}${link.reason ? ` because ${link.reason}` : ""}.`)
          : ["Add internal links to the strongest matching directory pages before review."]
      }
    ],
    faqs: [
      {
        question: `What should this ${plan.cluster.replace(/-/g, " ")} guide help readers understand?`,
        answer: `It should explain ${plan.primaryKeyword} in plain language and connect the topic to useful directory pages.`
      },
      {
        question: "Should this draft be published automatically?",
        answer: "No. The article workflow keeps generated articles as drafts until they have been reviewed."
      }
    ],
    internalLinks: plan.internalLinks,
    researchSources: research.sources
  };
}

export async function fetchLiveSearchResults(query: string, fetcher: typeof fetch = fetch): Promise<SearchResult[]> {
  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetcher(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 compatible topical-authority-research"
    }
  });
  const html = await response.text();
  return parseDuckDuckGoHtml(html).slice(0, 8);
}

export function researchNotesToMarkdown(research: ArticleResearchNotes) {
  return [
    `# Live Research Notes: ${research.query}`,
    "",
    `- Article ID: ${research.articleId}`,
    `- Researched at: ${research.researchedAt}`,
    "",
    "## Sources",
    ...research.sources.map((source) => `- [${source.title}](${source.url})${source.note ? ` - ${source.note}` : ""}`),
    "",
    "## Common Themes",
    ...research.commonThemes.map((theme) => `- ${theme}`),
    "",
    "## Common Headings",
    ...research.commonHeadings.map((heading) => `- ${heading}`),
    "",
    "## Related Questions",
    ...research.relatedQuestions.map((question) => `- ${question}`),
    "",
    "## Content Gaps",
    ...research.contentGaps.map((gap) => `- ${gap}`),
    "",
    "## Internal Link Opportunities",
    ...research.internalLinkOpportunities.map((link) => `- [${link.label}](${link.href})${link.reason ? ` - ${link.reason}` : ""}`),
    ""
  ].join("\n");
}

export function researchNotesFromMarkdown(markdown: string, plan: ArticlePlanItem): ArticleResearchNotes {
  return {
    articleId: valueAfterPrefix(markdown, "- Article ID:") || plan.id,
    query: markdown.match(/^# Live Research Notes: (.+)$/m)?.[1]?.trim() || plan.primaryKeyword,
    researchedAt: valueAfterPrefix(markdown, "- Researched at:") || new Date().toISOString(),
    sources: listSection(markdown, "Sources").map((line) => {
      const match = line.match(/^\[(.+?)\]\((.+?)\)(?: - (.+))?$/);
      return {
        title: match?.[1] ?? line,
        url: match?.[2] ?? "",
        note: match?.[3]
      };
    }),
    commonThemes: listSection(markdown, "Common Themes"),
    commonHeadings: listSection(markdown, "Common Headings"),
    relatedQuestions: listSection(markdown, "Related Questions"),
    contentGaps: listSection(markdown, "Content Gaps"),
    internalLinkOpportunities: plan.internalLinks
  };
}

function parseDuckDuckGoHtml(html: string): SearchResult[] {
  const results: SearchResult[] = [];
  const resultBlocks = html.split(/<div class="result[^"]*"/g).slice(1);

  for (const block of resultBlocks) {
    const titleMatch = block.match(/class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!titleMatch) continue;
    const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>|class="result__snippet"[^>]*>([\s\S]*?)<\/div>/);
    const url = decodeDuckDuckGoUrl(decodeHtml(titleMatch[1]));
    const title = stripTags(decodeHtml(titleMatch[2]));
    const snippet = stripTags(decodeHtml(snippetMatch?.[1] ?? snippetMatch?.[2] ?? ""));
    if (title && url) results.push({ title, url, snippet });
  }

  return results;
}

function decodeDuckDuckGoUrl(url: string) {
  try {
    const parsed = new URL(url, "https://duckduckgo.com");
    return parsed.searchParams.get("uddg") ?? parsed.href;
  } catch {
    return url;
  }
}

function commonThemes(results: SearchResult[]) {
  const text = results.map((result) => `${result.title} ${result.snippet}`).join(" ").toLowerCase();
  const themes = [
    { label: "regional styles", pattern: /\b(regional|north indian|south indian|punjabi|gujarati|bengali)\b/ },
    { label: "dish explanations", pattern: /\b(dish|dishes|biryani|dosa|curry|bread|naan|starter)\b/ },
    { label: "ordering advice", pattern: /\b(order|try|beginner|guide|menu)\b/ },
    { label: "vegetarian and dietary options", pattern: /\b(vegetarian|vegan|halal|dietary)\b/ },
    { label: "restaurant context", pattern: /\b(restaurant|takeaway|dining|food in)\b/ }
  ];

  return themes.filter((theme) => theme.pattern.test(text)).map((theme) => theme.label);
}

function commonHeadings(plan: ArticlePlanItem, results: SearchResult[]) {
  const headings = [`What is ${plan.primaryKeyword}?`, `How ${plan.primaryKeyword} connects to local choices`];
  for (const result of results.slice(0, 4)) {
    headings.push(result.title);
  }
  return Array.from(new Set(headings));
}

function relatedQuestions(plan: ArticlePlanItem) {
  return [
    `What should beginners know about ${plan.primaryKeyword}?`,
    `How does ${plan.primaryKeyword} connect to local restaurant searches?`,
    `Which directory pages should support this topic?`
  ];
}

function humanList(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function valueAfterPrefix(markdown: string, prefix: string) {
  return markdown
    .split("\n")
    .find((line) => line.startsWith(prefix))
    ?.slice(prefix.length)
    .trim();
}

function listSection(markdown: string, heading: string) {
  const match = markdown.match(new RegExp(`## ${escapeRegExp(heading)}\\n([\\s\\S]*?)(?:\\n## |$)`));
  if (!match) return [];

  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
