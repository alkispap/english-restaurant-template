# PageSpeed Performance Report - Indian Restaurants London

Report date: June 19, 2026  
Tested URL: https://indianrestaurantlondon.co.uk/  
Report source: Google PageSpeed Insights / Lighthouse-style desktop audit  
PageSpeed report URL: https://pagespeed.web.dev/analysis/https-indianrestaurantlondon-co-uk/bllf7tc6d0?form_factor=mobile

## Headline Scores

| Category | Score |
| --- | ---: |
| Performance | 38 |
| Accessibility | 91 |
| Best Practices | 96 |
| SEO | 100 |

## Main Conclusion

SEO is excellent at 100/100. The main weakness is Performance, especially JavaScript execution time, total blocking time, and layout shift.

The next work should be handled one category at a time:

1. JavaScript work and blocking time
2. Layout shift
3. Images
4. Render-blocking CSS
5. Caching and repeat-visit performance
6. Console errors and smaller quality issues
7. Accessibility polish

## Core Web Vitals And Metrics

| Metric | Result | Status |
| --- | ---: | --- |
| First Contentful Paint | 0.4 s | Good |
| Largest Contentful Paint | 0.9 s | Good |
| Total Blocking Time | 4,100 ms | Poor |
| Cumulative Layout Shift | 0.658 | Poor |
| Speed Index | 3.8 s | Needs work |
| Time to Interactive | 5.4 s | Needs work |

## Follow-Up Google Report - 2026-06-21 Desktop

Report date: June 21, 2026  
Tested URL: https://indianrestaurantlondon.co.uk/  
Report source: Google PageSpeed Insights desktop audit after the latest Cloudflare upload  
PageSpeed report URL: https://pagespeed.web.dev/analysis/https-indianrestaurantlondon-co-uk/wt3pgfq8d6?form_factor=desktop

### Score Comparison

| Category | First saved report | June 21 desktop report | Change |
| --- | ---: | ---: | ---: |
| Performance | 38 | 52 | +14 |
| Accessibility | 91 | 96 | +5 |
| Best Practices | 96 | 100 | +4 |
| SEO | 100 | 100 | 0 |

### Metric Comparison

| Metric | First saved report | June 21 desktop report | Main change |
| --- | ---: | ---: | --- |
| First Contentful Paint | 0.4 s | 0.3 s | Slightly better |
| Largest Contentful Paint | 0.9 s | 0.6 s | Better |
| Total Blocking Time | 4,100 ms | 620 ms | Much better |
| Cumulative Layout Shift | 0.658 | 0.701 | Still poor / slightly worse |
| Speed Index | 3.8 s | 0.6 s | Much better |

### Current Findings

- Loading speed improved strongly after the JavaScript and static-export work.
- The biggest remaining Performance problem is now CLS:
  - Google reports CLS `0.701`.
  - Google reports `1` large layout shift.
  - Shifted visible element: `body > footer.border-t`.
  - The footer is probably the affected element, not the root cause; something above it is likely changing height after load.
- Total Blocking Time improved from `4,100 ms` to `620 ms`, but can still be improved later.
- Accessibility is now `96`; the remaining confirmed contrast issues are:
  - Search button: white text on orange `#f97316`.
  - Disabled `Previous` pagination control: muted text on light slate background.
- Best Practices and SEO are both now `100`.

Recommended next focus:

- Investigate and fix CLS first, because `0.701` appears to be causing the largest remaining Performance score damage.
- Keep the contrast fixes as a small Accessibility follow-up.

### Mobile Follow-Up Check For Same Report ID

Requested mobile report URL: https://pagespeed.web.dev/analysis/https-indianrestaurantlondon-co-uk/wt3pgfq8d6?form_factor=mobile

Important finding:

- The shared mobile URL currently exposes the same embedded Lighthouse run as the desktop report.
- The embedded report metadata says:
  - `formFactor: desktop`
  - screen width: `1350`
  - screen height: `940`
  - CPU slowdown multiplier: `1`
- Because of that, the numbers available from this shared report are not a separate mobile Lighthouse run.

Numbers visible from the shared mobile URL:

| Category | Score |
| --- | ---: |
| Performance | 52 |
| Accessibility | 96 |
| Best Practices | 100 |
| SEO | 100 |

| Metric | Result |
| --- | ---: |
| First Contentful Paint | 0.3 s |
| Largest Contentful Paint | 0.6 s |
| Total Blocking Time | 620 ms |
| Cumulative Layout Shift | 0.701 |
| Speed Index | 0.6 s |

Remaining visible issues from that report:

- CLS is still the main issue:
  - shifted element: `body > footer.border-t`
  - score contribution: `0.700743`
- Contrast issues:
  - `Search`
  - `Previous`

Status:

- A true fresh mobile PageSpeed API run could not be saved during this check because Google returned `429 Too Many Requests`.
- Next comparison should include a fresh mobile run once Google allows another test.

## CLS And TBT Score-Damage Investigation - 2026-06-21

Goal:

- Investigate the two remaining metrics doing the most score damage in the latest desktop report:
  - CLS `0.70`, metric score `7`, weight `25%`
  - TBT `617 ms`, metric score `20`, weight `30%`
- No production fix was made during this investigation.

Scoring calculator evidence from the user screenshot:

| Metric | Value | Metric score | Weight |
| --- | ---: | ---: | ---: |
| FCP | 253 ms | 100 | 10% |
| Speed Index | 572 ms | 100 | 10% |
| LCP | 580 ms | 100 | 25% |
| TBT | 617 ms | 20 | 30% |
| CLS | 0.70 | 7 | 25% |

Score impact estimate:

- If CLS moved from score `7` to `100`, the score could gain roughly `23` points before normal Lighthouse rounding.
- If TBT moved from score `20` to `100`, the score could gain roughly `24` points before normal Lighthouse rounding.
- Both metrics are high-impact. CLS is the clearest first target because the root cause is now specific and reproducible.

Local investigation:

- Ran `npm run build`.
  - Result: passed.
  - Runtime: `155.99s`.
  - Homepage first-load JS remained `201 kB`.
- Started local production server at `http://127.0.0.1:3000/`.
- Ran Lighthouse desktop against local `/`.
  - Saved JSON: `.diagnostics/cls-tbt-investigation-2026-06-21/homepage-desktop-lighthouse.report.json`
  - Saved HTML: `.diagnostics/cls-tbt-investigation-2026-06-21/homepage-desktop-lighthouse.report.html`
- Local Lighthouse had worse load timings than Google, but reproduced the same core shape:
  - CLS: `0.658`
  - TBT: `560 ms`
  - Layout shift element: `body > footer.border-t`

Confirmed CLS root cause:

- The deployed homepage static HTML does not contain the visible homepage `<main>` content.
- Live HTML check:
  - `HasMain: false`
  - `HasBailout: true`
  - `FooterIndex: 3749`
- Exported `out/index.html` shows:
  - header markup,
  - `BAILOUT_TO_CLIENT_SIDE_RENDERING`,
  - footer markup.
- This means the footer is rendered near the top of the page initially, then the full homepage directory content is inserted by JavaScript after hydration, pushing the footer far down the page.
- That explains why Lighthouse reports the shifted element as `body > footer.border-t`.

Component chain responsible for CLS:

- `src/app/page.tsx`
  - wraps `DirectoryListingsPage` in `<Suspense fallback={null}>`.
- `src/components/DirectoryListingsPage.tsx`
  - builds the server-side model, then renders `DirectoryListingsInteractiveShell`.
- `src/components/DirectoryListingsInteractiveShell.tsx`
  - is a client component.
  - uses `useSearchParams`.
  - this causes a static rendering bailout for the homepage content.
- Result:
  - the default homepage body is not server-rendered as visible HTML.
  - the whole main directory interface appears only after client JavaScript runs.

Secondary CLS contributors to keep in mind:

- `OpenStatusBadge` renders `null` on SSR and adds the badge after hydration.
- The default homepage has `12` visible listing rows, and all `12` have working-hours data.
- This may create smaller row-level shifts, but it is not the primary `0.70` CLS root cause. The primary cause is the missing server-rendered `<main>` content.

Confirmed TBT contributors:

- Google desktop report boot-up audit shows:
  - `/_next/static/chunks/153-00f1a8c384dfe4c7.js`
    - total boot-up: about `666 ms`
    - script parse/compile: about `311 ms`
    - scripting: about `302 ms`
  - `/_next/static/chunks/255-81ba70bd132d3eed.js`
    - total boot-up: about `357 ms`
- Local Lighthouse boot-up audit similarly showed:
  - `153-00f1a8c384dfe4c7.js`: about `797 ms`
  - `255-c53a5bd458aa8842.js`: about `513 ms`
  - homepage document/unattributable work after that.

What creates the heavy `153` chunk:

- The `153` chunk is about `6.55 MB` raw.
- It contains listing dataset strings such as:
  - `Dishoom`
  - `Royal Nawaab`
  - `workingHours`
  - `the-curry-club-london`
- It is included in the `/compare/page` build manifest.
- `src/app/compare/page.tsx` renders `CompareSavedListings`.
- `src/components/CompareSavedListings.tsx` imports `getClientShortlistListingSummaries`.
- `src/data/shortlist-summaries.ts` imports `listingSearchRecords`, which pulls the large listing search dataset into the compare page client bundle.

Why the heavy compare chunk affects the homepage:

- The homepage network requests include:
  - `/compare/index.txt?...`
  - `/_next/static/chunks/app/compare/page-de95b3efd02ec80a.js`
  - `/_next/static/chunks/153-00f1a8c384dfe4c7.js`
- The header renders `SavedListingsLink`, a normal Next `Link` to `/compare/`.
- The likely mechanism is Next route prefetch: the homepage prefetches the compare route, and that pulls the compare page’s large dataset chunk into the homepage session.
- This is not required for first render of the homepage.

TBT root-cause conclusion:

- TBT is partly homepage hydration work, because the main content currently appears through a client-rendering bailout.
- TBT is also strongly affected by unnecessary route prefetching of `/compare/`, which brings the large shortlist/listing dataset chunk into the homepage load.
- This is app code and Next prefetch behavior, not a hosting problem.

Recommended first fix target, not implemented yet:

