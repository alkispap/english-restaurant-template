# Production Readiness Audit Plan

## Summary

Produce a detailed audit report only. The work will inspect the website end to end and identify production blockers, risks, and recommended fixes, but it will not change code, layout, data, or configuration.

The audit will cover code health, SEO, visual layout, mobile behavior, content quality, data quality, performance, admin/security exposure, and deployment configuration.

## Audit Areas

- Code and build health:
  - Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
  - Review warnings, test coverage gaps, generated data size, and route/build output.
- SEO and indexing:
  - Check homepage, category, area, area/category, listing, service, dietary, type, best, sitemap, robots, canonical URLs, meta titles, meta descriptions, noindex rules, and structured data.
  - Confirm production URL risk from `NEXT_PUBLIC_SITE_URL`, since the current fallback is `http://localhost:3001`.
- Visual and UX QA:
  - Review desktop and mobile layouts for homepage, listing detail, category page, area page, area/category page, filters, map view, compare/saved page, and not-found page.
  - Look for overflow, awkward spacing, text repetition, weak hierarchy, mobile filter problems, and confusing controls.
- Content and data quality:
  - Sample 50 listings across areas/cuisines to catch bad descriptions, duplicates, missing images, bad cuisine labels, broken contact links, “None nearby” style data, bad opening hours, and weird imported values.
- Production/security setup:
  - Check admin routes, import/settings API routes, Supabase env requirements, robots exposure, public env vars, and whether admin pages should be protected or removed before launch.
- Performance:
  - Run browser/Lighthouse-style checks on key pages.
  - Inspect image loading, map behavior, JavaScript weight, mobile usability, and Core Web Vitals risks.

## Report Format

Create one production-readiness report with:

- Executive summary: launch-ready, nearly ready, or not ready.
- Findings grouped by severity:
  - `Blocker`: must fix before public launch.
  - `High`: should fix before launch.
  - `Medium`: should fix soon, but may not block launch.
  - `Low`: polish or later improvement.
- Each finding includes:
  - affected page/file/route
  - evidence
  - user/SEO/business impact
  - recommended fix
  - suggested verification step
- Final launch checklist:
  - required fixes
  - recommended fixes
  - optional polish
  - deployment steps

## Test And Inspection Plan

- Automated checks:
  - `npm test`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- Local page checks:
  - `/`
  - `/categories/indian`
  - `/areas/harrow`
  - `/areas/harrow/categories/indian`
  - `/best/best-rated`
  - `/services/takeaway`
  - `/dietary/vegan`
  - `/types/casual-dining`
  - `/listings/the-curry-club-london`
  - `/compare`
  - `/sitemap.xml`
  - `/robots.txt`
- Browser checks:
  - desktop viewport
  - mobile viewport
  - filter interactions
  - search interactions
  - map/list toggle
  - saved/compare workflow
- Data checks:
  - sample listings from top, middle, and lower-quality records
  - inspect generated listing descriptions and meta descriptions
  - inspect links, images, addresses, transport, nearby places, ratings, reviews, and opening hours

## Assumptions

- This phase is audit/report only, not fixes.
- The report may recommend code/data/config changes, but those will be handled in a separate implementation phase.
- The target site is the Indian Restaurants London directory, but recommendations should preserve the reusable template goal for future directories.
- If a production domain is not configured yet, the audit will flag that as a launch blocker or high-priority deployment task.
