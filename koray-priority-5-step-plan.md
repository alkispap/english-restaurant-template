# Koray Local Directory: Next 5 Priorities

## 1) Route-level metadata indexation guards
Implement consistent index/noindex + canonical behavior per route template so low-value URLs are not indexed.

## 2) Listing quality score and detail-page gating
Create a completeness score for listing entities and use it to decide which listing detail pages can be indexed.

## 3) Homepage crawl architecture
Keep search/filter UX, but promote static crawlable links to top area and category hubs near the top of the page.

## 3.1) Homepage refinement follow-up
Add area+category combo links, improve intent-focused hub labels, and add homepage guidance microcopy.

## 4) Information-gain content modules
Add unique local insights to area/category pages so pages are not template-only and provide stronger differentiation.

## 5) Parameter URL crawl control
Ensure query/filter permutations are noindex and canonicalized to the strongest static hub URLs.

---

## Execution status
- [x] Step 1 - Route-level metadata indexation guards
- [x] Step 2 - Listing quality score and detail-page gating
- [x] Step 3 - Homepage crawl architecture
- [x] Step 3.1 - Homepage refinement follow-up
- [x] Step 4 - Information-gain content modules
- [x] Step 5 - Parameter URL crawl control

## Completion notes
- Central SEO policy now controls thresholds, high-intent facets, canonical behavior, noindex behavior, sitemap inclusion, listing quality scoring, and permanent-closed listing handling.
- Homepage crawl links now include top areas, top cuisines, strong area+cuisine pages, and approved high-intent facet pages near the top of the homepage.
- SEO landing pages now include reusable information-gain blocks with price, review, practical visit, dietary, service, and transport signals.
- Query/filter permutations remain usable for visitors but are noindex and canonicalized toward the strongest clean hub URL.
- Verification completed with `npm test`, `npm run typecheck`, `npm run lint`, `npm run audit:seo`, `npm run audit:links`, and `npm run build`.
