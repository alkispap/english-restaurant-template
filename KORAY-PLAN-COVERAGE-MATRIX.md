# Koray Research To Action Plan Coverage Matrix

_Created: 2026-05-24_

This matrix tracks each major idea from `Koray Framework Applied To Directories.docx` and whether it is already in the implementation plan, already implemented in the website, should be added to the plan, or should be treated carefully.

## Status Key

- **In plan:** included in `docs/superpowers/plans/2026-05-24-semantic-template-governance.md`.
- **Already built:** already present in the current website/template.
- **Add to plan:** useful idea that should be added to the plan.
- **Launch-only:** useful later for a real deployed directory, not a template priority.
- **Treat carefully:** not an official Google rule or too rigid to copy literally.

## 1. Koray Framework Pillars

| Research idea | What it means for this directory | Current status | Decision |
|---|---|---:|---|
| Topical Map Ontology | Define the central entity, source context, page types, allowed facets, and related entities before creating pages. | In plan | Keep. This is Task 1: semantic map and page briefs. |
| Central Entity | The site needs one clear main topic, e.g. Indian restaurants in London. | Already built | Site config already defines `niche`, `city`, labels, and restaurant preset. Add stronger copied-directory checks later. |
| Source Context | The site exists as a local comparison directory, not a food blog or tourism guide. | In plan | Keep. The semantic map should explicitly store this. |
| Central Search Intent | Every page should reinforce local restaurant comparison intent. | Partly built | Add to plan. Page briefs should include intended search intent per page type. |
| Core Section and Outer Section | Separate money pages/core hubs from supporting pages/facets. | Partly built | Add to plan. Semantic map should mark core vs supporting page roles. |
| Semantic Content Network | Pages should connect as a structured network, not random directory pages. | In plan + already built | Keep. Existing route hierarchy is strong; contextual bridge work improves it. |
| Knowledge-Based Trust | Publish consistent, factual, structured data. | Already built | Keep via structured data, quality gates, audits. Do not overpromise rankings. |
| Semantic Content Brief | Each page type should have a clear brief: macro context, required facts, links, and index role. | In plan | Keep. This is the central missing layer. |
| Semantic Audit and Content Configuration | Re-check pages over time because search behavior changes. | Partly built | Add to plan. Current audits check data/SEO, but not semantic drift or page-brief compliance. |
| Semantic Content Writing / Algorithmic Authorship | Use concise, factual, question-led copy rather than generic filler. | In plan | Keep, but use naturally. |
| Topical Authority = Coverage x Historical Data | Build useful coverage and learn from performance over time. | Partly built | Launch-only for analytics/Search Console. Keep as later reporting work. |
| Cost of Retrieval | Make pages easy for users and crawlers to understand. | Already built + in plan | Keep as practical crawl/index control, not as a guaranteed ranking formula. |

## 2. Micro-Semantics And Authorship Rules

| Research idea | What it means for this directory | Current status | Decision |
|---|---|---:|---|
| One Macro Context Per Page | Each route should answer one main intent only. | Partly built | Add to plan. Page briefs should define one macro context per route type. |
| Contextual Border | When a page moves from main content to related content, explain the relationship. | In plan | Keep. This is the contextual bridge section work. |
| Proper Word Sequence | Put the main entity and important facts early in sentences. | Partly built | Add to plan lightly. Use this in summary helpers, not as a rigid grammar audit. |
| Question-Based H2s | Use question headings where they help direct answers. | In plan | Keep for listing facts and bridge sections. Do not force every H2. |
| 40-word extractive answer | Put a concise factual answer after important question headings. | Partly in plan | Keep as "short factual answer," not exactly 40 words. |
| Fluff eradication | Remove generic marketing language. | Partly built | Add to plan. Add a simple copy-safety check for generic filler phrases later. |
| Numeric precision | Use counts, ratings, review counts, prices, and distances where available. | Already built | Keep. Existing hub descriptions and summary stats already do this. |
| Factual certainty | Avoid claims that the data cannot support. | Partly built | Add to plan. Summary helpers should say "listed" or "available in current data" where needed. |
| Subject-Predicate-Object triples | Turn raw attributes into clear factual statements. | In plan | Keep via listing EAV summary helpers. |
| Five micro-format operations | Selection, modification, organization, combination, transformation. | Not explicit | Treat as writing guidance, not a separate implementation task. |

## 3. Directory Application Strategy

