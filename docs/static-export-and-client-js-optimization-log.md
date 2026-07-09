# Static Export and Client JS Optimization Log

Date: 2026-07-08

This note records the optimization work completed during the review of the Indian Restaurants in London directory template, the measured before/after numbers, and the remaining targets.

## Goal

Reduce static export size and visitor-facing JavaScript while preserving the reusable directory structure, current visitor experience, SEO pages, and Cloudflare Pages static hosting compatibility.

## Completed Work

### 1. Legacy `/listings/[slug]` Export Reduction

Problem:

- The old `/listings/[slug]` route was exporting thousands of compatibility pages even though canonical detail pages now live under `/restaurants/[slug]`.
- This duplicated restaurant detail output and made the static export much larger.

Change:

- `src/app/listings/[slug]/page.tsx` now emits only one placeholder static param.
- Real legacy listing URLs are handled by `public/_redirects`:
  - `/listings/:slug /restaurants/:slug 301`
  - `/listings /restaurants 301`
- The legacy dynamic route opts out of ungenerated params for static export.

Measured benefit:

| Metric | Before | After | Benefit |
| --- | ---: | ---: | ---: |
| `out/listings` files | 6,376 | 4 | -6,372 files |
| `out/listings` size | 76.7 MB | 48.3 KB | about -76.65 MB |
| Total export files | 14,063 | 7,691 | -6,372 files |

### 2. Restaurant Detail Prop Compaction

Problem:

- Detail pages passed broader listing objects into client/detail components than those components needed.
- This inflated repeated restaurant detail HTML/RSC payload.

Change:

- `ListingDetailMobileChrome` now receives a compact `MobileChromeListing`.
- `ListingGrid` now receives compact related listing cards instead of broader listing summaries.
- `src/app/restaurants/[slug]/page.tsx` maps full listings into compact view models before passing props.

Measured benefit:

| Metric | Before | After | Benefit |
| --- | ---: | ---: | ---: |
| `out/restaurants` size | 873.56 MB | 855.96 MB | -17.60 MB, about -2.0% |
| Restaurant HTML | 586.09 MB | 576.80 MB | -9.29 MB |
| Restaurant RSC `.txt` | 287.46 MB | 279.15 MB | -8.31 MB |
| Total export size | 1.04 GB | 1.02 GB | about -20 MB |

### 3. `/compare` Client JS Reduction

Problem:

- `/compare` imported `listing-search-records.json` through `src/data/shortlist-summaries.ts`.
- That bundled the full 6.53 MB browser search dataset into the compare page, although compare only needs saved-listing summary fields.

Change:

- Added compact `data/shortlist-summaries.json`.
- `src/data/shortlist-summaries.ts` now imports that compact JSON instead of `listing-search-records`.
- `src/lib/directory-import.ts` and `scripts/import-directory.ts` now generate the compact shortlist summary JSON during future imports.
- Tests now guard against reintroducing the full search-record import into compare.

Measured benefit:

| Metric | Before | After | Benefit |
| --- | ---: | ---: | ---: |
| Compare data source | 6.53 MB | 2.16 MB | -4.37 MB, about -67% |
| Exported `/compare` referenced JS | about 6.9 MB | 2.74 MB | about -4.16 MB, about -60% |

Notes:

- `/compare` no longer references the old 6.53 MB search-record chunk.
- The compact compare chunk remains because compare still needs all possible saved listing summaries on static hosting.

### 4. SEO Landing Query Chunk Reduction

Problem:

- SEO landing filter/query updates used `src/lib/seo-landing-browser.ts`.
- That imported `src/lib/seo-pages.ts`, which imports the full `data/listings.json` path and full SEO-page generation helpers.
- A visitor changing filters on pages like `/areas/harrow`, `/categories/indian`, or `/services/takeaway` could lazy-load two large chunks:
  - SEO page browser builder: 9.28 MB
  - Search-record/content chunk: 6.55 MB

Change:

- Added a compact SEO query path using `src/lib/seo-landing-listings-browser.ts`.
- `SeoLandingQueryEnhancer` now updates only the filter/results region using the compact directory listing model.
- The server-rendered SEO hero, guide, related links, FAQs, and structured data remain stable.
- Added `SeoLandingResultsShell` for query-state replacement of only the listing results/filter section.
- Tests now assert browser-loaded SEO query modules do not import `seo-pages` or full listing records.

Measured benefit:

