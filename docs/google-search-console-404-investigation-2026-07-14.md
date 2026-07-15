# Google Search Console 404 Investigation

Date: 14 July 2026  
Property: `https://indianrestaurantlondon.co.uk`  
Search Console status: **Not found (404), 234 pages, validation failed**

## Executive conclusion

The 234 Search Console URLs cannot be reconciled one by one because the supplied Search Console export contains only the issue total, not Google's example URL table. The signed-in example table was also unavailable to this investigation session.

The investigation nevertheless confirmed two active sources capable of explaining the report:

1. **Legacy `/listings/{slug}/` URLs return 404.** The site moved restaurant pages from `/listings/` to `/restaurants/` on 1 July 2026 and enabled trailing slashes at the same time. The Cloudflare redirects added on 9 July match the non-trailing-slash form but fail for the historical trailing-slash form.
2. **The current site emits 69 unique internal URLs that return 404.** These links occur across live restaurant and category pages. They are excluded from the sitemap, so the existing sitemap audit does not detect them.

The failed legacy route is the strongest explanation for a large share of Google's 234 URLs. The report dates and route-change dates align, and the old pages used the trailing-slash form that currently fails.

## Evidence collected

### Current sitemap

- Live sitemap URLs: **3,520**
- Final 200 responses: **3,520**
- Final 404 responses: **0**
- Direct 200 responses: **1**
- `308 -> 200` responses: **3,519**

Therefore, the current sitemap does not contain a true 404. It does omit trailing slashes from 3,519 URLs even though the deployed site requires them. This belongs to the separate **Page with redirect** Search Console category.

### Live internal-link crawl

- Sitemap pages crawled: **3,520**
- Page-fetch failures: **0**
- Unique same-site link destinations tested: **10,398**
- Unique destinations returning 404: **69**
- Unique destinations redirecting to 200: **2,811**

Broken internal destinations by family:

| Family | Unique 404 URLs | Root cause | Recommended action |
|---|---:|---|---|
| `/categories/` | 36 | Pages below the SEO/static-generation threshold are still linked | Link to the filtered restaurant search or show a non-linked label unless a dedicated page is generated |
| `/offerings/` | 21 | Listing-detail pills always create dedicated offering routes, but only five approved routes exist | Use dedicated routes only for approved/generated facets; otherwise use filtered search |
| `/services/` | 7 | Listing-detail pills always create dedicated service routes, but only four approved routes exist | Use dedicated routes only for approved/generated facets; otherwise use filtered search |
| `/dietary/` | 2 | Non-approved dietary facets are linked as dedicated pages | Fall back to filtered search |
| `/types/` | 2 | Non-approved types are linked as dedicated pages | Fall back to filtered search |
| `/cdn-cgi/` | 1 | Cloudflare email-obfuscation link is exposed as a crawlable internal URL | Prevent the generated protection URL from being crawlable or disable that transformation for these links |

Relevant generators are `getListingTagHref` in the restaurant detail page and `buildDetailFilterHref` in `src/lib/listing-detail-filter-links.ts`. Both can produce dedicated routes without checking whether those routes are approved and generated.

### Legacy route testing

Git history shows:

- **1 July 2026 (`80eb6b4`)**: listing detail pages moved from `/listings/{slug}` to `/restaurants/{slug}` and `trailingSlash: true` was enabled.
- **9 July 2026 (`18b7e83`)**: `public/_redirects` was introduced with `/listings/:slug /restaurants/:slug 301`.

All 148 known renamed-slug mappings were tested in four forms:

| URL form | Result for all 148 mappings | Assessment |
|---|---|---|
| `/listings/{old-slug}/` | `404` | Broken historical URL |
| `/listings/{old-slug}` | `301 -> 308 -> 200` at `/restaurants/{old-slug}/` | Redirect chain ends on the old slug, not the mapped canonical target |
| `/restaurants/{old-slug}/` | `200` response containing a Next client redirect/error shell and canonical for the new slug | Not a proper HTTP redirect; may be treated as duplicate or soft error |
| `/restaurants/{new-slug}/` | `200` | Correct canonical destination |

The same trailing-slash failure also affects unchanged slugs. For example:

| URL | Live result |
|---|---|
| `/listings` | `301` to `/restaurants` |
| `/listings/` | `200`, not a redirect |
| `/listings/the-curry-club-london` | `301` to `/restaurants/the-curry-club-london` |
| `/listings/the-curry-club-london/` | `404` |

Because the pre-migration static site used trailing slashes, `/listings/{slug}/` is the historically important form. The current generic rule does not protect it.

## Confirmed broken internal URLs

### Categories (36)