- Fix CLS first by restoring server-rendered homepage main content:
  - split `DirectoryListingsInteractiveShell` so the default homepage `<main>` renders as server HTML.
  - move `useSearchParams` into a smaller client enhancer that only handles filtered/query URLs after hydration.
  - avoid `<Suspense fallback={null}>` producing a blank homepage main area.
- Then fix TBT by stopping unnecessary heavy compare-route prefetch:
  - likely add `prefetch={false}` to the header saved/compare link as the first small experiment.
  - later, reduce the compare page bundle by making shortlist summaries load only when the compare page actually needs them.

Investigation limitation:

- A browser-side `PerformanceObserver` capture was attempted through Chrome remote debugging, but Chrome did not expose the debugging endpoint reliably in this local environment.
- Lighthouse JSON, live HTML, exported HTML, route manifests, and network-request evidence were sufficient to identify the root causes.

## CLS And TBT Fix Notes - 2026-06-21

Goal:

- Fix the two confirmed remaining PageSpeed score problems from the latest desktop report:
  - CLS caused by the homepage main content missing from initial static HTML.
  - TBT caused partly by unnecessary `/compare/` prefetch loading the large dataset chunk.

What changed:

- Added `src/components/DirectoryListingsView.tsx`.
  - This holds the visible homepage directory markup.
  - It renders search, SEO links, filters, results, source guide, related rows, and footer-following content as real initial HTML.
- Changed `src/components/DirectoryListingsInteractiveShell.tsx`.
  - It now owns only the model state and renders `DirectoryListingsView`.
  - It no longer calls `useSearchParams`.
- Added `src/components/DirectoryListingsQueryController.tsx`.
  - This is a small browser-only enhancer for query-string changes.
  - It reads `window.location.search` after load and lazy-loads the browser listing model only when filtered query parameters are present.
  - This avoids a Next.js `BAILOUT_TO_CLIENT_SIDE_RENDERING` marker on the homepage.
- Changed `src/app/page.tsx`.
  - Removed the outer `<Suspense fallback={null}>` wrapper around the homepage directory content.
- Changed `src/components/SavedListingsLink.tsx`.
  - Added `prefetch={false}` to the Saved/Compare link.
  - This keeps `/compare/` available when clicked, but stops the homepage from preloading the compare route and its heavy dataset chunk.
- Added `scripts/homepage-performance-regression.test.ts`.
  - Checks that the homepage does not use the blank Suspense fallback.
  - Checks that the compare link has `prefetch={false}`.
  - Checks fresh static export output for `<main>` before `<footer>`, no bailout marker, and no homepage `153` dataset chunk.

Verification:

- `npm run typecheck`: passed.
- `npm run build`: passed.
  - Homepage `/` remained about `201 kB First Load JS`.
  - `.next/server/app/index.html` contains `<main>` before `<footer>`.
  - `.next/server/app/index.html` does not contain `BAILOUT_TO_CLIENT_SIDE_RENDERING`.
  - `.next/app-build-manifest.json` homepage `/page` does not include the large `153` dataset chunk.
- `npm run prepare:cloudflare`: passed.
  - Fresh static export completed.
  - Static export build runtime: `427.9s` (`7m 08s`).
  - Cloudflare checks passed with `7,351` files and no asset over `25 MiB`.
  - Fresh `out/index.html` contains `<main>` before `<footer>`.
  - Fresh `out/index.html` does not contain:
    - `BAILOUT_TO_CLIENT_SIDE_RENDERING`
    - `compare/index.txt`
    - `153-`
- `npm run test`: passed.
  - `81` tests passed.
  - Runtime: `1m 3.91s`.

Expected PageSpeed effect after the next upload:

- CLS should drop materially because the footer is no longer rendered before the homepage main content.
- TBT should improve because the homepage should no longer fetch the compare route or the large `153` dataset chunk before the visitor clicks Saved/Compare.
- A fresh Google PageSpeed run after upload is still required to measure the real external score.

Deployment status:

- Direct Cloudflare Pages upload completed on June 21, 2026.
- Command used: `npx wrangler pages deploy out --project-name indianrestaurantlondon`.
- Cloudflare preview URL: `https://00329054.indianrestaurantlondon.pages.dev`.
- Upload result:
  - `7,302` files uploaded.
  - `49` files were already uploaded.
  - Upload/deploy runtime from Wrangler: about `1105s`.
- Live custom domain check after upload:
  - `https://indianrestaurantlondon.co.uk/` returned `200`.
  - Live HTML contains `<main>` before `<footer>`.
  - Live HTML does not contain `BAILOUT_TO_CLIENT_SIDE_RENDERING`.
  - Live HTML does not contain `compare/index.txt`.
  - Live HTML does not contain `153-`.
  - Live homepage page chunk: `/_next/static/chunks/app/page-12fd58c1f65d1f23.js`.
- Next action:
  - Rerun Google PageSpeed for desktop and mobile and save the third report for comparison.
- Future upload rule:
  - **Superseded:** do not use the raw direct-upload instructions below. The guarded workflow in `docs/cloudflare-upload-checklist.md` replaced this advice on 2026-07-15 because an ignored `out/` directory can be stale and cannot prove source or artifact provenance.
  - If `npm run prepare:cloudflare` has already passed and no files changed after it, use direct upload only:
    - `npx wrangler pages deploy out --project-name indianrestaurantlondon`
  - Do not rerun the full publish workflow in that case, because it repeats typecheck, tests, static export, Cloudflare checks, and then upload.
  - The direct upload can still take a long time because the static export currently contains about `7,351` files.

## Third Google PageSpeed Check - 2026-06-21

Report checked:

- Desktop report URL: `https://pagespeed.web.dev/analysis/https-indianrestaurantlondon-co-uk/cru5y5wr9z?form_factor=desktop`
- Report timestamp shown by PageSpeed: June 21, 2026, `1:44:44 PM`.

Important finding:

- This report does not show the old CLS root cause.
- Extracted embedded Lighthouse data from the saved report page shows:
  - mobile block:
    - form factor: `mobile`
    - CLS: `0`
    - LCP: error `NO_LCP`
    - TBT: error `NO_LCP`
    - Accessibility: `0.96`
    - Best Practices: `1`
    - SEO: `1`
  - desktop block:
    - form factor: `desktop`
    - CLS: `0`
    - LCP: error `NO_LCP`
    - TBT: error `NO_LCP`
    - Accessibility: `0.96`
    - Best Practices: `1`
    - SEO: `1`
- The saved report data does not contain:
  - `BAILOUT_TO_CLIENT_SIDE_RENDERING`
  - `/compare/index.txt`
  - `/_next/static/chunks/153-`
  - `body > footer` / `footer.border-t` layout-shift evidence

Live site verification at the same time:

- `https://indianrestaurantlondon.co.uk/` returned:
  - status `200`
  - `Cache-Control: public, max-age=0, must-revalidate`
  - `CF-Cache-Status: DYNAMIC`
  - `<main>` present before `<footer>`
  - no `BAILOUT_TO_CLIENT_SIDE_RENDERING`
  - no `153-` dataset chunk reference
- A cache-busting request to `https://indianrestaurantlondon.co.uk/?psitest=20260621` returned the same corrected HTML.
- A Lighthouse-like user agent also received the corrected HTML.

Interpretation:

- The original CLS problem appears fixed on the live site and in the embedded Google report data.
- The new PageSpeed problem is different: Google Lighthouse failed with `NO_LCP`, so it could not compute normal LCP/TBT/Performance values in that run.
- This looks like a PageSpeed/Lighthouse measurement failure or transient rendering/capture issue, not the old missing-homepage-HTML issue.
- Next investigation should focus on why Google Lighthouse sometimes fails to detect LCP, not on the old footer CLS fix.

## Fourth Google PageSpeed Check - 2026-06-21 Desktop

Report checked:

- Desktop report URL: `https://pagespeed.web.dev/analysis/https-indianrestaurantlondon-co-uk/0xv1jo0drc?form_factor=desktop`
- Report timestamp shown by PageSpeed: June 21, 2026, `6:27:54 PM`.
- Device: Desktop.
- Lighthouse version shown by PageSpeed: `13.4.0`.

Headline scores:

| Category | Score |
| --- | ---: |
| Performance | 98 |
| Accessibility | 96 |
| Best Practices | 100 |
| SEO | 100 |
| Agentic Browsing | 2/2 |

Performance metrics:

| Metric | Result | Score contribution shown |
| --- | ---: | ---: |
| First Contentful Paint | `0.3 s` | `+10` |
| Largest Contentful Paint | `0.6 s` | `+25` |
| Total Blocking Time | `120 ms` | `+28` |
| Cumulative Layout Shift | `0` | `+25` |
| Speed Index | `0.5 s` | `+10` |

Comparison against the previous problematic PageSpeed run:

| Metric / score | Previous problematic run | New desktop run | Result |
| --- | ---: | ---: | --- |
| Performance | unavailable / critical due to `NO_LCP` | `98` | Fixed |
| LCP | `NO_LCP` | `0.6 s` | Fixed |
| TBT | `NO_LCP` | `120 ms` | Fixed / good |
| CLS | `0` | `0` | Still fixed |
| Accessibility | `96` | `96` | unchanged |
| Best Practices | `100` | `100` | unchanged |
| SEO | `100` | `100` | unchanged |

Remaining PageSpeed items shown:

- Render-blocking requests: estimated saving `40 ms`.
- Use efficient cache lifetimes: estimated saving `41 KiB`.
- Improve image delivery: estimated saving `61 KiB`.
- Legacy JavaScript: estimated saving `11 KiB`.
- Reduce unused JavaScript: estimated saving `43 KiB`.
- Avoid long main-thread tasks: `2` long tasks found.
- Avoid non-composited animations: `24` animated elements found.
- Accessibility remains `96`, with contrast still listed as the visible area to review later.

Conclusion:

- The `NO_LCP` issue is fixed in the fresh Google desktop report.
- The old major Performance blockers are now resolved for desktop.
- Remaining items are small polish/optimization tasks, not critical blockers.

## Cloudflare Static Cache Header Fix - 2026-06-21

Goal:

- Replace the old `4 hour` cache lifetime on first-party static assets with a long immutable cache.
- Keep HTML/documents revalidated so content updates can still publish normally.

What changed:

- Added `public/_headers`.
- Added Cloudflare Pages header rules:
  - `/_next/static/*`
    - `Cache-Control: public, max-age=31536000, immutable`
  - `/vendor/leaflet/*`
    - `Cache-Control: public, max-age=31536000, immutable`
  - `/robots.txt`
    - `Cache-Control: public, max-age=0, must-revalidate`
  - `/sitemap.xml`
    - `Cache-Control: public, max-age=0, must-revalidate`
- Updated `scripts/check-cloudflare-export.ts` so future Cloudflare preparation fails if `out/_headers` is missing or does not contain the long-cache static asset rules.

Verification:

- Before rebuilding, `npm run check:cloudflare` failed as expected because the old `out/` folder did not include `_headers`.
- `npm run prepare:cloudflare`: passed.
  - Fresh export generated `7,353` files including `out/_headers`.
  - Cloudflare export checks passed.
- `npm run test`: passed.
  - `82` tests passed.
  - Runtime: `1m 23.54s`.
- Cloudflare upload completed.
  - Preview URL: `https://08b07523.indianrestaurantlondon.pages.dev`
  - Wrangler output confirmed: `Uploading _headers`.

Live header check after upload:

| Path | Cache-Control |
| --- | --- |
| `/` | `public, max-age=0, must-revalidate` |
| `/_next/static/css/950e010059abb158.css` | `public, max-age=31536000, immutable` |
| `/_next/static/chunks/255-81ba70bd132d3eed.js` | `public, max-age=31536000, immutable` |
| `/vendor/leaflet/leaflet.css` | `public, max-age=31536000, immutable` |
| `/sitemap.xml` | `public, max-age=0, must-revalidate` |
| `/robots.txt` | still `public, max-age=14400, must-revalidate` on the live check |

Conclusion:

- The important first-party static assets now use long immutable caching.
- This should remove or reduce the first-party part of repeat-visit cache warnings.
- The remaining PageSpeed cache warning is still expected for third-party assets:
  - Googleusercontent restaurant image cache lifetime.
  - Cloudflare Insights script cache lifetime.

## NO_LCP Investigation - 2026-06-21

Goal:

- Investigate why the new PageSpeed report shows a critical Performance state even though the old CLS issue is fixed.
- Check Google screenshots, live HTML, local Lighthouse behavior, and the homepage/root layout code.
- No production code fix was made during this investigation.

Google report evidence:

- Report URL: `https://pagespeed.web.dev/analysis/https-indianrestaurantlondon-co-uk/cru5y5wr9z?form_factor=desktop`
- Saved local report HTML:
  - `.diagnostics/pagespeed-cru5y5wr9z.html`
- Extracted embedded Lighthouse JSON:
  - `.diagnostics/pagespeed-cru5y5wr9z-report-mobile.json`
  - `.diagnostics/pagespeed-cru5y5wr9z-report-desktop.json`
- Extracted screenshots:
  - `.diagnostics/pagespeed-cru5y5wr9z-mobile-screens/`
  - `.diagnostics/pagespeed-cru5y5wr9z-desktop-screens/`

Google desktop block:

- Form factor: `desktop`
- Lighthouse version: `13.4.0`
- Fetch time: `2026-06-21T10:44:47.621Z`
- Main document:
  - status `200`
  - resource size `410589`
  - transfer size about `29178`
  - final URL `https://indianrestaurantlondon.co.uk/`
- FCP:
  - `298 ms`
- Speed Index:
  - `369 ms`
- CLS:
  - `0`
- LCP:
  - error `NO_LCP`
- TBT:
  - error `NO_LCP`
- Performance category:
  - `null`, because Lighthouse could not compute the normal performance score with missing LCP.

Google screenshot evidence:

- Desktop final screenshot shows the homepage rendered normally:
  - header visible
  - H1 `Indian Restaurants in London` visible
  - search form visible
  - homepage SEO links visible
- Mobile final screenshot also shows the homepage rendered normally.
- This proves Google did not see a blank page.
- The failure is specifically that the browser/Lighthouse did not record a Largest Contentful Paint candidate.

Live HTML evidence:

- `https://indianrestaurantlondon.co.uk/` returns corrected static HTML:
  - `<main>` present before `<footer>`
  - no `BAILOUT_TO_CLIENT_SIDE_RENDERING`
  - no `/compare/index.txt`
  - no `/_next/static/chunks/153-`
- `https://indianrestaurantlondon.co.uk/?psitest=20260621` returns the same corrected HTML.
- A Lighthouse-like user agent also receives the corrected HTML.

Local reproduction:

- A local Lighthouse run against the live URL printed the same `NO_LCP` stack from Lighthouse internals, but the JSON artifact could still contain a valid score in some runs.
- Direct Chrome PerformanceObserver testing is more useful for isolating the browser behavior:
  - simple test page: LCP entries recorded normally
  - `https://example.com/`: LCP entries recorded normally
  - live homepage with normal scripts: no LCP entries recorded
  - exact exported `out/index.html` opened as a local file without loading `_next/static` scripts: LCP recorded normally
  - local static server with exported homepage and Next scripts loaded: no LCP entries recorded
  - local static server with `_next/static` scripts blocked: LCP recorded normally

Root-cause direction:

- The issue is not blank HTML, not missing content, and not the old footer CLS shift.
- The issue is tied to client-side hydration/Next JavaScript on the homepage.
- The root layout currently wraps the whole site in the client `AccountProvider`:
  - `src/app/layout.tsx`
  - `src/components/AccountProvider.tsx`
  - `src/components/Header.tsx`
  - `src/components/SavedListingsLink.tsx`
- Because `AccountProvider` is a client component and wraps `{children}`, the homepage `<main>` is inside a root client hydration boundary.
- Diagnostic mutation capture showed thousands of DOM mutations in `<main>` before first paint during hydration.
- This hydration pattern appears to create a timing/race condition where Chrome/Lighthouse records FCP but no LCP candidate.

Recommended next fix target, not implemented yet:

- Remove the whole-page client boundary from the root layout.
- Keep `src/app/layout.tsx` mostly server-rendered.
- Move account/shortlist browser state into smaller client islands:
  - header saved-count client component
  - account menu client component
  - save-listing buttons where needed
- Do not wrap the homepage `<main>` and footer in `AccountProvider`.
- Re-test with direct Chrome PerformanceObserver before uploading:
  - normal scripts loaded should record at least one `largest-contentful-paint` entry.
  - expected LCP candidate is likely the hero description paragraph or first homepage SEO section text.

## NO_LCP Fix Notes - 2026-06-21

Goal:

- Fix the `NO_LCP` failure from the third Google PageSpeed report.
- Keep the homepage static-export friendly and avoid bringing back the large homepage dataset chunk.

What changed:

- Removed the root-level account provider wrapper from `src/app/layout.tsx`.
  - The layout now renders `Header`, `{children}`, and `Footer` directly.
  - `src/components/AccountProvider.tsx` now exposes `useAccount()` through a providerless external store using `useSyncExternalStore`.
  - `AccountProvider` remains only as a no-op compatibility wrapper for older tests/components.
- Made the header server-rendered and non-hydrating.
  - `src/components/Header.tsx` no longer uses client state.
  - The saved link remains a normal link with `prefetch={false}`.
  - The mobile menu uses native `details`/`summary`.
- Split the homepage directory rendering path correctly.
  - `src/components/DirectoryListingsPage.tsx` now renders `DirectoryListingsView` directly as server output.
  - `DirectoryListingsInteractiveShell` is no longer wrapped around the default homepage.
  - `src/components/DirectoryListingsQueryEnhancer.tsx` only lazy-loads the browser shell and dataset when the URL has query filters such as `/?q=dosa`.
- Removed sticky positioning from the header.
  - Confirmed local cause: with `sticky top-0`, Chrome could show FCP and a normal screenshot but sometimes record no LCP candidate.
  - With the header changed to normal positioning, Chrome records an LCP candidate on the exported homepage.
- Tightened homepage query handling.
  - Unknown query parameters such as `?verify=...` or `?utm_source=...` are ignored by the directory query enhancer.
  - Only real directory filter/query keys can wake the lazy browser dataset.
  - This prevents tracking/cache-busting URLs from accidentally loading the large dataset chunk.

Corrected root-cause conclusion:

- The first hypothesis, whole-page account hydration, was only part of the risk and was removed.
- The final local reproduction showed the exported homepage still missed LCP until the sticky header was removed.
- The confirmed final trigger was header sticky positioning in combination with the styled homepage.
- The earlier CLS/footer issue remains fixed:
  - the exported homepage contains `<main>` before `<footer>`.
  - no `BAILOUT_TO_CLIENT_SIDE_RENDERING` marker is present.

Verification:

- `npx.cmd tsx scripts/account-hydration-boundary.test.ts`: passed.
- `npx.cmd tsx scripts/source-hygiene.test.ts`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
  - Homepage `/`: `3.42 kB`, `197 kB First Load JS`.
- `npm run prepare:cloudflare`: passed.
  - Static export generated `3,648` pages.
  - Cloudflare checks passed with `7,352` files and no asset over `25 MiB`.
- `npm run test`: passed.
  - `82` tests passed.
  - Final runtime after the query allow-list update: `1m 6.15s`.

Final local exported-site browser check:

- URL tested locally: exported `out/` homepage served from `127.0.0.1`.
- Result:
  - LCP entries: `1`
  - LCP candidate: hero description paragraph under `Indian Restaurants in London`
  - candidate size: `26,918`
  - CLS: `0`
  - server main hidden: `false`
  - client directory main loaded: `false`
  - no `BAILOUT_TO_CLIENT_SIDE_RENDERING`
  - no `/compare/` prefetch
  - no `153-` dataset chunk requested

Expected PageSpeed effect after upload:

- Google should no longer fail with `NO_LCP` if it receives the new export.
- CLS should remain `0`.
- The homepage should still avoid the large dataset chunk on the default `/` path.

Deployment status:

- Final Cloudflare Pages upload completed on June 21, 2026.
- Command used: `npx wrangler pages deploy out --project-name indianrestaurantlondon`.
- Cloudflare preview URL: `https://bbe50b67.indianrestaurantlondon.pages.dev`.
- Upload result:
  - `7,288` files uploaded.
  - `64` files were already uploaded.
  - Upload/deploy runtime from Wrangler: about `1141s`.