| Metric | Before | After | Benefit |
| --- | ---: | ---: | ---: |
| SEO lazy chunks | 15.83 MB | 6.55 MB | -9.28 MB, about -58.6% |
| `_next` export size | 19.37 MB | 10.07 MB | -9.30 MB, about -48.0% |
| Old `9745...js` SEO builder chunk | 9.28 MB | removed | -9.28 MB |

Current static export after this pass:

- Cloudflare export check: 7,688 files, no asset over 25 MiB.
- `out` size: about 1.01 GB.
- `_next`: 59 files, 10.07 MB.
- Largest remaining JS chunk: `1348...js`, 6.55 MB.

## Verification Completed

The following commands were run after the latest implementation:

```powershell
npx tsx scripts/seo-landing-query-enhancer.test.ts
npm run typecheck
npm run lint
npm test
npm run build
npm run build:static
$env:NEXT_PUBLIC_SITE_URL='https://indianrestaurantlondon.co.uk'; npm run check:cloudflare
$env:NEXT_PUBLIC_SITE_URL='https://indianrestaurantlondon.co.uk'; npm run diagnose:static
```

Results:

- Focused SEO query enhancer test: passed.
- Typecheck: passed.
- Lint: passed.
- Full test suite: 124 passed, 0 failed.
- Normal production build: passed.
- Static export build: passed.
- Cloudflare export checks: passed.
- Static diagnostics: passed.

## Remaining Targets

### 1. Remaining 6.55 MB Search-Record Chunk

Status: highest-value remaining visitor-performance target.

What remains:

- Largest JS chunk is now about 6.55 MB.
- It is tied to the browser-facing search/filter records from `data/listing-search-records.json`.
- This chunk supports client-side filtering, sorting, map mode, open-now filtering, and SEO landing query-state updates.

Possible next approaches:

- Create an even smaller filter/results dataset for browser query updates.
- Split heavy detail fields out of `listing-search-records.json`.
- Keep only fields needed for list cards, filters, open status, and map points.
- Investigate whether filter option generation can use precomputed option/count JSON instead of scanning all records in the browser.

Risk:

- Medium. This touches search/filter behavior across the homepage, `/restaurants`, and SEO landing pages.

### 2. Restaurant Detail Export Size

Status: largest remaining static export footprint.

What remains:

- `out/restaurants`: 6,672 files, about 855.96 MB.
- This is mostly repeated HTML and RSC payload across 3,335 restaurant detail pages.

Possible next approaches:

- Further reduce repeated detail-page markup.
- Compact repeated service/guest/contact sections without removing visible content.
- Revisit similar listings card rendering if a design change is acceptable.
- Inspect repeated RSC payload for opportunities to move static labels/config out of per-page output.

Risk:

- Medium to high. Many changes here affect visible restaurant detail page content.

### 3. Noindex Restaurant Pages

Status: not safe to remove yet.

What remains:

- 118 noindex restaurant pages.
- Measured size: about 24.22 MB.

Why not removed:

- All 118 noindex listings still appear in visitor-facing search records.
- Removing the pages without changing search/list cards could create broken visitor clicks.

Possible next approaches:

- Decide whether noindex listings should remain visitor-accessible.
- If not, remove them from search records and internal links first, then stop exporting their detail pages.
- If yes, keep exporting them and treat their size as part of visitor coverage.

Risk:

- Product/UX decision required.

### 4. Legacy Restaurant Slug Redirect Pages

Status: low-risk cleanup, smaller impact.

What remains:

- 148 old `/restaurants/old-slug` redirect pages are still statically exported.
- Measured size: about 4.11 MB and 296 files.

Possible next approach:

- Move old restaurant slug redirects into `public/_redirects`, similar to `/listings/:slug`.
- Remove legacy slug keys from `/restaurants/[slug]` static params.

Risk:

- Low if all redirect rules are generated accurately.

## Recommended Next Order

1. Investigate and reduce the remaining 6.55 MB search-record chunk.
2. Clean up legacy restaurant slug redirect pages for a low-risk export win.
3. Make a product decision about noindex listing visibility.
4. Revisit restaurant detail page repeated markup only after deciding what visible content must stay unchanged.

## Current Baseline To Compare Against

Use this as the baseline for the next optimization pass:

| Area | Current |
| --- | ---: |
| Total export files | 7,688 |
| Total export size | about 1.01 GB |
| `_next` size | 10.07 MB |
| `out/restaurants` size | 855.96 MB |
| Largest JS chunk | 6.55 MB |
| Full test suite | 124 passed, 0 failed |

