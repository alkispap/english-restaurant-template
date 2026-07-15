# Website Codebase Audit

**Project:** Indian Restaurants in London directory template
**Audit date:** 15 July 2026
**Audit mode:** Read-only investigation; no production fixes were included in the audit itself
**Verdict:** **Not ready for production**
**Overall score:** **6.0/10**

## Executive summary

The project has a strong SEO-oriented static architecture, broad automated coverage, and a successful production/static build. The main launch blockers are not build failures: they are user-visible runtime defects in query-driven listing pages, an excessive browser payload, accessibility gaps in the colour system and dialogs, and incomplete listing media/data quality.

The highest-priority functional defect is that `/restaurants/?q=...` and other query filters do not activate on the main directory route. A related defect causes SEO landing pages with query parameters to render both their original server results and their client-filtered results. Both issues can produce misleading result counts and duplicate controls.

## Scope inspected

- Application architecture, App Router routes, React components, TypeScript utilities, and configuration
- HTML semantics, CSS/Tailwind styling, browser-side behaviour, responsive layouts, and key journeys
- Directory data, filters, search, listing pages, SEO landing pages, schema, metadata, sitemap, robots, and canonical handling
- Dependencies, environment configuration, Supabase integration, JSON-LD output, Cloudflare/static-export setup, and deployment scripts
- Test, lint, type-check, normal build, static export, indexation, link-governance, and export-validation tooling

## Verification completed

| Check | Result |
| --- | --- |
| ESLint | Passed |
| TypeScript type-check | Passed |
| Automated test suite | 132/132 passed at audit time |
| Standard production build | Passed |
| Static export | Passed; 3,660 pages generated |
| SEO/indexation audit | Passed; 3,520 indexable URLs |
| Cloudflare export validation | Passed; 7,411 exported files |
| Browser console during sampled journeys | No console errors observed |
| Dependency audit | Five known vulnerabilities reported |
| Link governance | 934 warnings requiring ownership/review |

Passing checks do not cancel the confirmed browser defects below: the current automated suite did not exercise the affected static query-string journeys.

## Scorecard

| Area | Score | Rationale |
| --- | ---: | --- |
| Functionality | 4.5/10 | Core pages render, but search/filter state is broken on the primary directory route and duplicates results on SEO landing pages. |
| Security | 7.0/10 | No exposed secrets were confirmed, but dependency, JSON-LD hardening, error handling, and header work remains. |
| Performance | 4.0/10 | The export succeeds, but the first-load JavaScript and generated output are too large for a local directory. |
| Accessibility | 5.5/10 | Useful semantic work exists, but primary colour contrast, modal focus management, and some form labelling do not meet the intended WCAG 2.2 AA bar. |
| SEO | 8.0/10 | Strong route inventory, metadata, canonicals, sitemap, robots, and structured landing-page coverage; query duplication and link-governance warnings reduce confidence. |
| Maintainability | 7.5/10 | Typed modules and good automated coverage, with some configuration/content duplication and very large generated-data paths. |
| Design implementation | 6.0/10 | Coherent visual system and responsive structure, but contrast, modal behaviour, imagery coverage, and payload affect the delivered experience. |
| Reusability | 5.0/10 | A configuration layer exists, but Indian/London/domain assumptions remain embedded in scripts, content, assets, and deployment commands. |

### Scoring criteria

- **9–10:** Production-ready, resilient, fast, accessible, secure, and easy to extend.
- **7–8:** Strong implementation with contained, non-blocking issues.
- **5–6:** Functional foundation, but important launch risks or material quality gaps remain.
- **3–4:** Multiple core journeys or operational requirements are unreliable.
- **0–2:** Unsafe or fundamentally non-functional.

## Confirmed findings

### 1. High — Search and query filters do not activate on `/restaurants`

- **Location:** `src/app/restaurants/page.tsx:24-34`; `src/components/DirectoryListingsPage.tsx:16-29`
- **Evidence:** The static route renders `DirectoryListingsPage` without runtime query parameters. `DirectoryListingsPage` only mounts `DirectoryListingsQueryEnhancer` when the server-built model already has `model.searchQuery`. In a static export, the server model has no browser query string, so the enhancer required to read `window.location.search` is never mounted.
- **Reproduction:** Open `/restaurants/?q=Dishoom` in the exported site. The search term is present in the URL, but the page continues to show the unfiltered 3,187-listing result set.
- **Impact:** The directory's primary search and filter journey is misleading or unusable; marketing links containing filters also fail.
- **Recommended fix:** Mount the lightweight query enhancer unconditionally and keep its heavy search modules lazy-loaded only when a normalized query is present. Add a static-export browser regression test.

