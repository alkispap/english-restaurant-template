# Post-Launch TODO

This file tracks important launch, trust, SEO, and data-quality reminders for the reusable local directory template. It is a practical checklist, not a full implementation spec.

## 1) Core Trust Work

Status: Completed.

Completed:

- Add an About page that explains what the directory is and who it is for.
- Add a Contact page so visitors, restaurants, and partners can reach the site owner.
- Add Privacy Policy and Terms pages before public launch.
- Add a clear ranking/methodology page that explains how listings are selected, ordered, and compared.
- Add a suggest/update/report page so users and business owners can report wrong details or suggest a listing update.

## 2) Freshness And Source Transparency

Status: Core work to add.

What to do:

- Show a visible directory last-updated date on relevant pages.
- Add simple source/freshness wording where users make decisions from listing data.
- Include a practical note that restaurant details can change and visitors should check directly before travelling, booking, or ordering.
- Keep the wording factual and calm; do not overclaim that every detail is live or guaranteed.

## 3) Production Domain Setup

Status: Later.

What to do:

- Set `NEXT_PUBLIC_SITE_URL` to the real production domain.
- Re-run `npm run audit:template`.
- Re-run `npm run audit:seo`.
- Re-run `npm run audit:freshness`.
- Confirm the production sitemap, canonical URLs, robots output, metadata, breadcrumbs, structured data, and share URLs use the real domain.
- Confirm the site builds successfully before deployment.

## 4) Listing Data Cleanup

Status: Later.

What to do:

- Review high-risk listings from `npm run audit:freshness`.
- Prioritize missing hours, missing reviews, missing contact actions, and missing categories.
- Review skipped rows and duplicate rows from `data/import-report.md`.
- Enrich images for important listings and high-value hubs first.
- Treat missing images as acceptable while this remains a reusable template, but important for a real public directory.

## 5) Search Console And Sitemap

Status: Required post-launch.

What to do:

- Verify the live domain in Google Search Console.
- Submit the production sitemap.
- Review index coverage after Google has crawled the site.
- Check whether important area, category, area+category, best, facet, and listing pages are indexed correctly.
- Watch for unexpected indexed parameter URLs or excluded canonical pages.

## 6) Real Analytics And KPI Reporting

Status: Post-launch.

What to do:

- Connect an analytics provider such as GA4, Plausible, or another preferred tool.
- Connect the existing provider-neutral measurement hooks to that provider.
- Track performance by page type:
  - homepage
  - listing detail
  - area hubs
  - category hubs
  - area+category hubs
  - neighborhood hubs
  - best pages
  - facet hubs
  - compare page
- Track high-value actions:
  - website clicks
  - phone clicks
  - map clicks
  - review clicks
  - menu/order/reservation clicks
  - save/remove listing
  - share actions
  - compare actions
