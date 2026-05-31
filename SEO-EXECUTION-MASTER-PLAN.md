# SEO Execution Master Plan (Koray-aligned) - Local Directory

_Last updated: 2026-05-24_

## 0) What this file tracks

This file tracks both:

1. **SEO roadmap**: the 1-9 strategic framework and the 1-5 implementation priorities.
2. **DevOps workflow**: how to avoid losing work between local, cloud, and GitHub sessions.

---

## 1) Strategic Framework (1-9)

1. **Topical map around local intent**  
   Organize the site by user intent and local entities: areas, neighborhoods, categories, intent pages, and listing entities.

2. **Indexation decisions by value**  
   Index only pages with enough unique value; noindex/canonical thin combinations and low-value parameter states.

3. **Entity-depth completeness**  
   Rich listing attributes: contact, hours, geo, services, proof signals, media, descriptions, ratings, and review counts.

4. **Hierarchy and internal linking**  
   Homepage -> area/category hubs -> area+category combos -> listing pages, with contextual links back to related hubs.

5. **Information gain**  
   Add local, unique content blocks so hub pages provide more than template text.

6. **Crawl-path and URL control**  
   Keep parameter/filter permutations for UX; prevent them from becoming SEO index targets.

7. **Quality-first expansion waves**  
   Expand by proven templates and thresholds, not by volume first.

8. **KPI tracking by page type**  
   Track indexation, impressions, clicks, rankings, and conversions by template class.

9. **Avoid common SEO implementation mistakes**  
   No thin inventory scale, no duplicate-intent sprawl, and no over-indexing of filter states.

---

## 2) Priority Execution Plan (1-5)

### Step 1 - Route-level indexation guards

**Goal:** noindex query-modified SEO states; keep canonical hubs as index targets.  
**Status:** Completed.

Implemented:
- Central SEO policy for route thresholds, high-intent facets, canonical behavior, robots behavior, sitemap inclusion, and last-modified date.
- SEO hub metadata now uses dynamic search params, so query-modified states can be noindexed.
- Sitemap logic is aligned with the same shared thresholds.

### Step 2 - Listing quality score + listing detail gating

**Goal:** index only high-quality listing detail pages.  
**Status:** Completed.

Implemented:
- Listing quality score from contact, location, reviews, hours, service richness, proof signals, images, and descriptions.
- `70+` score threshold for listing detail indexability.
- Low-quality listings stay usable but are noindex and excluded from sitemap.
- Permanent-closed status detection handles enum-style and raw imported text variants.

### Step 3 - Homepage crawl architecture

**Goal:** increase crawl and authority flow to strong hubs.  
**Status:** Completed.

Implemented:
- Homepage SEO links promoted above listing results.
- Static crawlable links include top areas, top cuisines, strong area+cuisine pages, and approved high-intent facet pages.
- Search/filter UX remains intact.

### Step 3.1 - Homepage refinement follow-up

**Goal:** strengthen intent clarity and hub-first flow.  
**Status:** Completed.

Implemented:
- Area+category combination links.
- Clearer hub labels for areas, cuisines, services, dietary needs, and dining style.
- Homepage hub block moved nearer the top of the page.

### Step 4 - Information-gain modules

**Goal:** make hub pages unique and useful beyond template text.  
**Status:** Completed.

Implemented:
- Reusable information-gain blocks on SEO landing pages.
- Blocks include price/review signals, best-fit guidance, service/dietary notes, transport signals, and practical visit information.

### Step 5 - Parameter URL governance hardening

**Goal:** lock crawl/index behavior for parameter permutations.  
**Status:** Completed.

Implemented:
- Query/filter URLs remain available for users.
- Parameter states are noindex, follow.
- Canonicals point to the strongest clean hub URL where applicable.
- Sitemap contains only index-worthy canonical URLs.

---

## 3) Current Verification

Latest verification passed:

- `node .\node_modules\tsx\dist\cli.mjs .\scripts\seo-policy.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run audit:seo`
- `npm run audit:freshness`
- `npm run build`

Current SEO audit snapshot:

- Indexable URLs: 3504
- Noindex URLs: 739
- Listing detail pages: 3059 indexable / 128 noindex
- Area hubs: 33 indexable / 0 noindex
- Neighborhood hubs: 204 indexable / 165 noindex
- Category hubs: 23 indexable / 36 noindex
- Area+category hubs: 159 indexable / 377 noindex
- Popular search hubs: 6 indexable / 1 noindex
- High-intent facet hubs: 17 indexable / 32 noindex

Known non-blocking warning:

- `next build` still warns about multiple `package-lock.json` files because there is another lockfile at `C:\Users\user\package-lock.json`. The build succeeds.

---

## 4) Operational Layer After Steps 1-5

The 1-5 priority implementation is complete.

Completed after the priority slice:

- Fixed/completed: Freshness audit workflow for recurring data review: hours, status, reviews, service options, images, contact actions, listing quality, and stale directory update dates.
- `npm run audit:freshness` prints an advisory report for listings that need manual review or refreshed imports. It does not scrape live data and does not change indexation by itself.
- Fixed/completed: Provider-neutral measurement hooks for page types and high-value actions: listing detail CTAs, save/remove, share, compare entry, compare listing clicks, and compare action clicks.
- Measurement hooks dispatch browser events and can call a future analytics adapter, but no external analytics provider or tracking script is configured yet.
- Fixed/completed: Expansion workflow for future directories such as Mexican Restaurants in London.
- `npm run audit:template` checks copied-template readiness, including site copy, production URL, import report health, listing quality, freshness risk, hub coverage, SEO policy review, and Supabase setup.

Still outside this completed slice:

- Search Console review after deployment.
- Real KPI reporting by page type after connecting an analytics provider and Search Console.

---

## 5) Persistence Workflow

To avoid losing work:

1. Work on a branch.
2. Commit frequently.
3. Push before ending the session.
4. Open a PR and merge to main.
5. Verify the commit and files are visible on GitHub.

Rule: if it is not on GitHub, treat it as not saved.