### 2. High — SEO landing pages duplicate server and client result regions

- **Location:** `src/components/SeoLandingQueryEnhancer.tsx:48-57`; `src/components/SeoLandingPageContent.tsx:64`
- **Evidence:** The enhancer sets the server container's HTML `hidden` property. That container also has the Tailwind `grid` display utility, whose authored `display: grid` rule wins over the user-agent `[hidden]` rule. The client result portal is then rendered as a second result region.
- **Reproduction:** Open an SEO landing page with a supported query parameter and inspect the page. The original heading/filter controls remain visible while a second filtered heading/filter set is inserted.
- **Impact:** Duplicate headings, controls, cards, and result counts confuse users and assistive technology and can degrade search-engine interpretation.
- **Recommended fix:** Ensure the active client result state applies an explicit `display: none`, or move the grid utility to a child so the server container's `hidden` state controls its display reliably. Add a regression assertion.

### 3. High — Browser payload and static output are excessive

- **Location:** `src/components/DirectoryListingsQueryEnhancer.tsx`; browser listing/search modules and generated listing data imported by the directory UI; `package.json:9`
- **Evidence:** The audited production output produced approximately 1.31 MB of first-load JavaScript, individual chunks around 1.04 MB, and an export close to 1.04 GB across 3,660 pages.
- **Reproduction:** Run the production/static build and inspect the route chunk manifest and output directory size.
- **Impact:** Slow download, parse, and execution on mobile devices; higher bounce risk; slow deploys and larger storage/bandwidth bills.
- **Recommended fix:** Add enforceable bundle budgets, split browser search data from server/static data, load query capabilities on demand, and avoid repeating large data payloads across generated pages.

### 4. High — Primary orange fails WCAG contrast when used with white text

- **Location:** `src/app/globals.css:16`; examples include `src/app/not-found.tsx:9` and other `bg-primary text-white` actions
- **Evidence:** `#f97316` against white measures approximately **2.80:1**, below WCAG 2.2 AA's 4.5:1 requirement for normal text and 3:1 for large text/UI graphical contrast where applicable.
- **Reproduction:** Check the foreground/background pair with a WCAG contrast calculator or browser accessibility tool.
- **Impact:** Buttons, badges, and links can be difficult to read for low-vision users and fail the project's stated AA target.
- **Recommended fix:** Introduce a darker accessible action token for white-on-colour controls and verify hover/focus/disabled states. Retain the current orange only where contrast requirements are still satisfied.

### 5. High — Most listing pages have no original image

- **Location:** imported/generated listing data consumed by `src/app/restaurants/[slug]/page.tsx:141`; fallback at `src/app/restaurants/[slug]/page.tsx:231`
- **Evidence:** 3,163 of 3,187 audited listings had no listing image.
- **Reproduction:** Run the template-readiness/data report and sample restaurant detail pages.
- **Impact:** Repetitive pages, weaker user trust and engagement, reduced social-card quality, and a less competitive directory experience.
- **Recommended fix:** Establish a licensed image-enrichment pipeline with provenance, validation, deduplication, refresh dates, and a designed cuisine/location fallback strategy.

### 6. Medium — Modal/dialog focus handling is incomplete

- **Location:** modal/dialog components identified by the accessibility review; focus styling is defined globally at `src/app/globals.css:51-53`
- **Evidence:** Sampled modal behaviour did not consistently demonstrate initial focus placement, focus trapping/inert background treatment, and focus restoration to the trigger.
- **Reproduction:** Open each dialog using only the keyboard, press Tab/Shift+Tab through its controls, press Escape, and inspect where focus returns.
- **Impact:** Keyboard and screen-reader users can lose context or interact with obscured page content.
- **Recommended fix:** Use a proven accessible dialog primitive or implement labelled dialog semantics, initial focus, a contained tab sequence, Escape handling, scroll lock, and trigger-focus restoration.

### 7. Medium — The template is only partially reusable for another cuisine/city