- Live custom domain verification after upload:
  - `https://indianrestaurantlondon.co.uk/` returned `200`.
  - `https://indianrestaurantlondon.co.uk/?verify=20260621-saved-count` returned `200`.
  - both responses contain `<main>` before `<footer>`.
  - both responses do not contain `BAILOUT_TO_CLIENT_SIDE_RENDERING`.
  - both responses do not contain `153-`.
  - both responses contain the non-sticky header class: `z-40 border-b border-line bg-white`.
  - both responses contain `data-shortlist-count`, so the saved-count updater is included without a React header wrapper.
- Google PageSpeed API check could not be run from here immediately after upload because Google returned `429 Too Many Requests`.

## Follow-Up Investigation - First Major Root Cause

Investigation date: June 19, 2026

Goal:

- Identify the first major root cause behind the low Performance score before making code changes.
- Confirm whether the problem is code, hosting, third-party scripts, images, or CSS.

What was done:

- Confirmed the original report baseline from this document.
- Ran `npm run build` locally.
- Started the production build locally with `next start`.
- Ran Lighthouse-style audits against both:
  - Local production site: `http://127.0.0.1:3000/`
  - Live uploaded site: `https://indianrestaurantlondon.co.uk/`
- Compared desktop and mobile results.
- Inspected `.next` build output, route chunk sizes, app manifests, and generated JavaScript chunks.
- Traced the homepage import chain from `src/app/page.tsx` into the large browser bundle.
- Stopped the local production server after the investigation.

Audit files saved temporarily during investigation:

- `C:/Users/user/AppData/Local/Temp/irl-lighthouse-local-desktop.json`
- `C:/Users/user/AppData/Local/Temp/irl-lighthouse-local-mobile.json`
- `C:/Users/user/AppData/Local/Temp/irl-lighthouse-live-desktop.json`
- `C:/Users/user/AppData/Local/Temp/irl-lighthouse-live-mobile.json`

### Local vs Live Results

| Test | Performance | Total Blocking Time | Main Observation |
| --- | ---: | ---: | --- |
| Local desktop | 38 | 3,860 ms | Reproduces locally |
| Local mobile | 34 | 17,850 ms | Much worse on mobile |
| Live desktop | 38 | 3,850 ms | Matches local closely |
| Live mobile | 36 | 18,400 ms | Matches local closely |

Conclusion:

- The main issue is not hosting.
- The issue reproduces locally in a production build.
- The first major problem is application JavaScript and data shipped to the browser.

### Confirmed Root Cause

The homepage ships the full restaurant search dataset to the browser.

Key evidence:

- The production build reports the homepage `/` at about `965 kB` First Load JS.
- Simple static pages are around `103 kB` First Load JS.
- The homepage includes this very large generated chunk:
  - `.next/static/chunks/153-00f1a8c384dfe4c7.js`
  - About `6.87 MB` uncompressed.
- That generated chunk contains restaurant data:
  - `workingHours` appears `3,187` times.
  - `googleusercontent` appears `95` times.
  - Restaurant names such as `Dishoom` and `Royal Nawaab` appear inside the browser chunk.
- The source data file is almost the same size:
  - `data/listing-search-records.json`
  - About `6.86 MB`.

Confirmed import chain:

1. `src/app/page.tsx`
   - Imports `DirectoryListingsPage`.
2. `src/components/DirectoryListingsPage.tsx`
   - Is a client component because it starts with `"use client"`.
   - Uses `useSearchParams`.
   - Imports `filterListingSearchRecords`, `getDirectorySearchRows`, and homepage helpers from `@/lib/listing-search`.
3. `src/lib/listing-search.ts`
   - Imports `listingSearchRecords` from `@/data/listing-search-records`.
   - Filters, sorts, counts, and builds sidebar/homepage links from the full dataset.
4. `src/data/listing-search-records.ts`
   - Imports `../../data/listing-search-records.json`.
   - Exports the full dataset.

Because `DirectoryListingsPage` is a client component, this chain pulls the full search dataset into the browser JavaScript bundle.

### Secondary Contributors

These are real issues, but they are not the first major fix target:

- `AccountProvider` is mounted in `src/app/layout.tsx` and imports Supabase through `src/lib/supabase-browser.ts`.
  - This pulls Supabase code into the root client bundle.
  - This likely contributes to the unused JavaScript warning around chunk `497`.
- `ListingMap` lazy-loads Leaflet with `import("leaflet")`.
  - Leaflet itself is not the main first-load problem because it is lazy-loaded.
- Listing cards and image components are client-side.
  - They add hydration work, timers, and state.
  - This matters, but the largest problem is still the full dataset being bundled into the homepage route.

### First Fix Target

Recommended first fix target, not implemented yet:

Convert the homepage directory rendering and filtering path so the large dataset stays server-side.

Specific direction:

- Split `DirectoryListingsPage` into:
  - A server component/wrapper that reads search params, filters, sorts, paginates, and builds the listing/sidebar/homepage data.
  - Small client components only for controls that truly need browser interactivity.
- Keep `data/listing-search-records.json` out of client components.
- Keep filter links and pagination as normal links/forms where possible.
- Avoid importing `@/lib/listing-search` from any client component unless that module no longer imports the full JSON dataset.

Expected impact:

- Remove the `6.87 MB` restaurant dataset chunk from the homepage browser bundle.
- Reduce JavaScript parsing/evaluation.
- Reduce Total Blocking Time.
- Improve mobile Performance first, where the JavaScript penalty is worst.

## Issue Category 1: JavaScript Work

This is the biggest performance issue.

Findings:

- Total Blocking Time is very high at 4,100 ms.
- Main-thread work is about 5.8 s.
- JavaScript execution time is about 4.9 s.
- Most main-thread time is spent on script evaluation.
- One JavaScript chunk has about 43 KB of unused JavaScript.
- Legacy JavaScript/polyfills are also flagged.

Specific files flagged:

- `/_next/static/chunks/255-81ba70bd132d3eed.js`
  - Around 3.7 s total JavaScript work.
  - Main contributor to JavaScript execution time.
  - Also flagged for legacy JavaScript/polyfills.
- `/_next/static/chunks/153-00f1a8c384dfe4c7.js`
  - Around 723 ms total JavaScript work.
  - Also flagged as missing a source map.
- `/_next/static/chunks/497-ffb6fb15fbd03317.js`
  - About 47.6 KB total.
  - About 44.1 KB unused.
  - Around 92.8% unused.
- `/_next/static/chunks/app/compare/page-c13bce9c1e52e8c7.js`
  - Around 216 ms JavaScript work.
- `/_next/static/chunks/app/page-c35985fac68e8fd5.js`
  - Flagged for forced reflow.

Likely fix direction:

- First fix target: keep the full listing search dataset server-side.
- Split `DirectoryListingsPage` so filtering, sorting, pagination, sidebar data, homepage SEO links, and related rows are calculated by a server component/wrapper.
- Keep only small genuinely interactive controls as client components.
- Check which components are unnecessarily running on the client.
- Move static directory content to server-rendered components where possible.
- Lazy-load interactive widgets that are not needed on first load.
- Review third-party/client-side scripts.
- Check whether map, filters, comparison, or business-card interactions are increasing the shared JavaScript bundle.
- Review the Next.js build output to find which dependency creates the large chunks.

## Issue Category 2: Layout Shift

The Cumulative Layout Shift score is poor at 0.658.

Findings:

- Lighthouse found one large layout shift.
- The footer was identified as the main shifted element.
- Flagged selector:
  - `body > footer.border-t`
- Footer node label:
  - `Indian Restaurants London`
  - Directory footer content

Likely fix direction:

- Check if content above the footer is changing height after load.
- Reserve stable space for images, maps, cards, or dynamic sections.
- Make sure lazy-loaded content has fixed dimensions before it loads.
- Check if fonts are causing late resizing.
- Check if restaurant cards or sections are inserted after the initial render.

## Issue Category 3: Images

At least one image is larger than needed.

Specific image flagged:

- Royal Nawaab restaurant image
- Source:
  - `https://lh3.googleusercontent.com/p/AF1QipOCLv3lTyfK233b33a6MvQxp95z9Vk6NwwUE9w`
- Displayed as:
  - Royal Nawaab Indian restaurant in Ilford, London
- Estimated saving:
  - About 65 KB

Findings:

- Image file is larger than its display size.
- Image could benefit from better compression or a modern image format such as WebP or AVIF.
- Reported actual image dimensions were larger than rendered dimensions.

Likely fix direction:

- Use optimized local images where possible instead of remote Googleusercontent images.
- Add responsive image sizes.
- Compress heavy restaurant images.
- Make sure Next Image is configured properly for remote image optimization.
- Consider saving controlled image copies in the project for important listing images.

## Issue Category 4: Render-Blocking CSS

One CSS file is delaying initial render slightly.

Specific file flagged:

- `/_next/static/css/7eb9dbc9ff99ee13.css`

Finding:

- Estimated saving is about 80 ms.

Likely fix direction:

- This is not the biggest issue.
- Keep CSS lean.
- Check whether unused global styles can be reduced.
- Prioritize JavaScript and layout shift before this.

## Issue Category 5: Caching

Google flagged cache lifetime improvements.

Assets flagged:

- Googleusercontent image:
  - `https://lh3.googleusercontent.com/p/AF1QipOCLv3lTyfK233b33a6MvQxp95z9Vk6NwwUE9w`
  - Cache lifetime around 1 day.
  - Estimated saving around 32.6 KB.
- Cloudflare insights script:
  - `https://static.cloudflareinsights.com/beacon.min.js/...`
  - Cache lifetime around 1 day.
  - Estimated saving around 4.7 KB.

Likely fix direction:

- For first-party assets, use long cache lifetimes with hashed filenames.
- For third-party assets, control is limited.
- Moving important remote images into local optimized assets may improve caching control.

## Issue Category 6: Console Errors

Lighthouse found browser console errors.

Errors:

- `https://indianrestaurantlondon.co.uk/favicon.ico`
  - 404 missing favicon.
- `https://indianrestaurantlondon.co.uk/best/budget-friendly/index.txt?...`
  - 404 missing resource.

Likely fix direction:

- Add or correctly route `favicon.ico`.
- Investigate why the `/best/budget-friendly/index.txt` request is happening.
- Confirm if this is related to Next.js routing, static export, or RSC/data fetching.

