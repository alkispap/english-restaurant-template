# Page Families SEO Upgrade Tracker

This is the living reminder for reusable SEO upgrades across the directory template. Keep it updated whenever a page family is upgraded, so future copies of the template do not lose SEO quality or keep stale niche wording.

## Current Status

| Page family | URL patterns | Current source | Upgrade status | Priority |
| --- | --- | --- | --- | --- |
| Homepage search | `/` | `DirectoryListingsPage`, `HomepageSeoLinks`, `homepageHeadings` | **Upgraded** with reusable homepage SEO heading helper | Done |
| Dynamic SEO landing pages | `/areas/[area]`, `/neighborhoods/[neighborhood]`, `/categories/[category]`, `/areas/[area]/categories/[category]`, `/best/[slug]`, `/services/[service]`, `/dietary/[dietary]`, `/offerings/[offering]`, `/types/[type]` | `SeoLandingPage`, `seo-pages`, `seoLandingHeadings` | **Upgraded** with reusable dynamic SEO landing page heading/copy helper | Done |
| Listing detail pages | `/listings/[slug]` | Listing detail route with inline sections | **Not upgraded yet**; needs reusable detail-page headings around overview, reviews, location, services, contact, freshness, and related links | 1 - High |
| Directory index pages | `/areas`, `/categories` | Inline index page headings and metadata | **Not upgraded yet**; useful structure exists, but generic wording should become config-driven | 2 - Medium |
| Trust/support pages | `/about`, `/contact`, `/privacy-policy`, `/terms`, `/methodology`, `/suggest-update` | `TrustPage` content helper | **Partly reusable** through trust content helper; keep simple and trust-focused | 3 - Low |
| Compare utility page | `/compare` | `CompareSavedListings` | **Not upgraded yet**; useful UX page, not a main organic landing target | 4 - Low |
| Listings redirect | `/listings` | Redirects query state to `/` | No SEO heading upgrade needed | None |
| System SEO files | `/sitemap.xml`, `/robots.txt` | Next metadata routes | No heading/copy upgrade needed | None |
| API route | `/api/shortlist` | Shortlist API | Not a public SEO page | None |

## Priority Plan

1. **Listing detail pages:** Add reusable detail-page heading patterns for single business pages.
2. **Directory index pages:** Upgrade `/areas` and `/categories` with reusable index-page heading helpers.
3. **Trust/support pages:** Review for reusable trust wording, but avoid over-optimizing policy pages.
4. **Compare page:** Keep simple; only make copy more reusable if it still contains stale restaurant-only wording after the main SEO pages are complete.

## Rules For Each Upgrade

- Use helpers driven by `siteConfig`, `directoryConfig`, and existing page models.
- Keep the current Indian restaurant output strong, but make copied sites like `Mexican Restaurants in London` generate equivalent headings automatically.
- Add fake-config tests for each helper so no stale `Indian` wording leaks into future copied templates.
- Keep restaurant-specific concepts such as cuisine, dietary need, dining style, takeaway, and delivery when they belong to the restaurant template.
- API routes, redirects, sitemap, and robots are not heading/copy upgrade targets.

## Existing Tracking Tests

- `scripts/page-inventory.test.ts` checks that every known route is classified.
- `scripts/page-family-heading-snapshot.test.ts` locks current heading and metadata sources for the major page families.