- **Location:** `package.json:9`; site/directory configuration and content modules; deployment/test strings referencing `indianrestaurantlondon.co.uk`
- **Evidence:** The public domain is embedded directly in the static build command, while cuisine, city, editorial copy, images, SEO plans, and assertions are distributed across multiple modules and scripts.
- **Reproduction:** Attempt to configure “Mexican Restaurants in London” using only environment/config changes; code, content, tests, and assets still require manual edits.
- **Impact:** Each new directory can drift, inherit incorrect brand/SEO content, and require error-prone search-and-replace work.
- **Recommended fix:** Create a validated per-directory content/config pack and make builds consume an environment-supplied public URL. Add a template-readiness test that rejects the source directory's brand/domain in a cloned configuration.

### 8. Medium — Five known dependency vulnerabilities are present

- **Location:** `package.json` and `package-lock.json`
- **Evidence:** The package-manager security audit reported five vulnerabilities at audit time.
- **Reproduction:** Run `npm audit` and review each dependency path and production reachability.
- **Impact:** Risk depends on whether affected packages enter production or only tooling; unresolved alerts weaken deployment confidence.
- **Recommended fix:** Triage each advisory, update direct/transitive dependencies with regression testing, and document any accepted risk rather than applying a blind breaking upgrade.

### 9. Medium — Privacy notice is incomplete for a production analytics/advertising setup

- **Location:** `src/lib/trust-pages.ts:70-92`
- **Evidence:** The page mentions browser storage, analytics, advertising, and cookies, but does not fully specify the actual providers/configuration, lawful basis/consent mechanism where required, retention, user choices, or contact/controller details.
- **Reproduction:** Compare the rendered policy with the analytics, advertising, forms, storage, and third-party integrations enabled for production.
- **Impact:** Users do not receive a complete operational disclosure; this creates compliance and trust risk.
- **Recommended fix:** Finalize the production data map first, then have the notice and consent behaviour reviewed for the launch jurisdictions. This is a legal-content review, not merely a copy edit.

### 10. Medium — Link governance reports 934 warnings

- **Location:** generated listing/content URLs and the link-governance audit output
- **Evidence:** The local governance check reported 934 warnings requiring review, despite no general build failure.
- **Reproduction:** Run the repository's link-governance script and inspect warning categories and affected records.
- **Impact:** Stale, redirected, low-quality, or unowned external links can erode trust and create a large moderation burden.
- **Recommended fix:** Group warnings by cause, define allow/deny and ownership rules, validate high-value links before launch, and schedule automated rechecks.

### 11. Medium — Some form controls rely on incomplete explicit labelling

- **Location:** directory filter/search and user-submission form components identified by the accessibility audit
- **Evidence:** Sampled controls include visual placeholder/adjacent text patterns where a persistent programmatic label is not consistently guaranteed.
- **Reproduction:** Inspect the accessibility tree and use a screen reader to navigate controls by label.
- **Impact:** Screen-reader and voice-control users may not know a control's purpose after entering a value.
- **Recommended fix:** Give every field a visible `<label>` tied with `htmlFor`/`id`, or an equivalent accessible name when a visible label is genuinely inappropriate. Keep instructions and errors programmatically associated.

### 12. Medium — Supabase failures can be swallowed or under-reported

- **Location:** `src/lib/supabase-browser.ts:13` and account/saved-listing synchronization callers
- **Evidence:** The optional client is dynamically created, but remote sync paths do not consistently surface actionable failures to the user or an operational error channel.
- **Reproduction:** Configure Supabase, block the request or return an authorization error, then attempt the related account/saved-data action.
- **Impact:** Users may believe data was saved or synchronized when it was not; operators lack diagnostic evidence.
- **Recommended fix:** Handle and classify Supabase errors at each mutation boundary, show a safe user state/retry path, and send structured diagnostics without sensitive payloads.

### 13. Medium — JSON-LD serialization needs script-safe escaping

- **Location:** `src/app/page.tsx:43-47`; `src/app/restaurants/[slug]/page.tsx:179-183`
- **Evidence:** JSON-LD is inserted using raw `JSON.stringify(...)` inside `dangerouslySetInnerHTML`. Imported/editorial strings containing `<`, `</script`, or related characters are not explicitly escaped for an HTML script context.
- **Reproduction:** Add a controlled listing value containing a script-closing sequence and inspect the rendered HTML source.
- **Impact:** At minimum, malformed structured data; if untrusted content can reach the field, an avoidable injection boundary exists.
- **Recommended fix:** Centralize JSON-LD serialization and escape `<` as `\u003c` (plus any other chosen script-context characters), then add hostile-string tests.

### 14. Low — Security headers are incomplete