## Issue Category 7: Accessibility Polish

Accessibility score is good at 91, but there are fixable issues.

### Contrast Issues

Examples flagged:

- Header logo badge:
  - Text: `IR`
  - Foreground: white
  - Background: orange `#f97316`
  - Contrast ratio: 2.8
  - Required ratio: 4.5
- Some green rating badges:
  - Review count text has insufficient contrast.
- Some red closed-status badges:
  - Example text: `Closed - Opens at 12 PM`
  - Slightly under required contrast.

Likely fix direction:

- Darken orange background or change logo text color.
- Darken small badge text or increase contrast between text and badge background.
- Recheck all small text inside colored pills.

### ARIA Issues

Findings:

- Plain links are using `aria-pressed`, which is not allowed for normal anchor links.
- A view toggle has mismatched visible and accessible labels.

Specific examples:

- `Open now` link:
  - Uses `aria-pressed="false"`
  - Lighthouse says this ARIA attribute is not allowed on that element.
- `List` / `Grid view` toggle:
  - Visible text says `List`
  - Accessible label says `Grid view`
  - Lighthouse flags this as a label mismatch.
- `Map view` link:
  - Uses `aria-pressed="false"`

Likely fix direction:

- Use buttons for toggle controls where possible.
- If links must remain links, remove `aria-pressed`.
- Make visible text and `aria-label` match.
- For current page/filter state, use suitable patterns such as `aria-current` where appropriate.

## Smaller / Lower Priority Findings

### Missing Source Map

Flagged file:

- `/_next/static/chunks/153-00f1a8c384dfe4c7.js`

Finding:

- Large first-party JavaScript file is missing a source map.

Priority:

- Low for public user experience.
- Useful for debugging and Lighthouse insight quality.

### Back / Forward Cache

Finding:

- Page prevented back/forward cache restoration.
- Reported reason:
  - Navigation was cancelled before the page could be restored from back/forward cache.

Priority:

- Probably low unless repeated in future tests.
- Lighthouse marked the reason as not actionable.

### Forced Reflow

Flagged file:

- `/_next/static/chunks/app/page-c35985fac68e8fd5.js`

Finding:

- About 42 ms forced reflow.

Priority:

- Medium-low by itself.
- Could be related to layout measurement or client-side UI updates.

## Suggested Fix Order

1. Fix the first major performance root cause: keep `data/listing-search-records.json` server-side by splitting `DirectoryListingsPage`.
2. Rebuild and confirm the homepage no longer ships the large `153` dataset chunk.
3. Rerun Lighthouse locally and compare Total Blocking Time and First Load JS.
4. Then reduce secondary client JavaScript, especially root-level Supabase/account code if it remains unnecessary on first load.
5. Fix layout shift by finding what changes height above the footer.
6. Optimize the flagged restaurant images.
7. Fix console errors because they are clear and quick.
8. Fix ARIA label/toggle issues and color contrast issues.
9. Review caching and remote image strategy.
10. Rerun PageSpeed and compare scores.

## Working Notes For Next Session

Do not assume SEO needs major changes. SEO is already 100.

Focus on Performance first. The largest likely gains should come from:

- Removing the full listing search dataset from the browser bundle.
- Reducing JavaScript execution.
- Reducing Total Blocking Time.
- Stopping the footer/layout shift.
- Optimizing oversized restaurant images.

The codebase appears to be a Next.js site, so fixes should be checked carefully against server/client component boundaries and the static export/deployment setup.

## Static Export Fix Notes - 2026-06-20

Goal:

- Make `npm run build:static` complete reliably for upload/static hosting.
- Keep the homepage JavaScript improvement intact.
- Ensure generated static SEO files use `https://indianrestaurantlondon.co.uk`.

Changes made:

- Added `scripts/static-export-diagnostics.ts` and `npm run diagnose:static`.
- Updated `npm run build:static` to set:
  - `NEXT_PUBLIC_SITE_URL=https://indianrestaurantlondon.co.uk`
  - `NEXT_STATIC_EXPORT=1`
- Added indexed listing filter counts in `src/lib/listing-filter-counts.ts`.
- Updated static route params to use indexed counts instead of repeated full directory filtering.
- Updated related listing lookup to use indexes instead of scanning all listings for each listing detail page.
- Changed the listing detail "Similar listings" grid to receive compact summaries instead of full listing records.

Verification results:

- Normal `npm run build` passes.
- Homepage remains at `201 kB First Load JS`.
- Homepage `/page` chunks still do not include the old `153-*` dataset chunk.
- `npm run build:static` now completes:
  - Generated static pages: `3,647`
  - Dynamic params: `3,630`
  - Listing pages: `3,187`
- `scripts/check-cloudflare-export.ts` passes with the production site URL.
- `out/sitemap.xml` and `out/robots.txt` now contain `https://indianrestaurantlondon.co.uk`.

Static export diagnostics after the fix:

- `out/` files: `7,345`
- `out/` size: `1021.73 MB`
- `out/listings`: `766.32 MB`
- Before this fix, the previous stale export was about:
  - `out/`: `1.19 GB`
  - `out/listings`: `964.98 MB`
- Main improvement:
  - Listing output reduced by about `198 MB`.
  - Route param generation reduced from tens of seconds for neighborhoods to milliseconds.

Remaining note:

- The static output is now valid and upload-check clean, but still large because all `3,187` listing detail pages are exported.
- A later optimization pass should target SEO landing pages and listing detail HTML/RSC payload size if upload time or hosting storage becomes a problem.

## CLS Root-Cause Investigation Notes - 2026-06-20

Goal:

- Investigate the layout shift only.
- Identify the real element or component causing the biggest homepage CLS.
- Do not change production code during this step.

Original Google PageSpeed baseline:

- CLS: `0.658`
- Lighthouse reported one large layout shift.
- Reported shifted element: `body > footer.border-t`
- Interpretation at the time: the footer was probably the visible victim, not the source. Something above the footer was likely changing height after load.

Current local baseline after JavaScript/static export fixes:

- Fresh production build completed successfully.
- Homepage `/` remains at about `201 kB First Load JS`.
- Mobile homepage was tested from the static output at `http://127.0.0.1:3000/`.
- Viewport used for runtime inspection: `390 x 844`.

Runtime CLS evidence:

- Browser layout-shift entries were checked with `window.performance.getEntriesByType("layout-shift")`.
- Result: no layout-shift entries were recorded.
- Calculated runtime CLS from those entries: `0`.
- No shifted nodes were available in the current local/static run because no layout shift was reproduced.

Observed page geometry in the current local/static run:

- Footer selector:
  - `html > body > footer.border-t.border-line.bg-ink`
- Footer rectangle:
  - top: `13706`
  - bottom: `15103`
  - height: `1397`
- Main homepage sections above the footer:
  - Search/header panel: top `97`, bottom `578`, height `481`
  - Homepage SEO links: top `602`, bottom `3228`, height `2626`
  - Directory/filter/listing area: top `3260`, bottom `13674`, height `10414`

Component checks:

- `DirectoryListingsInteractiveShell` now renders from a compact server-built initial model on the default homepage.
- The full listing search dataset is only lazy-loaded when query parameters require filtering.
- `ListingResultsRow` still updates open/closed state after hydration, but the card border width stays stable, so this is not currently strong evidence for a large shift.
- `DirectoryImage` sits inside fixed-size/aspect-ratio wrappers in the listing rows, so image fallback should not move the footer in the current structure.

Finding:

- The old PageSpeed footer shift did not reproduce locally after the homepage JavaScript/server split and static export fixes.
- Current evidence says the exact shifted element in the present local build is: none recorded.
- The old shifted element was the footer, but the most likely root cause was content above the footer changing height during hydration in the older build.
- The likely old source area was the homepage directory/filter/listing section, because it sits directly above the footer and previously had much heavier client-side rendering work.

Evidence limitations:

- A fresh Lighthouse JSON/HTML report was not produced locally because Lighthouse is not installed in the project and downloading it requires network access.
- The in-app browser did not expose a usable `PerformanceObserver` probe for live attribution, but the browser performance entry API did expose layout-shift entries.
- Screenshot export from the in-app browser failed due local write permissions, so screenshots were not saved.

Recommended next step:

- Rerun Google PageSpeed or Lighthouse against the deployed site before making any CLS code fix.
- If CLS is still reported, inspect the new live trace first and focus on the section directly above the footer: the directory/filter/listing area, then the homepage SEO links.
- Do not change the footer itself unless a fresh trace proves the footer is the source rather than the victim.

## Image Performance Investigation Notes - 2026-06-20

Goal:

- Investigate the image performance issue only.
- Identify whether the original PageSpeed image warning is one bad image or a broader image strategy issue.
- Do not change production code, listing data, or image assets during this step.

Current build baseline:

- Fresh `npm run build` completed successfully.
- Homepage `/` remains at about `201 kB First Load JS`.
- Local homepage was inspected from `http://127.0.0.1:3000/`.

Original Google PageSpeed image finding:

- Flagged image: Royal Nawaab restaurant image.
- URL:
  - `https://lh3.googleusercontent.com/p/AF1QipOCLv3lTyfK233b33a6MvQxp95z9Vk6NwwUE9w`
- Original report issue:
  - Image was larger than its displayed size.
  - Image could benefit from better compression or a modern format.

Current homepage image inventory:

- The default homepage first result page has only two listing cards with image URLs:
  - Rank 7: Royal Nawaab
  - Rank 12: Haweli Restaurant
- All other first-page listing cards use the visual fallback instead of remote photos.
- Related homepage rows did not add additional image-bearing cards in the current initial model.

Current mobile evidence:

- Viewport tested: `390 x 844`.
- Royal Nawaab is below the first viewport, around `7765px` from the top before scrolling.
- Haweli Restaurant is also below the first viewport, around `11073px` from the top before scrolling.
- Both images are rendered with `loading="lazy"`.
- No Googleusercontent image requests were observed during the initial mobile viewport load.
- Royal Nawaab image after scrolling:
  - Natural size: `512 x 421`
  - Rendered size: about `339 x 210`
  - Format: JPEG
  - Response size from direct header check: `81,106` bytes
  - Cache header: `public, max-age=86400, no-transform`

Current desktop evidence:

- Viewport tested: `1280 x 720`.
- Royal Nawaab is below the first viewport, around `3177px` from the top before scrolling.
- Haweli Restaurant is below the first viewport, around `4729px` from the top before scrolling.
- Both images are lazy-loaded.
- Royal Nawaab image after scrolling:
  - Natural size: `512 x 421`
  - Rendered size: about `280 x 304`
  - Format: JPEG
  - Response size from direct header check: `81,106` bytes

Other homepage image header checks:

- Haweli Restaurant first image:
  - URL: `https://lh3.googleusercontent.com/p/AF1QipNaCihEIRqpx2Yi7_Q47SLvY7Hcy8FIx7zgvA9r`
  - Format: JPEG
  - Response size: `79,768` bytes
  - Cache header: `public, max-age=86400, no-transform`
- Royal Nawaab second carousel image:
  - Direct header check returned `403 Forbidden`.
- Haweli Restaurant second carousel image:
  - Direct header check returned `403 Forbidden`.

Implementation findings:

- `DirectoryImage` uses Next Image, but passes `unoptimized={true}` for Googleusercontent and Street View image hosts.
- Static export also sets `images.unoptimized`, so static-upload builds do not use the Next image optimizer.
- Homepage listing image URLs come from the listing data and are passed through `listingResultSummaryFromListing`.
- The image component receives a useful `sizes` value for listing rows:
  - `(min-width: 1280px) 280px, (min-width: 768px) 240px, 100vw`
- The issue is not missing dimensions. The card image wrappers reserve stable space.

Finding:

- In the current local build, the original Royal Nawaab image is not a first-viewport problem because it is far below the fold and lazy-loaded.
- The current Royal Nawaab file is not extremely large by byte size, but it is still served directly as a remote JPEG instead of a locally optimized WebP/AVIF or controlled resized asset.
- The broader root cause is the image strategy for Googleusercontent photos:
  - remote images bypass Next optimization,
  - static export cannot optimize remote images at request time,
  - some carousel image URLs are fragile and return `403` to direct checks,
  - cache control is controlled by Google, not by this site.

Recommended first fix target, not implemented yet:

- Treat this as a controlled image strategy issue, not just a single Royal Nawaab photo issue.
- For the most important homepage/listing photos, create local optimized image assets or a controlled image ingestion step that stores right-sized WebP/AVIF copies.
- Start with the two current homepage image-bearing listings:
  - Royal Nawaab
  - Haweli Restaurant
- Keep lazy loading for below-the-fold listing images.
- Keep fixed image wrappers because they already protect layout stability.

Evidence limitations:

- Browser resource timing did not expose transfer sizes for Googleusercontent images, so direct header checks were used for byte size.
- Local browser paint/LCP entries were not available in this browser runtime.
- This investigation used local/static behavior and should be compared with the next live Google PageSpeed report after upload.

## Render-Blocking CSS Investigation Notes - 2026-06-20

Goal:

- Investigate the render-blocking CSS issue only.
- Identify whether the flagged CSS file is a meaningful score problem or a small polish item.
- Do not change production code during this step.

Original Google PageSpeed CSS finding:

- Flagged file:
  - `/_next/static/css/7eb9dbc9ff99ee13.css`
- Original estimated saving:
  - about `80 ms`
- Original priority:
  - lower than JavaScript blocking, CLS, and image strategy.

Current build baseline:

- Fresh `npm run build` completed successfully.
- Homepage `/` remains at about `201 kB First Load JS`.
- Current generated CSS file:
  - `.next/static/css/7eb9dbc9ff99ee13.css`
- Current CSS size:
  - raw: `44,539` bytes
  - gzip: `9,657` bytes
  - brotli: `8,431` bytes

Current CSS source findings:

- The root layout imports one global stylesheet through `src/app/layout.tsx`.
- The global stylesheet is `src/app/globals.css`.
- `src/app/globals.css` imports:
  - `leaflet/dist/leaflet.css`
- Leaflet CSS size by itself:
  - raw: `14,806` bytes
  - gzip: `3,532` bytes
  - brotli: `2,967` bytes
- The generated first-load CSS contains map-specific selectors:
  - `.leaflet-container`
  - `.leaflet-marker-icon`
  - `.leaflet-popup`
  - `.leaflet-control`
  - `.directory-map-cluster`
- The generated CSS contains `240` occurrences of `leaflet`.

Generated HTML evidence:

- The generated homepage HTML includes a normal stylesheet link:
  - `/_next/static/css/7eb9dbc9ff99ee13.css`
- That stylesheet is loaded from the root layout, so it is shared by the homepage and other pages.
- The generated default homepage HTML did not contain rendered map content:
  - no `view=map` state
  - no `Loading map`
  - no rendered map text from the map component

Browser evidence:

- Default homepage `/` was checked on mobile and desktop.
- Mobile viewport: `390 x 844`.
- Desktop viewport: `1280 x 720`.
- Both default views loaded one stylesheet:
  - `/_next/static/css/7eb9dbc9ff99ee13.css`
- Both default views had:
  - `0` `.leaflet-container` elements
  - normal listing article content
- Optional map URL `/?view=map` was also checked.
- After hydration, map view rendered:
  - `1` `.leaflet-container`
  - `71` marker or cluster elements
  - Leaflet panes present in the DOM

Finding:

- The render-blocking CSS issue is real but small.
- The main avoidable contributor is Leaflet map CSS being bundled into the global first-load stylesheet.
- The default homepage list view does not need Leaflet CSS at first render.
- Map view does need Leaflet CSS, so any future fix must keep map styling available for `?view=map`.
- This is not currently a major score-damage issue because the original PageSpeed saving was only about `80 ms`, and the compressed CSS is under `10 KB`.

Likely contributor ranking:

1. Leaflet CSS in global first-load CSS:
   - avoidable for default list view
   - about `3.5 KB` gzip
2. Tailwind/base/global CSS:
   - mostly expected for the app shell and homepage UI
   - less obvious low-risk removal target
3. Custom dark-mode and print styles:
   - small, not likely worth prioritizing before larger issues

Recommended first fix target, not implemented yet:

- Move Leaflet CSS out of the global first-load stylesheet and load it only for the map path/component.
- Keep `directory-map-cluster` and dark Leaflet overrides with the map-specific CSS.
- Before implementing, test both:
  - default `/` list view
  - `/?view=map` map view
- Because the saving is small, do this after higher-value issues unless it is quick and low risk.

Evidence limitations:

- A fresh Lighthouse JSON/HTML report was not generated locally.
- The local browser confirmed DOM behavior, CSS links, and map rendering, but not a new PageSpeed score.
- The next live Google PageSpeed report after upload should confirm whether this warning remains.

## Map-Only CSS Split Fix Notes - 2026-06-20

Goal:

- Fix the small render-blocking CSS issue by removing Leaflet map CSS from the global first-load stylesheet.
- Keep map view working for `/?view=map`.
- Keep static export/upload hosting support.

Changes made:

- Removed `@import "leaflet/dist/leaflet.css"` from `src/app/globals.css`.
- Moved map-only custom CSS out of `src/app/globals.css`.
- Added public map CSS assets:
  - `public/vendor/leaflet/leaflet.css`
  - `public/vendor/leaflet/directory-map.css`
  - `public/vendor/leaflet/images/*`
- Updated `ListingMap` so it injects these map CSS files only when the map component mounts.
- Added a source-hygiene test to stop Leaflet CSS from returning to the global stylesheet.

Before:

- Global CSS file:
  - `.next/static/css/7eb9dbc9ff99ee13.css`
- Size:
  - raw: `44,539` bytes
  - gzip: `9,657` bytes
  - brotli: `8,431` bytes
- Leaflet selectors in global CSS:
  - yes
  - `240` occurrences of `leaflet`

After:

- Global CSS file:
  - `.next/static/css/78437f8b77fc8469.css`
- Size:
  - raw: `33,437` bytes
  - gzip: `7,249` bytes
  - brotli: `6,264` bytes
- Leaflet selectors in global CSS:
  - no
  - `0` occurrences of `leaflet`
- First-load CSS reduction:
  - raw: `11,102` bytes
  - gzip: `2,408` bytes
  - brotli: `2,167` bytes

Verification:

- `npm run test` passes.
- `npm run build` passes.
- `npm run build:static` passes.
- Static export produced `3,647` pages and completed successfully.
- Exported homepage HTML includes only the normal app stylesheet and does not include:
  - `/vendor/leaflet/leaflet.css`
  - `/vendor/leaflet/directory-map.css`
- Browser verification:
  - `/` mobile and desktop load only the app CSS.
  - `/` mobile and desktop have `0` `.leaflet-container` elements.
  - `/?view=map` injects both map CSS files.
  - `/?view=map` renders `1` Leaflet container.
  - `/?view=map` renders `71` marker or cluster elements.
  - `Loading map...` disappears after map hydration.

Impact:

- This was a small PageSpeed polish fix, not a major score driver.
- It removes unnecessary map CSS from the default homepage first render while preserving map behavior.

## Caching / Repeat-Visit Performance Investigation Notes - 2026-06-20

Goal:

- Investigate PageSpeed's caching warning before making fixes.
- Separate assets we control from assets controlled by Google or Cloudflare.
- Confirm whether first-party static-export assets need better hosting cache headers.

Saved report baseline:

- PageSpeed flagged caching as a smaller issue.
- Flagged third-party assets:
  - Royal Nawaab Googleusercontent image:
    - `https://lh3.googleusercontent.com/p/AF1QipOCLv3lTyfK233b33a6MvQxp95z9Vk6NwwUE9w`
    - Reported cache lifetime: about `1 day`
    - Reported possible saving: about `32.6 KB`
  - Cloudflare Insights script:
    - `https://static.cloudflareinsights.com/beacon.min.js/...`
    - Reported cache lifetime: about `1 day`
    - Reported possible saving: about `4.7 KB`

Current local/static export observations:

- `out/index.html` does not include the Cloudflare Insights script.
- `out/index.html` still references Googleusercontent restaurant images.
- Current exported homepage CSS is the new post-map-split file:
  - `out/_next/static/css/78437f8b77fc8469.css`
  - size: `33,437` bytes
- Static export asset groups:
  - `out/_next/static/css`: `1` file, `33,437` bytes
  - `out/_next/static/chunks`: `49` files, `8,239,544` bytes
  - `out/vendor/leaflet`: `7` files, `21,944` bytes
  - `out/images`: `2` files, `2,766,696` bytes