| Research idea | What it means for this directory | Current status | Decision |
|---|---|---:|---|
| EAV database/taxonomy | Store rich attributes for every listing. | Already built | Keep. Current listing model has many EAV-style fields. |
| Attribute grouping metadata | Group facts by service, guest info, transport, reviews, contact, nearby. | Already built + in plan | Keep. Listing summary helpers strengthen this. |
| Entity identity resolution | Keep names, addresses, categories, GBP-style attributes, and proof signals consistent. | Partly built | Add to plan. Include in semantic/page-brief audit or copied-template readiness. |
| Programmatic pages at scale | Generate area, category, area+category, facet, and listing pages safely. | Already built | Keep. Do not add more page types yet. |
| Question H2s and answers on listing templates | Listing pages should answer predictable user questions. | In plan | Keep. |
| Site-wide n-grams/vector focus | Boilerplate should reinforce local restaurant directory intent. | Partly built | Add to plan. Semantic map should define required identity phrases for copied templates. |
| Automated fluff eradication | Strip weak subjective copy from generated content. | Not in plan | Add to plan as an audit, not automatic rewriting. |
| Query Gap Analyzer | Find missing topics/facets/attributes. | Not in plan | Add later as an audit enhancement, after semantic map exists. |
| Triple Generator | Convert listing data into factual statements. | In plan | Keep. Listing EAV summary helper is the practical version. |
| Comment/Review Generator | Extract factual pros/cons from user reviews. | Not in plan | Exclude for now. It needs real review text and moderation rules. |

## 4. Internal Linking And Hub-Spoke Architecture

| Research idea | What it means for this directory | Current status | Decision |
|---|---|---:|---|
| Hub-and-spoke model | Homepage -> hubs -> combinations -> listings -> contextual return links. | Already built + in plan | Keep. Existing route structure is strong; bridges improve it. |
| 1:7 hub-spoke ratio | A strict number of spokes per hub. | Not in plan | Treat carefully. Do not implement as a hard rule. |
| Directional link flow | Links should follow user journey and site hierarchy. | Partly built | Add to plan. Internal-link audit should check primary targets by page type. |
| Anchor text precision | Link text should match the destination page intent. | In plan | Keep. Internal-link audit should check weak/generic anchors. |
| Anchor repetition max 3 | Avoid spammy repeated anchors. | Partly in plan | Keep as a warning heuristic, not a fixed SEO law. |
| Under 150 total links | Avoid excessive page links. | Partly in plan | Keep as a warning heuristic, not a fixed SEO law. |
| Main content links target under 15 | Main content links should stay focused. | Partly in plan | Keep as a warning heuristic for listing pages. |
| Replace random related listings | Related links should be contextually explained. | In plan | Keep. This is Task 4. |
| Bidirectional entity signals / GBP alignment | Internal categories/services should mirror real business attributes. | Partly built | Add to plan. Use existing listing attributes; do not scrape GBP. |

## 5. Existing Website-Specific SEO Tactics

| Research idea | What it means for this directory | Current status | Decision |
|---|---|---:|---|
| Index only valuable pages | Noindex weak/thin pages. | Already built | Keep. SEO policy and sitemap do this. |
| Parameter URL governance | Keep filters for users but not as index targets. | Already built | Keep. |
| Listing quality gate | Index only strong listing detail pages. | Already built | Keep. |
| Sitemap aligned to SEO policy | Sitemap should include canonical, indexable URLs only. | Already built | Keep. |
| Information-gain modules | Add unique, data-led blocks to hubs. | Already built | Keep and refine later. |
| Freshness audit | Track stale/missing listing data. | Already built | Keep. Missing images are not a template blocker. |
| Template readiness audit | Prevent copied-template mistakes. | Already built | Keep and expand with semantic map checks. |
| Analytics hooks | Track page types and high-value actions. | Already built | Launch-only provider setup later. |

## Items To Add To The Plan

The current plan is good, but it should be revised to explicitly include these missing ideas:

1. **Core vs supporting page roles** in the semantic map.
2. **One macro context per route type** in every page brief.
3. **Semantic drift/page-brief compliance audit** as a future extension of the internal-link audit.
4. **Required identity phrases for copied templates** so future sites keep the right central intent.
5. **Factual-certainty rule** for generated summaries: say "listed," "available in current data," or "not listed" instead of overclaiming.
6. **Copy fluff audit** for generic marketing terms and unsupported claims.
7. **Entity identity consistency check** for name, address, area, category, service, and proof signals.
8. **Directional link-flow checks** by page type.
9. **GBP-style attribute alignment note** without scraping or claiming Google verification beyond available data.

## Items Not To Add As Hard Rules

These should remain caution notes, not implementation requirements:

1. Exactly 40 words after every H2.
2. Every H2 must be a question.
3. Exact 1:7 hub-spoke ratio.
4. Under 150 total links as a pass/fail rule.
5. Maximum 3 repeated anchors as a pass/fail rule.
6. Claims that semantic structure can replace all backlink or authority signals.
7. Review/comment generators without real moderation and source data.

## Revised Direction

The implementation plan should still keep the same 6 main sections, but Task 1 and Task 5 should be expanded:

- **Task 1:** semantic map/page briefs should include page role, macro context, required identity phrases, source context, core/supporting classification, and copied-template blocked terms.
- **Task 5:** internal-link audit should become a broader semantic governance audit, covering link flow, repeated anchors, weak anchors, page-brief compliance, generic copy, and entity consistency.

Images remain out of scope while this is a template.