- **Location:** `public/_headers`; `scripts/check-cloudflare-export.ts:47-60`
- **Evidence:** Cache rules are validated, but a complete production security-header policy is not enforced by the repository.
- **Reproduction:** Deploy a preview and inspect response headers for CSP, `X-Content-Type-Options`, referrer policy, permissions policy, clickjacking protection, and HSTS on the final HTTPS domain.
- **Impact:** Reduced browser-side hardening and weaker defence in depth.
- **Recommended fix:** Define headers compatible with the site's scripts, ads, maps, and analytics; test in report-only mode where appropriate before enforcing CSP.

### 15. Low — Leaflet assets depend on a public CDN at runtime

- **Location:** map/icon configuration referencing `unpkg.com`
- **Evidence:** Marker/icon URLs are loaded from Unpkg rather than being fully self-hosted with the exported application.
- **Reproduction:** Block the CDN or test offline and inspect map markers.
- **Impact:** Map presentation depends on a third party's availability, caching, and policy.
- **Recommended fix:** Vendor the required Leaflet images under `public/vendor/leaflet` and validate them in the export check.

### 16. Low — Cloudflare deployment documentation can drift from scripts

- **Location:** Cloudflare deployment documentation versus `package.json:9` and export-validation scripts
- **Evidence:** Build commands and validation behaviour have evolved, while prose documentation contains stale or duplicated operational guidance.
- **Impact:** A future directory may be deployed with the wrong URL, build mode, or verification sequence.
- **Recommended fix:** Make one runbook authoritative and test documented commands in CI.

### 17. Informational — Per-listing source provenance is not exposed as a first-class field

- **Location:** listing import/model types in `src/lib/directory-import.ts`; detail rendering in `src/app/restaurants/[slug]/page.tsx`
- **Evidence:** The model contains rich business fields, but does not provide a consistent visible “source/last verified” record per listing.
- **Impact:** Corrections, disputes, refreshes, and trust messaging are harder to manage at scale.
- **Recommended fix:** Add source identifiers, source URL/type, imported/verified timestamps, verification status, and editorial override history to the data model and admin workflow.

## Risks and suggestions not counted as confirmed defects

- Core Web Vitals should be measured on a deployed preview with real-device field or lab data; build artifact size is confirmed, but a specific LCP/INP/CLS failure was not claimed without that evidence.
- Cross-browser testing should cover current Chrome, Edge, Firefox, and Safari after the blocking query fixes; sampled local behaviour alone is not a complete compatibility certification.
- Legal requirements for privacy/cookies depend on the final providers, jurisdictions, and operating entity and require qualified review.

## Five most urgent fixes

1. Restore query-string search and filters on `/restaurants` and protect the journey with a static-export browser test.
2. Prevent duplicate result regions on SEO landing pages when query parameters activate client rendering.
3. Reduce first-load JavaScript and repeated generated data, with enforceable route-level budgets.
4. Replace failing white-on-orange combinations and complete modal/form accessibility work.
5. Establish launch-grade listing media, provenance, external-link, privacy, and dependency processes.

## Prioritized remediation roadmap

### Before launch

- Fix both confirmed query-rendering defects and add regressions.
- Establish bundle/output budgets and remove the largest avoidable client payloads.
- Correct contrast failures, dialog focus behaviour, and missing form labels.
- Triage dependency advisories and add production security headers.
- Escape JSON-LD safely and make Supabase mutations visibly reliable.
- Finalize privacy/cookie implementation against the actual production providers.
- Review high-risk link-governance warnings and establish minimum image/provenance quality.

### Soon after launch

- Complete licensed image enrichment for priority listings and measure engagement effects.
- Run real-device Core Web Vitals and cross-browser regression testing.
- Add automated external-link health checks and listing refresh queues.
- Improve empty, loading, retry, and degraded third-party-service states.

### Later improvements

- Convert brand/cuisine/city/domain/editorial content into validated directory packs.
- Add provenance and verification history throughout the listing model and moderation workflow.
- Automate cloning/bootstrap checks for future directories such as “Mexican Restaurants in London”.
- Continue reducing static-output duplication and introduce performance trend reporting.

## Production verdict

**Not ready.** The architecture is promising and the build pipeline is substantially developed, but a primary user journey is currently broken and a second produces duplicate content. Production readiness should be reconsidered after the “before launch” functional, performance, accessibility, security, privacy, and data-quality acceptance criteria have passed.