Asset cache classification:

- Hashed Next assets:
  - `/_next/static/css/*`
  - `/_next/static/chunks/*`
  - These are safe candidates for long cache headers because filenames change when content changes.
- Public vendor map assets:
  - `/vendor/leaflet/*`
  - These can also use long cache headers, but they are not content-hashed, so this should be handled carefully if the vendor files change later.
- Documents:
  - `/`
  - HTML pages
  - `/sitemap.xml`
  - `/robots.txt`
  - These should usually stay short-cache or revalidated.
- Third-party assets:
  - Googleusercontent restaurant images
  - Cloudflare Insights script
  - These cache headers are not controlled by this repo.

Live site header findings:

- The live site is still an older upload/build, not the latest local static export.
- Evidence:
  - Live homepage still references old CSS:
    - `/_next/static/css/7eb9dbc9ff99ee13.css`
  - Live homepage still includes the old large homepage dataset chunk:
    - `/_next/static/chunks/153-00f1a8c384dfe4c7.js`
  - Live homepage still includes Cloudflare Insights.
  - Live `/vendor/leaflet/*` returns `404`, because the new map-only CSS assets have not been uploaded yet.

Live first-party cache headers checked:

- `/`
  - status: `200`
  - `Cache-Control`: `public, max-age=0, must-revalidate`
  - `CF-Cache-Status`: `DYNAMIC`
  - Assessment: acceptable for HTML.
- `/_next/static/css/7eb9dbc9ff99ee13.css`
  - status: `200`
  - `Cache-Control`: `public, max-age=14400, must-revalidate`
  - `CF-Cache-Status`: `REVALIDATED`
  - Assessment: works, but weak for a hashed static asset. `14400` seconds is only `4 hours`.
- `/_next/static/chunks/153-00f1a8c384dfe4c7.js`
  - status: `200`
  - `Cache-Control`: `public, max-age=14400, must-revalidate`
  - `CF-Cache-Status`: `REVALIDATED`
  - Assessment: works, but weak for a hashed static asset.
- Other live Next chunks checked:
  - `/_next/static/chunks/255-81ba70bd132d3eed.js`
  - `/_next/static/chunks/app/page-c35985fac68e8fd5.js`
  - `/_next/static/chunks/main-app-f90d62a4e8bf9309.js`
  - `/_next/static/chunks/webpack-6c23e821fdab771a.js`
  - All returned `Cache-Control: public, max-age=14400, must-revalidate`.
- `/sitemap.xml`
  - status: `200`
  - `Cache-Control`: `public, max-age=0, must-revalidate`
  - Assessment: acceptable for XML document output.
- `/robots.txt`
  - status: `200`
  - `Cache-Control`: `public, max-age=14400, must-revalidate`
  - Assessment: acceptable, though short-cache/revalidate would also be fine.

Third-party header findings:

- Royal Nawaab Googleusercontent image:
  - URL: `https://lh3.googleusercontent.com/p/AF1QipOCLv3lTyfK233b33a6MvQxp95z9Vk6NwwUE9w`
  - status: `200`
  - `Cache-Control`: `public, max-age=86400, no-transform`
  - `Expires`: `Sun, 21 Jun 2026 06:54:56 GMT`
  - `Content-Type`: `image/jpeg`
  - `Content-Length`: `81,106` bytes
  - Control: Google-controlled, not controlled by this repo.
- Haweli Googleusercontent image checked as a second sample:
  - URL: `https://lh3.googleusercontent.com/p/AF1QipNaCihEIRqpx2Yi7_Q47SLvY7Hcy8FIx7zgvA9r`
  - status: `200`
  - `Cache-Control`: `public, max-age=86400, no-transform`
  - `Content-Type`: `image/jpeg`
  - `Content-Length`: `79,768` bytes
  - Control: Google-controlled, not controlled by this repo.
- Cloudflare Insights script:
  - URL: `https://static.cloudflareinsights.com/beacon.min.js/v833ccba57c9e4d2798f2e76cebdd09a11778172276447`
  - status: `200`
  - `Cache-Control`: `public, max-age=86400`
  - `ETag`: `W/"2026.5.0"`
  - `Last-Modified`: `Thu, 18 Jun 2026 14:05:09 GMT`
  - `Content-Type`: `text/javascript;charset=UTF-8`
  - `Content-Length`: `33,228` bytes
  - Control: Cloudflare-controlled, not controlled by this repo.

Root cause:

- The original PageSpeed caching warning is mostly caused by third-party assets with `1 day` cache lifetimes.
- Those third-party cache lifetimes cannot be directly changed from the website code.
- A separate first-party opportunity was found:
  - live hashed Next files currently use only `4 hour` cache headers.
  - hashed static assets can normally use a much longer cache such as `1 year` with `immutable`.
  - this is a hosting/header configuration issue, not an app-code performance bug.
- Because the live site is still the older upload, the next upload should be tested again after the recent local fixes are published.

Recommended first fix target, not implemented yet:

- Add static-hosting cache rules for first-party assets:
  - `/_next/static/*`: `Cache-Control: public, max-age=31536000, immutable`
  - `/vendor/leaflet/*`: evaluate long cache, likely `Cache-Control: public, max-age=31536000, immutable`
  - `/`, HTML pages, `/sitemap.xml`, `/robots.txt`: keep short-cache or revalidate.
- Upload checklist:
  - `docs/cloudflare-upload-checklist.md`
- Keep third-party caching documented as limited-control:
  - Googleusercontent image caching should be handled through the image strategy if we want control.
  - Cloudflare Insights script caching can only be avoided by removing/disabling that analytics script, which is probably not worth doing for this small warning unless PageSpeed still complains after bigger fixes.

Conclusion:

- Caching is a lower-priority issue than the JavaScript, static export, CLS, and image strategy work.
- The only directly controllable caching improvement found is better hosting headers for first-party static assets.
- No production code fix was made during this investigation.

## Budget-Friendly Console Error Fix Notes - 2026-06-20

Goal:

- Fix the non-favicon console error related to `/best/budget-friendly/index.txt?...`.
- Keep favicon work on hold until a favicon asset exists.

Root cause:

- The site linked to `/best/budget-friendly/` from generated popular-search links.
- Static export skipped `/best/budget-friendly/` because the page's listing count was `0`.
- The count was wrong: the data has `325` listings with `priceLevel: "£"`.
- The generic filter matcher slugified listing values, and `slugify("£")` becomes empty, so `filters.price` could never match `£`, `££`, or `£££` values.

Fix made:

- Updated price filtering to use exact value matching for `priceLevel`.
- Kept slug-based matching for normal text filters such as area, category, service, dietary, and similar filters.
- Added regression checks so:
  - `filterListings({ price: "£" })` returns listings.
  - `filterListings({ price: ["£"] })` returns listings.
  - static popular search params include `budget-friendly`.

Verification:

- `npx.cmd tsx scripts/dynamic-routes.test.ts` passes.
- `filterListings({ price: "£" })` returns `325` listings.
- `filterListings({ price: ["£"] })` returns `325` listings.
- `npm run build:static` passes.
- Static export generated `3,648` pages.
- Confirmed generated files:
  - `out/best/budget-friendly/index.html`
  - `out/best/budget-friendly/index.txt`

Expected live impact after upload:

- The `/best/budget-friendly/index.txt?...` console error should disappear after the new static export is uploaded.
- The missing favicon console error remains intentionally on hold.

## Test Suite Runtime Investigation And Fix Notes - 2026-06-20

Question:

- `npm run test` previously timed out after about `10 minutes`.
- This does not directly affect live visitor PageSpeed because visitors do not run the test suite.
- It can still point to slow build/static-generation code if tests exercise sitemap, SEO route, or static export helpers.

Findings:

- The test suite was not truly stuck; it was too slow.
- Timed run before the fix took about `533` seconds.
- Slowest tests before the fix included:
  - `template-readiness-audit.test.ts`: about `103` seconds
  - `seo-pages.test.ts`: about `39` seconds
  - `directory-growth.test.ts`: about `37` seconds
  - `listing-indexation.test.ts`: about `36` seconds
  - `seo-audit.test.ts`: about `33` seconds
  - `sitemap.test.ts`: about `32` seconds
- Root cause:
  - sitemap, SEO audit, and template readiness checks were repeatedly running full listing filters to count route eligibility.
  - This repeated scanning affects local tests and build/static-generation work, not normal browser runtime.

Fix made:

- Reused indexed listing filter counts for route-count checks.
- Added price support to the count index so `priceLevel: "£"` and the `budget-friendly` route stay correctly counted.
- Updated sitemap, SEO audit, and template readiness route-count logic to use indexed counts where possible.
- Kept a safe fallback to full filtering for unsupported complex filters.
- Added a performance regression check covering static route params and sitemap generation.

Verification:

- `npx.cmd tsx scripts/static-route-params-performance.test.ts` passes.
- `npx.cmd tsx scripts/seo-audit.test.ts` passes.
- `npx.cmd tsx scripts/dynamic-routes.test.ts` passes.
- Previously slow tests after the fix:
  - `template-readiness-audit.test.ts`: about `9` seconds
  - `sitemap.test.ts`: about `5` seconds
  - `seo-pages.test.ts`: about `11` seconds
  - `directory-growth.test.ts`: about `5` seconds
  - `seo-audit.test.ts`: about `4` seconds
  - `generic-copy.test.ts`: about `5` seconds
  - `listing-indexation.test.ts`: about `9` seconds
- `npm run test` now completes successfully in about `292` seconds.
- `npm run build:static` passes and exports `3,648` pages.
- Homepage first-load JS remains at `201 kB`.

Impact:

- Main benefit is developer/build confidence and faster verification.
- Possible secondary benefit is less repeated work during sitemap/static generation.
- No direct PageSpeed browser-performance change is expected from this test-suite fix.

## Accessibility Affected Sections Investigation Notes - 2026-06-20

Goal:

- Investigate Google Accessibility issues around contrast and ARIA labels.
- Do not change production code during this step.

Starting point:

- Saved Google report Accessibility score: `91`.
- Reported issue groups:
  - contrast failures
  - invalid ARIA on links
  - visible label / accessible label mismatch

Affected components confirmed:

- Header logo badge:
  - `src/components/Header.tsx`
  - class: `bg-primary text-white`
  - visible text: `IR`
- Results controls:
  - `src/components/ListingsResults.tsx`
  - `OpenNowLink`
  - `ViewToggle`
- Rating badge:
  - `src/components/RatingPill.tsx`
  - class: `bg-secondary text-white`
  - review count uses `opacity-85`
- Open/closed badge:
  - `src/components/OpenStatusBadge.tsx`
  - open class: `bg-emerald-50 text-emerald-700`
  - closed class: `bg-red-50 text-red-600`
- Listing result usage:
  - `src/components/ListingCard.tsx`
  - `src/components/ListingResultsRow.tsx`
  - listing detail page also uses `RatingPill`

Contrast measurements:

| Element / pair | Foreground | Background | Ratio | Result |
| --- | --- | --- | ---: | --- |
| Header logo `IR` | `#ffffff` | `#f97316` | `2.80` | Fail |
| Rating pill main text | `#ffffff` | `#15803d` | `5.02` | Pass |
| Rating pill review count with `opacity-85` | approx `#dcece2` | `#15803d` | `4.09` | Fail |
| Open badge | `#047857` | `#ecfdf5` | `5.21` | Pass |
| Closed badge | `#dc2626` | `#fef2f2` | `4.41` | Slight fail |
| Muted text on white | `#64748b` | `#ffffff` | `4.76` | Pass |
| Muted text on orange-50 | `#64748b` | `#fff7ed` | `4.48` | Slight fail |

Contrast root cause:

- The header orange brand badge is too light for white normal-size text.
- The rating pill background is dark enough, but the review count opacity lowers contrast below `4.5`.
- The closed status badge is very close to passing but still below `4.5`.
- Some muted small text on orange-tinted surfaces can also fall just below `4.5`.

ARIA findings:

- `src/components/ListingsResults.tsx` uses `aria-pressed` on Next `Link` components, which render as normal anchor links.
- Confirmed affected links:
  - `OpenNowLink`
    - visible text: `Open now`
    - attribute: `aria-pressed={openOnly}`
  - `ViewToggle` list link
    - visible text: `List`
    - accessible label: `Grid view`
    - attribute: `aria-pressed={mode === "grid"}`
  - `ViewToggle` map link
    - visible text: `Map`
    - accessible label: `Map view`
    - attribute: `aria-pressed={mode === "map"}`
- Other `aria-pressed` usage exists on real button controls:
  - `src/components/SaveListingButton.tsx`
  - `src/components/SearchableCardGrid.tsx`
  - These are less likely to be invalid because they are button controls.

Exported HTML confirmation:

- Current `out/index.html` does not include the view-toggle `aria-pressed` markup in static HTML.
- Current `out/best/best-rated/index.html` does include:
  - `aria-pressed="false"` on `Open now`
  - `aria-label="Grid view"` with visible text `List`
  - `aria-pressed="true"` on the list/grid link
  - `aria-label="Map view"` and `aria-pressed="false"` on the map link
- Local server check was not possible because `http://127.0.0.1:3000/` was not running during this investigation.

Root cause:

- Contrast:
  - failing color pairs are real in the current codebase.
  - primary failures are the header badge, rating pill review-count opacity, and closed badge color pair.
- ARIA:
  - the Google ARIA findings are real in the current codebase.
  - `ViewToggle` mixes link navigation semantics with toggle-button state semantics.
  - the visible label `List` does not match the accessible label `Grid view`.

Recommended first fix target, not implemented yet:

- Fix `ListingsResults.tsx` ARIA first because it is a clear semantic error:
  - remove `aria-pressed` from links, or convert controls to real buttons if the behavior becomes client-side state.
  - keep links if navigation/query URLs must remain crawlable and static-hosting-friendly.
  - make accessible labels match visible labels, e.g. `List view` and `Map view`.
- Then fix the small color contrast failures:
  - darken the logo badge background or use dark text on orange.
  - remove review-count opacity inside `RatingPill` or use a stronger text color.
  - darken closed badge text from red-600 to a darker red.

Conclusion:

- The next fix should be small and low risk.
- This is an Accessibility score polish task, not a major Performance/PageSpeed task.
- No production code change was made during this investigation.

## Accessibility Contrast And ARIA Fix Notes - 2026-06-20

Goal:

- Fix the confirmed Accessibility issues around contrast and ARIA labels.
- Keep result controls as URL links so static hosting, filtering URLs, and crawl behavior remain unchanged.
- Keep favicon work out of scope.

Changes made:

- `src/components/ListingsResults.tsx`
  - Removed `aria-pressed` from the `Open now`, `List`, and `Map` result links.
  - Kept the controls as links because they navigate to query-string URLs.
  - Changed the list control accessible label from `Grid view` to `List view`.
  - Added `aria-current="page"` to the active list/map view link.
- `src/components/Header.tsx`
  - Changed the logo initials badge from `bg-primary text-white` to `bg-orange-100 text-ink`.
- `src/components/RatingPill.tsx`
  - Removed `opacity-85` from the review-count text.
- `src/components/OpenStatusBadge.tsx`
  - Changed the closed badge from `text-red-600` to `text-red-700`.
- `scripts/accessibility-static.test.ts`
  - Added a regression test for the ARIA and contrast source rules.

Contrast after the fix:

| Element / pair | Foreground | Background | Ratio | Result |
| --- | --- | --- | ---: | --- |
| Header logo `IR` | `#1f2933` | `#ffedd5` | `12.88` | Pass |
| Rating pill review count | `#ffffff` | `#15803d` | `5.02` | Pass |
| Closed badge | `#b91c1c` | `#fef2f2` | `5.91` | Pass |
| Open badge | `#047857` | `#ecfdf5` | `5.21` | Pass |

Exported HTML confirmation:

- Checked `out/best/best-rated/index.html`.
- Result view controls now include:
  - `aria-label="List view"`
  - `aria-label="Map view"`
  - `aria-current="page"` on the active view link
- `aria-label="Grid view"` is no longer present.
- `aria-pressed` still appears on save buttons, which is acceptable because those controls are buttons, not normal links.

Verification:

- `npx.cmd tsx scripts/accessibility-static.test.ts` passes.
- `npx.cmd tsx scripts/source-hygiene.test.ts` passes.
- `npm run test` passes.
- `npm run build:static` passes.
- Static export generated `3,648` pages.
- Homepage first-load JS remains `201 kB`.

Expected live impact after upload:

- Google's contrast warnings for the header badge, rating review count, and closed badge should be resolved.
- Google's invalid ARIA warning for result-view links should be resolved.
- The Accessibility score should improve from the previous `91`, assuming no new live-only issues are introduced.

## Static Export Stall Investigation - 2026-06-21

Goal:

- Investigate why `npm run build:static` previously timed out after about `20` minutes before uploading to Cloudflare.
- Determine whether the issue is a real code/build problem, static export volume, or workflow interference from the local dev server.

Starting state:

- No project Node/Next processes were running at the start of the clean investigation.
- Existing `.next/` and `out/` folders were from previous runs.
- Existing `out/` had `7,351` files before the clean export check.

Normal production build:

- Command: `npm run build`
- Result: passed.
- Runtime: `103.61s` / about `1m 44s`.
- Homepage first-load JS remained `201 kB`.
- Conclusion: normal compile/build is healthy. The earlier problem is specific to static export workflow/volume, not basic TypeScript/Next compilation.

Static route diagnostics:

- Command: `NEXT_PUBLIC_SITE_URL=https://indianrestaurantlondon.co.uk npm run diagnose:static`
- Total dynamic params: `3,631`.
- Route families:
  - listings: `3,187`
  - neighborhoods: `204`
  - area categories: `159`
  - areas: `33`
  - categories: `23`
  - popular searches: `7`
  - offerings: `5`
  - services: `4`
  - types: `4`
  - dietary: `4`
  - guides: `1`
- Route param generation is not the bottleneck. The route helpers completed quickly, with listings taking about `1ms` and the largest measured helper under one second.

Clean static export:

- Command: `npm run build:static`
- Run with no local dev server active.
- Result: passed.
- Runtime: `424.93s` / about `7m 05s`.
- Generated pages: `3,648`.
- Export phase completed successfully.

Fresh `out/` folder after clean export:

- Files: `7,351`.
- Total size: `1014.92 MB`.
- Largest top folders:
  - `out/listings`: `6,376` files, `760.64 MB`
  - `out/areas`: `386` files, `107.98 MB`
  - `out/neighborhoods`: `408` files, `106.70 MB`
  - `out/categories`: `48` files, `13.70 MB`
  - `out/_next`: `52` files, `7.89 MB`
- Largest file:
  - `out/_next/static/chunks/153-00f1a8c384dfe4c7.js`: `6.55 MB`
- `out/sitemap.xml` and `out/robots.txt` both use `https://indianrestaurantlondon.co.uk`.
- `out/best/budget-friendly/index.html` and `out/best/budget-friendly/index.txt` both exist.

Cloudflare readiness:

- Command: `NEXT_PUBLIC_SITE_URL=https://indianrestaurantlondon.co.uk npm run check:cloudflare`
- Result: passed.
- Output: `Cloudflare export checks passed: 7,351 files, no asset over 25 MiB.`

Root-cause conclusion:

- The previous `20` minute timeout was not reproduced when the local dev server was stopped.
- The most likely immediate cause was workflow interference: the dev server and static build were both using the same project build workspace, especially `.next/`.
- Static export is still inherently heavy, because it writes about `1.0 GB` and generates `3,648` pages.
- Static route param generation is not currently the root cause.
- Normal build startup/import work is not currently the root cause, because `npm run build` completed successfully in about `1m 44s`.

Recommended next fix target, not implemented yet:

- Add a reliable `prepare:cloudflare` workflow/script that:
  - stops only this project’s dev server before exporting,
  - runs `build:static` with `NEXT_PUBLIC_SITE_URL=https://indianrestaurantlondon.co.uk`,
  - runs `check:cloudflare`,
  - reports the upload-ready `out/` folder clearly.
- Keep route/output-size optimization as a later improvement. The export is large, but it now completes reliably when the dev server is not active.

Current upload status:

- The latest clean `out/` folder is Cloudflare-check ready.
- Upload still needs Cloudflare deployment/direct upload using the `out/` folder.