`african`, `american`, `andhra-indian`, `argentinian`, `awadhi`, `british`, `cantonese`, `caribbean`, `caucasian`, `chettinad-indian`, `chinese`, `east-african`, `egyptian`, `european`, `french`, `greek`, `indonesian`, `jamaican`, `kashmiri`, `korean`, `malaysian`, `marathi`, `mexican`, `middle-eastern-yemeni`, `moroccan`, `nepalese-indian`, `palestinian`, `parsi-indian`, `portuguese`, `rajasthani`, `sichuan-chinese`, `south-african`, `spanish`, `tibetan`, `turkish-middle-eastern`, `vietnamese`

All use `https://indianrestaurantlondon.co.uk/categories/{slug}/`.

### Offerings (21)

`alcohol`, `all-you-can-eat`, `arcade-games`, `beer`, `braille-menu`, `cocktails`, `coffee`, `dancing`, `food`, `food-at-bar`, `free-water-refills`, `happy-hour-drinks`, `happy-hour-food`, `healthy-options`, `late-night-food`, `prepared-foods`, `private-dining-room`, `quick-bite`, `salad-bar`, `spirits`, `wine`

All use `https://indianrestaurantlondon.co.uk/offerings/{slug}/`.

### Services (7)

`caterer`, `drive-through`, `in-store-pick-up`, `in-store-shopping`, `kerbside-pickup`, `no-contact-delivery`, `on-site-services`

All use `https://indianrestaurantlondon.co.uk/services/{slug}/`.

### Dietary (2)

- `https://indianrestaurantlondon.co.uk/dietary/kosher/`
- `https://indianrestaurantlondon.co.uk/dietary/non-vegetarian/`

### Types (2)

- `https://indianrestaurantlondon.co.uk/types/cafe-casual-dining/`
- `https://indianrestaurantlondon.co.uk/types/shisha-bar/`

### Cloudflare-generated path (1)

- `https://indianrestaurantlondon.co.uk/cdn-cgi/l/email-protection`

## Treatment decisions

### Redirect

- Every historical `/listings/{valid-slug}/` and `/listings/{valid-slug}` URL should make a one-hop permanent redirect to the canonical `/restaurants/{current-slug}/` URL.
- The 148 explicit old-slug mappings in `src/data/listing-slug-redirects.ts` should redirect directly to their mapped targets, not to an intermediate old restaurant URL.
- Old `/restaurants/{old-slug}/` pages should also return a real HTTP permanent redirect to the mapped canonical target.

### Fix source links

- Fix the 68 broken category/facet destinations at their generators. Do not add blanket redirects to unrelated landing pages.
- A non-approved facet should link to a useful filtered `/restaurants` result, or render as plain text if no useful search state exists.
- Fix or suppress the crawlable Cloudflare email-protection path.

### Keep 404

- Unknown restaurant slugs with no historical record or equivalent should remain 404.
- Do not redirect arbitrary removed restaurants to the homepage or restaurant index.

## Search Console reconciliation still required

Export the example table from **Page indexing -> Not found (404)** as CSV and include the URL and last-crawled columns. Then compare it with:

1. Historical `/listings/{slug}/` URLs.
2. The 69 confirmed current broken internal destinations above.
3. Any remaining malformed, external, or intentionally removed URLs.

Do not start Search Console validation until the legacy trailing-slash redirects and current internal 404 links have been corrected and deployed. Validation failed previously because the live failures remain reproducible.

## Investigation status against acceptance criteria

| Criterion | Status |
|---|---|
| Every Search Console example classified | **Blocked by missing example export** |
| Root-cause counts summarized | **Complete for all independently discoverable live URLs** |
| No current sitemap URL returns 404 | **Pass** |
| No current internal link points to 404 | **Fail: 69 unique destinations** |
| Historical replacements use one-hop 301 | **Fail** |
| Intentionally removed URLs absent from sitemap/internal links | **Sitemap pass; internal links fail for 69 generated facet URLs** |
| Determine whether `/listings/:slug` explains the issue | **Strongly supported; exact share awaits Google export** |

## Implementation update — 14 July 2026

The independently confirmed 404 sources have now been fixed locally and are ready for deployment:

- Cloudflare redirect rules are generated from all 148 renamed-slug mappings.
- Both trailing-slash and non-trailing-slash legacy URLs redirect directly to the final canonical restaurant URL.
- Static redirect/error shells for old restaurant slugs are no longer generated.
- Category, dietary, type, service, and offering links use dedicated pages only when those pages are actually generated; all other values fall back to working filtered restaurant searches.
- Email actions no longer expose an email URL in static HTML, preventing Cloudflare from rewriting it to the crawlable `/cdn-cgi/l/email-protection` path.

Post-build verification:

- Static pages generated: **3,660**
- Generated HTML files crawled: **3,657**
- Unique generated internal anchor paths: **2,794**
- Missing internal destinations: **0**
- Cloudflare redirect manifest lines: **598**
- Cloudflare export validation: **Pass**
- TypeScript validation: **Pass**
- Repository tests: **131 passed in the full run; the one obsolete source assertion was updated and then passed separately**

These results describe the local build. Search Console validation should begin only after this build is deployed.
