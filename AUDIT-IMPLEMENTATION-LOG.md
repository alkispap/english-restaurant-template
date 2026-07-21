# Audit Implementation Log

**Purpose:** Durable record of remediation work, decisions, verification, and remaining items.
**Audit:** `CODEBASE-AUDIT-2026-07-15.md`
**Plan:** `AUDIT-REMEDIATION-PLAN.md`

## Tracking rules

Every implementation slice must record:

1. The audit finding and intended outcome.
2. Files changed and why.
3. Existing user changes that were preserved.
4. Tests added or updated.
5. Commands run and their results.
6. Browser/static-export evidence when relevant.
7. Any failure, including whether it is a product defect, regression, stale assertion, or environment issue.
8. Remaining work and the exact next checkpoint.

An item is only marked **Complete** after its acceptance criteria and verification gate pass. Code written without final verification remains **In progress**.

## Protected pre-existing user work

These changes existed before remediation began and were reviewed and committed separately as `3439ece`; they are not attributed to the audit implementation:

- `scripts/directory-landing.test.ts`
- `scripts/image-seo.test.ts`
- `src/lib/directory-landing.ts`
- `public/images/homepage/services/`

## Git checkpoints

**Branch:** `codex/audit-remediation`

| Commit | Scope |
| --- | --- |
| `d1bb341` | Phase 1 functional query fixes and regression coverage |
| `0575f50` | Phase 2A initial-payload reduction, generated count index, and enforced build budgets |
| `21c4ca4` | Audit documents and durable remediation tracking |
| `3439ece` | Reviewed pre-existing homepage service illustrations and tests |
| `67c654f` | Phase 2B packed browser search index and async-chunk budget |
| `805bcde` | Phase 2C packed compare index and route-specific payload budgets |
| `d09777e` | Phase 3A accessible primary colour and hover states |
| `1b47034` | Phase 3A verification record |
| `646f567` | Phase 3B modal focus management |
| `561120d` | Phase 3B verification record |
| `b673ae3` | Phase 3C form labels and live announcements |
| `10b1842` | Phase 3C verification record |
| `2f8e0ab` | Phase 3D async failures and shortlist synchronization |
| `8ab2389` | Phase 3D verification record |
| `f08a659` | Dead interface-module removal and hygiene regression |
| `3c5b3b7` | Phase 3E interactive control accessibility |
| `e04920c` | Phase 3E verification record |
| `2a1c9d8` | Phase 4A dependency updates and enforced advisory policy |
| `6cc0129` | Phase 4A verification and risk decision record |
| `bb245a8` | Phase 4B script-safe JSON-LD serialization |
| `db75c6e` | Phase 4B verification record |
| `661c891` | Phase 4C production security headers and CSP |
| `35f8ed8` | Phase 4C verification record |
| `8800080` | Phase 4D privacy/data-flow alignment and regression policy |
| `28244cd` | Phase 4D verification record |
| `dbc62ee` | Phase 4E guarded Cloudflare production release workflow |
| `2b15e68` | Phase 4E verification record |
| `de980fc` | Phase 5A listing operational-quality model and launch gate |
| `7fc514d` | Phase 5A measured baseline and verification record |
| `e27e4c6` | Phase 5B provenance-aware directory import pipeline |
| `39afe8c` | Phase 5B provenance workflow documentation |
| `0403451` | Phase 5C confirmed listing entity resolution |
| `b2f7a65` | Phase 5C duplicate-review evidence record |
| `c2d2119` | Phase 5D historical listing-provenance backfill |
| `d7da94b` | Phase 5D provenance evidence record |
| `9010aa6` | Phase 5E listing-media rights controls |
| `244918e` | Phase 5E media-policy evidence record |
| `b77d4ab` | Phase 5F listing verification/correction workflow |
| `92c1e5a` | Phase 5F verification workflow evidence record |
| `d36bad4` | Phase 5G deterministic verification priority queue |
| `093f7a3` | Phase 5G first evidence-backed priority batch |
| `b37aa49` | Phase 5H publication decision contract and tests |
| `0bf5162` | Phase 5H guarded publication workflow and audit |
| `eaf8a9d` | Phase 5H publication baseline and four held decisions |
| `deb66f2` | Phase 5H public-surface and SEO enforcement |
| `40f8135` | Phase 5H safe imports, data writers and entity retirement |
| `e14b300` | Phase 5H publication-aware readiness audits and queue |
| `6b8e720` | Phase 5H publication operating documentation |
| `5ee1f38` | Static-export generation timeout reliability guard |
| `381c7a5` | Phase 5H final verification and failure evidence |
| `a470c1a` | Phase 5H finalized checkpoint |
| `e3a90e7` | Phase 5 contact batch 01 evidence, decisions and synchronized public data |
| `ca6d9ae` | Phase 5 contact batch 01 measured checkpoint |
| `a272717` | Phase 5 contact batch 02 evidence, corrections and publication decisions |
| `807cb11` | Phase 5 contact batch 02 measured checkpoint |
| `24183c3` | Phase 5 published missing-contact cohort completion |
| `7552211` | Phase 5 published contact cohort measured checkpoint |
| `086aca8` | Phase 5 pending-listing Google Place ID evidence review |
| `d0b5d5a` | Phase 5 first published missing-hours batch evidence, scope decisions and synchronized data |

The audit documents are kept in their own checkpoint commit. Generated deployment folders such as `out/` and `.next/` are deliberately excluded from Git.

## Status summary

| Phase | Status | Current checkpoint |
| --- | --- | --- |
| 1. Query-driven listing journeys | Complete | All tests, builds, export checks, and desktop/mobile rendered-state checks passed |
| 2. Performance/export size | In progress | Local payload remediation complete; deployed-preview mobile performance remains an acceptance gate |
| 3. WCAG 2.2 AA accessibility | In progress | Confirmed code defects fixed; formal automated scan and assisted screen-reader pass remain preview gates |
| 4. Security/privacy/deployment | In progress | Local hardening and release preflight complete; user-approved publish and live verification remain |
| 5. Listing quality/operations | In progress | First published missing-hours batch complete; 3,150 published, 25 pending review, 11 excluded, 17 freshly editor-verified, and 96 published records still lack structured hours |
| 6. Reusable directory packs | Pending | Not started |

## Change log

### 2026-07-15 — Audit documentation and remediation plan

**Outcome:** Recorded the read-only audit and converted it into phased implementation work.

**Files added**

- `CODEBASE-AUDIT-2026-07-15.md`
- `AUDIT-REMEDIATION-PLAN.md`
- `AUDIT-IMPLEMENTATION-LOG.md`

**Status:** Complete.

### 2026-07-15 — Phase 1A: main directory query activation

**Finding:** `/restaurants/?q=...` and supported filter query parameters did not activate client results in a static export.

**Root cause:** `DirectoryListingsQueryEnhancer` was mounted only when the server-built model already contained query state. Static generation cannot see the browser query string, so the listener required to read that string was absent.

**Implementation**

- `src/components/DirectoryListingsPage.tsx`
  - Mounts the lightweight query enhancer for the directory route regardless of build-time query state.
  - Passes only `basePath`, `title`, and `description` across the client boundary instead of the full listing model.
- `src/components/DirectoryListingsQueryEnhancer.tsx`
  - Accepts the compact initial-page context.
  - Continues to lazy-load the large browser query modules only after a normalized browser query is detected.

**Regression coverage**

- `scripts/directory-query-enhancer-performance.test.ts`
  - Requires unconditional mounting for static query detection.
  - Rejects passing the full listing model to the client enhancer.
  - Retains lazy-loading and update-coalescing checks.
- `scripts/homepage-lcp-payload.test.ts`
  - Verifies the current homepage uses `DirectoryLandingPage` and does not mount directory query hydration.
  - Rejects full-model serialization through `DirectoryListingsPage`.

**Evidence so far**

- New regression failed against the old conditional implementation.
- Focused regression passes after the fix.
- Homepage payload regression passes after updating its stale architectural assumption.

**Status:** Complete; Phase 1 verification gate passed.

### 2026-07-15 — Phase 1B: SEO landing result replacement

**Finding:** Query-driven SEO landing pages displayed both server results and client-filtered results.

**Root cause:** The server region used a Tailwind `grid` display rule. Setting only the HTML `hidden` property was insufficient because the authored display utility overrode the user-agent hidden display rule.

**Implementation**

- `src/components/SeoLandingQueryEnhancer.tsx`
  - Retains the semantic `hidden` state.
  - Explicitly sets `display: none` while client results are active.
  - Restores the display state when the query is cleared or the enhancer unmounts.

**Regression coverage**

- `scripts/seo-landing-query-enhancer.test.ts`
  - Requires explicit hiding of the server grid.
  - Requires cleanup/restoration of the display state.

**Evidence so far**

- New regression failed against the old hidden-only implementation.
- Focused regression passes after the fix.

**Status:** Complete; Phase 1 verification gate passed.

## Verification ledger

| Check | Result | Notes |
| --- | --- | --- |
| Directory query focused regression | Passed | After first demonstrating failure against old behaviour |
| SEO landing query focused regression | Passed | After first demonstrating failure against old behaviour |
| Homepage payload focused regression | Passed | Updated to reflect the current static homepage architecture |
| ESLint | Passed | No lint errors |
| TypeScript type-check | Passed | No type errors |
| Full 132-test suite, first run | 131 passed / 1 failed | Failure was the old homepage assertion requiring `model.searchQuery`; implementation was refined to preserve its actual payload goal and the test was updated |
| Full 132-test suite, final rerun | Passed: 132/132 | Runtime 1m 54.84s |
| Production build | Passed | 26 standard-build routes; completed in 131.6s |
| Static export | Passed | 3,660 pages generated; completed in 619.1s |
| Cloudflare export check | Passed | 7,411 files; no asset over 25 MiB |
| Desktop `/restaurants/?q=Dishoom` | Passed | Server region hidden; client region active; input retained `Dishoom`; 9 results; no unfiltered 3,187 count |
| Desktop `/areas/harrow/?open=1` | Passed | Server grid had `hidden` and `display:none`; client heading reported 155 results; Open now state present |
| Mobile `/restaurants/?q=Dishoom` | Passed functionally | Same 9-result client state at 390×844 |
| Mobile `/areas/harrow/?open=1` | Passed functionally | Same server replacement and 155-result client state at 390×844 |
| Diff review | Passed | `git diff --check` clean; protected pre-existing homepage/service-image work remains present and untouched by remediation |

## Browser verification note

The in-app browser was attempted first, but its session dropped every localhost tab, including `/about`, while the local HTTP server continued returning valid 200 responses. The rendered checks therefore used the installed Microsoft Edge browser in headless mode against the exact `out` export.

This fallback produced hydrated DOM evidence and nominal 390×844 screenshots. It also appeared to show horizontal clipping on the mobile directory and SEO landing layouts. Phase 3A later proved that the Edge command-line window had retained a 492 CSS-pixel viewport while cropping the screenshot to 390 physical pixels; true 390 CSS-pixel device emulation has no page-level overflow. No responsive defect is attributed to those original screenshots.

**Mobile evidence**

- `C:\Users\user\.codex\visualizations\2026\07\15\019f6527-3423-7021-8797-fd41eeff1ad7\phase1-directory-mobile.png`
- `C:\Users\user\.codex\visualizations\2026\07\15\019f6527-3423-7021-8797-fd41eeff1ad7\phase1-seo-mobile.png`

## Phase 1 completion decision

Phase 1 is complete. Both launch-blocking query-rendering defects are fixed and verified against the real static export at desktop and mobile widths. No commit was created.

### 2026-07-15 — Phase 2A: remove the full listing dataset from initial client routes

**Finding:** `/restaurants` and SEO landing routes shipped approximately 1.31 MB first-load JavaScript. The largest initial raw chunk was 9,743,673 bytes.

**Root cause:** `ListingResultsRow` is a client component and imports `directoryRouteLink`. That helper imported `listing-filter-counts`, which calculated route thresholds by importing and scanning the complete `data/listings.json` dataset. Webpack therefore embedded full listing records in every directory/SEO landing route's initial client graph.

**Implementation**

- `data/listing-filter-counts.json`
  - New generated 8 KB route-count index containing only normalized facet counts.
- `src/lib/listing-filter-counts.ts`
  - Reads the compact generated index instead of importing full listings.
  - Preserves the existing map-based API and canonical-route decisions.
- `src/lib/directory-import.ts` and `scripts/import-directory.ts`
  - Generate and write the compact index during every directory import, including curated samples.
- `scripts/check-client-payload.ts`
  - Enforces a 650,000-byte total initial raw-JavaScript budget and a 250,000-byte per-initial-chunk budget across `/restaurants` and every SEO landing route family.
- `package.json`
  - Runs the payload audit automatically after normal and static production builds.

**Regression coverage**

- `scripts/listings-payload.test.ts`
  - Rejects reintroducing the full listing dataset into `listing-filter-counts`.
  - Requires a generated count index below 100 KB.
- `scripts/import-directory.test.ts`
  - Verifies normalized counts for areas, neighbourhoods, categories, types, dietary options, services, offerings, and exact price values.
- `scripts/cloudflare-publish.test.ts`
  - Verifies static publishing retains the automatic payload audit.

**Measured result**

| Route family | Before | After |
| --- | ---: | ---: |
| `/restaurants` first-load JS | 1.31 MB | 145 KB |
| SEO landing first-load JS | 1.31 MB | 143 KB |
| Largest initial raw route chunk | 9,743,673 bytes | 173,669 bytes |
| Total initial raw JS budget result | Over 10 MB on affected route graph | 452–459 KiB |

The reported `/restaurants` first-load payload fell by approximately 89%. The clean route no longer embeds any full listing record dataset.

**Verification**

- ESLint: passed.
- TypeScript: passed.
- Focused import, payload, URL-governance, and Cloudflare-publish tests: passed.
- Full suite: 132/132 passed in 2m 13.74s.
- Standard production build: passed; payload audit passed.
- Static export: 3,660 pages passed in 650.5s; payload audit passed automatically.
- Cloudflare export: 7,411 files passed; no asset exceeded 25 MiB.
- Hydrated `/restaurants/?q=Dishoom`: server hidden, 9 client results, and canonical category links retained.
- Hydrated `/areas/harrow/?open=1`: server hidden with `display:none`; time-dependent filtered result state replaced the 181-result server state.
- `git diff --check`: passed.

**Remaining Phase 2 work**

- The on-demand browser search chunk remains 6,873,540 raw bytes because `listing-search-records.json` is still a 6.84 MB all-directory index. It is lazy-loaded only after a query, so it no longer affects clean first load, but it should be split or fetched more efficiently.
- The static export still contains 3,660 pages and takes roughly 10–11 minutes. Output duplication/size needs separate measurement and optimization.
- The `/compare` route remains 364 KB first-load JavaScript and should receive its own payload trace.

**Status:** Phase 2A complete; Phase 2 remains in progress.

### 2026-07-15 — Phase 2B: reduce and budget query-activated search data

**Finding:** Activating a supported directory or SEO-landing query lazy-loaded a 6,873,540-byte raw JavaScript chunk. The chunk embedded the 6,842,190-byte verbose `listing-search-records.json` array.

**Root cause:** The client search records were already smaller than full listings, but they repeated long property names and common filter strings across all 3,187 records. Because the JSON was imported by the lazy browser module, that representation became JavaScript source and parse work.

**Implementation**

- `data/listing-search-index.json`
  - New generated versioned index using fixed record positions plus a dictionary for repeated strings.
  - Preserves unique strings directly and uses one-based dictionary tokens so zero remains an unambiguous optional-string sentinel.
- `src/lib/listing-search-index.ts`
  - Deterministically packs records during import and validates/decodes the generated format for search.
  - Retains every existing search, filter, card, map, opening-hours, contact, and detail field.
- `src/data/listing-search-records.ts`
  - Loads and decodes the packed index instead of bundling the verbose search-record JSON.
- `src/lib/directory-import.ts` and `scripts/import-directory.ts`
  - Generate the packed index for normal and curated-sample imports so it cannot drift from source data.
- `scripts/check-client-payload.ts`
  - Adds a 3,000,000-byte ceiling for every initial or async client chunk.

**Regression coverage**

- Import tests require the packed format to round-trip a field-complete record without loss.
- Storage tests decode all 3,187 records and compare them to the verbose canonical search records.
- Payload tests require the generated index to remain below 3 MB and less than half the verbose representation.
- Source-hygiene tests require the generated packed asset to exist.

**Measured result**

| Artifact | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Browser search data, raw | 6,842,190 bytes | 2,556,838 bytes | 62.6% |
| Largest compiled client chunk, raw | 6,873,540 bytes | 2,583,546 bytes | 62.4% |
| Current compiled search chunk, gzip | — | 570,613 bytes | — |
| Current compiled search chunk, Brotli | — | 409,887 bytes | — |

The clean `/restaurants` route remains 145 KB first-load JavaScript and SEO landing routes remain 143 KB. The query chunk is absent from initial route assets.

**Verification**

- Focused import, storage, payload, source-hygiene, search, filter, query-enhancer, and SEO-query tests: passed.
- ESLint: passed.
- TypeScript: passed.
- Full suite: 132/132 passed in 2m 11.62s.
- Standard production build: passed in 138.6s; initial and async payload budgets passed.
- Static export: 3,660 pages passed in 640.2s; payload budgets passed automatically.
- Cloudflare export guard correctly rejected a missing production URL; with `NEXT_PUBLIC_SITE_URL=https://indianrestaurantlondon.co.uk`, validation passed for 7,411 files with no asset over 25 MiB.
- Hydrated `/restaurants/?q=Dishoom`: server region hidden, query retained, and 9 client results rendered.
- Hydrated `/areas/harrow/?open=1`: client results rendered; server region had `hidden` and `display:none`.
- Desktop and 390 px mobile screenshots confirmed the query result state. The previously recorded mobile horizontal clipping remains and is not attributed to this payload-only change.
- `git diff --check`: passed.

**Status:** Phase 2B complete; Phase 2 remains in progress.

### 2026-07-15 — Phase 2C: measure static output and reduce `/compare` payload

**Static-output finding:** The fresh export contains 7,411 files totalling 1,097,900,917 bytes. Restaurant detail routes account for 906,179,647 bytes (82.5%). HTML is 737,834,278 bytes and RSC text is 350,512,160 bytes, together accounting for 99.1% of the export.

The 4,841 files at or above 100 KB had no exact duplicate hash groups. The size is therefore dominated by the unique HTML/RSC representation of 3,187 rich listing pages, not by safely removable duplicate files. Removing RSC files would risk breaking Next client navigation, and reducing generated detail routes would change the directory's indexation strategy; neither was treated as a safe mechanical optimization.

**Compare finding:** `/compare` shipped a 2,281,416-byte raw route chunk because it embedded the 2,269,647-byte verbose shortlist-summary array in initial JavaScript.

**Implementation**

- `data/shortlist-index.json`
  - New generated tuple/dictionary index for all compare fields.
  - Omits derivable listing href strings and reconstructs them from the configured route helper.
- `src/lib/shortlist-index.ts`
  - Packs and validates shortlist summaries while preserving optional URLs and the distinction between missing and present opening-hours data.
- `src/data/shortlist-summaries.ts`
  - Decodes the packed index instead of importing verbose summary objects.
- `src/lib/directory-import.ts` and `scripts/import-directory.ts`
  - Generate the shortlist index on normal and curated imports.
- `scripts/check-client-payload.ts`
  - Adds `/compare` to automatic build enforcement with a 1,300,000-byte total raw-JavaScript budget and a 900,000-byte largest-chunk budget.

**Regression coverage and corrective iteration**

- The first full parity check failed because summaries without `workingHours` decoded to an empty array. This was a real representation mismatch.
- The packed format was corrected to retain an explicit missing-value sentinel, regenerated, and rerun through field-complete import parity plus all 3,187 production summaries.
- Compare payload tests require the packed index and enforce a 900 KB raw-data ceiling.
- Storage and source-hygiene checks require the generated file and lossless decode.

**Measured result**

| Artifact | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Shortlist summary data, raw | 2,269,647 bytes | 625,450 bytes | 72.4% |
| `/compare` route chunk, raw | 2,281,416 bytes | 633,631 bytes | 72.2% |
| Next reported `/compare` first-load JS | 364 KB | 302 KB | 17.0% |
| `/compare` total initial raw JS | Unbudgeted | 990.0 KiB | Enforced below 1.3 MB |

**Verification**

- Focused compare, import, storage, source-hygiene, lint, and TypeScript checks: passed after the corrective iteration.
- Full suite: 132/132 passed in 2m 12.03s.
- Standard production build: passed in 141.3s; `/compare` and all existing payload budgets passed.
- Static export: 3,660 pages passed in 608.3s; payload budgets passed automatically.
- Cloudflare export: 7,411 files passed; no asset exceeded 25 MiB.
- Hydrated populated `/compare`: three saved Dishoom listings resolved with no missing records; rating, reviews, price, area, open status, cuisines, dietary, services, parking, notes, and external links rendered.
- Desktop and nominal 390 px mobile screenshots confirmed the populated comparison table. The table intentionally scrolls horizontally; Phase 3A later confirmed the apparent page-level clipping was caused by the screenshot tool retaining a wider CSS viewport.
- `git diff --check`: passed.

**Status:** Phase 2C complete. Local payload work is complete; Phase 2 remains open only for lab/field measurement on a deployed preview and any resulting targeted work.

### 2026-07-15 — Phase 3A: verify mobile overflow and correct primary contrast

**Responsive diagnosis:** The earlier mobile screenshots appeared horizontally clipped, but the browser was not using the requested CSS viewport. With `--window-size=390,844`, Edge reported `innerWidth=492`, `clientWidth=477`, and `documentScrollWidth=477`; the 390-pixel image was a crop of that wider layout.

DevTools device metrics were then forced to a true 390 CSS-pixel mobile viewport. The hydrated query page reported:

- `innerWidth=390`
- `clientWidth=390`
- `documentScrollWidth=390`
- body width and right edge both 390

**Decision:** The page-level horizontal-overflow follow-up was a tooling false positive. No layout change or regression test was added for a defect that does not exist. Horizontally scrollable carousels and comparison tables remain intentionally contained.

**Confirmed contrast finding:** The primary `#f97316` token measured 2.80:1 against white and 2.70:1 against the paper background. The reciprocal foreground/background usage affected primary text, icons, borders, focus rings, and white-text buttons—not only the originally sampled actions.

**Implementation**

- `src/app/globals.css`
  - Changes the primary token to standard orange-700 `#c2410c`.
  - The new token measures 5.18:1 against white and 4.99:1 against the paper background.
- `src/components/SearchBar.tsx`, `SearchBarClient.tsx`, and `DirectoryLandingPage.tsx`
  - Replace the lighter `hover:bg-orange-600` state with orange-800 `#9a3412`, which measures 7.31:1 against white.
- `scripts/accessibility-static.test.ts`
  - Reads the real CSS token and enforces primary-on-white, primary-on-paper, white-on-primary, and white-on-hover contrast.
  - Prevents the three primary actions from regressing to the failing lighter hover state.

**Verification**

- Focused accessibility, homepage-theme, directory-landing, and search tests: passed.
- ESLint and TypeScript: passed.
- Full suite: 132/132 passed in 2m 35.47s.
- Standard production build: passed in 130.1s; all initial, async-search, and compare payload budgets passed.
- Generated browser CSS exposed `--color-primary: #c2410c`.
- True 390 CSS-pixel mobile and 1440 px desktop homepage screenshots showed the darker action colour without layout regression.
- `git diff --check`: passed.

**Status:** Phase 3A complete; Phase 3 remains in progress.

### 2026-07-15 - Phase 3B: make filter dialogs keyboard-safe

**Confirmed finding:** Both modal filter interfaces exposed `role="dialog"`, `aria-modal`, and accessible names, but neither implemented complete focus management. The filter-choice dialog lacked initial focus, Tab containment, Escape handling, background isolation, scroll locking, and focus restoration. The mobile filter screen handled Escape and scroll locking but still allowed focus and assistive-technology navigation to reach the page behind it and did not restore focus.

**Implementation**

- `src/lib/use-modal-dialog.ts`
  - Adds one shared modal behavior for initial focus, forward and reverse Tab containment, Escape, body scroll locking, inert/`aria-hidden` background isolation, and exact focus restoration.
  - Preserves prior body and background states during cleanup.
  - Detects the topmost active dialog so the filter-choice dialog can safely open inside the mobile filter screen without one Escape key closing both layers.
- `src/components/FilterCheckboxGroup.tsx`
  - Focuses the search field when the choice dialog opens and restores focus to the exact `Show more` trigger when it closes.
  - Adds a programmatic dialog focus fallback.
- `src/components/ResponsiveDirectoryFilters.tsx`
  - Moves the full-screen mobile dialog to a page-level portal so the rest of the page can be isolated safely.
  - Focuses the close control on open and restores focus to the `Filters` trigger on close.
  - Replaces duplicated Escape and scroll-lock effects with the shared modal behavior.

**Regression coverage**

- `scripts/dialog-focus-management.test.ts`
  - Requires all dialog focus, keyboard, scroll-lock, background-isolation, nested-layer, portal, and restoration contracts.
- `scripts/responsive-directory-filters.test.ts`
  - Requires the mobile screen to use the shared behavior, page-level portal, initial-focus control, and restoration trigger.

**Verification**

- Focused dialog tests: passed.
- ESLint and TypeScript: passed.
- Full suite: 133/133 passed in 1m 47.69s.
- Standard production build: passed in 98s; all route, async-search, and compare payload budgets passed.
- Built `/restaurants` tested at a true 390 x 844 viewport:
  - Opening mobile filters focused `Close filters`, locked body scroll, and made page siblings inert and hidden from assistive technology.
  - Shift+Tab from the first control wrapped to `Show results`; Tab from the last control wrapped to `Close filters`.
  - Opening the nested `Show more` dialog focused its search field and isolated the outer modal.
  - The first Escape closed only the nested dialog and restored its exact `Show more` trigger; the second closed mobile filters and restored `Filters`.
  - Cleanup removed all temporary inert, `aria-hidden`, and overflow states.
  - Browser console warnings/errors: none.
- `git diff --check`: passed.

**Status:** Phase 3B complete; Phase 3 remains in progress.

### 2026-07-15 - Phase 3C: label forms and announce dynamic updates

**Confirmed findings:** The global header search, private-note textarea, and listing-comment textarea relied on placeholders or surrounding context instead of persistent programmatic labels. Note, comment, magic-link, geolocation, filter-choice, and area-filter updates were visible but did not have reliable live-region announcements. Repeated comment-removal buttons also shared the same accessible name.

The main directory search, native sidebar selects, checkbox groups, open-now control, and sort selector already had valid label associations and were left unchanged. `SearchableSelect.tsx` is not imported anywhere; its custom non-keyboard listbox pattern is tracked as dead/inaccessible code for a separate maintainability cleanup rather than reported as a live user defect.

**Implementation**

- `HeaderSearch.tsx`
  - Gives the search input a configured, persistent accessible name independent of its placeholder.
- `ListingPrivateNote.tsx` and `ListingComments.tsx`
  - Add stable textarea labels and connect the controls to their character counts and supporting text.
  - Add persistent polite status regions for note save/clear and comment post/remove outcomes.
  - Give each comment removal control a contextual accessible name containing its timestamp.
- `AccountMenu.tsx`
  - Adds native email validation, email autocomplete metadata, a described status relationship, and a persistent sign-in result announcement.
- `LocateAreaButton.tsx` and `SearchBarClient.tsx`
  - Announce location lookup progress and all failure outcomes without removing the visible fallback guidance.
- `SearchableCardGrid.tsx`
  - Exposes the alphabet controls as a named group and announces the filtered result count.
- `FilterCheckboxGroup.tsx`
  - Announces the count of choices matching the modal search.

**Regression coverage**

- `scripts/form-accessibility.test.ts`
  - Enforces labels, described-by relationships, validation/autocomplete metadata, named grouped controls, contextual removal labels, and persistent polite status regions across the affected components.

**Verification**

- Focused form, static accessibility, and header-search tests: passed.
- ESLint and TypeScript: passed.
- Full suite: 134/134 passed in 1m 56.62s.
- Standard production build: passed in 92.6s; all client-payload budgets passed.
- Built `/areas` browser journey:
  - Header search exposed `Search restaurants` and the area input exposed `Search areas`.
  - Filtering to no matches exposed `0 results` in the status region and retained the visible empty state.
- Built restaurant-detail browser journey:
  - Comment textarea exposed `Comment`.
  - Posting exposed `Comment posted.` and rendered the browser-local comment.
  - Removal exposed a timestamp-specific accessible name, then announced `Comment removed.` and restored the empty state.
  - The temporary verification comment was removed before browser cleanup.
  - Browser console warnings/errors: none.
- `git diff --check`: passed.

**Status:** Phase 3C complete; Phase 3 remains in progress.

### 2026-07-15 - Phase 3D: surface async failures and prevent stale shortlist sync

**Confirmed functional findings**

- Supabase authentication and private-note calls ignored returned error objects. Email sign-in and note saving could therefore show success after the backend rejected the operation.
- Saved-listing writes dispatched a same-tab change event before the remote update completed. The save button, header count, and compare page responded by immediately fetching stale remote state; a signed-in removal could be merged back into the shortlist.
- Directory and SEO-landing query enhancers did not expose loading state or catch lazy-module failures. The URL could change while old results remained with no recovery message.
- Map initialization failures left `Loading map...` indefinitely. The generated map-popup action also retained the old `#e67e22` background, which fails white-text contrast.
- Compare, save/remove, account, and private-note async actions did not consistently expose busy or failure states.

**Implementation**

- `AccountProvider.tsx`
  - Checks authentication, saved-listing, and private-note response errors and rejects failed operations instead of returning false success.
  - Always releases account initialization from its loading state after session failures.
  - Removes the redundant same-tab shortlist event; the external account store now handles same-tab state and its existing storage listener handles cross-tab updates.
- `AccountMenu.tsx`, `ListingPrivateNote.tsx`, and `SaveListingButton.tsx`
  - Add disabled/`aria-busy` action states, safe user-facing failure messages, and polite/assertive outcome announcements.
  - Distinguish successful browser persistence from failed signed-in account synchronization.
- `SavedListingsLink.tsx` and `CompareSavedListings.tsx`
  - Consume the shared account snapshot directly instead of starting redundant remote refreshes on same-tab writes.
  - Compare now announces loading, note/sync failures, removal progress, and removal outcomes.
- `DirectoryListingsQueryEnhancer.tsx` and `SeoLandingQueryEnhancer.tsx`
  - Mark active result regions busy, announce configured listing counts after updates, catch lazy-module failures, reset rejected module promises, and show reload guidance.
- `ListingMap.tsx`
  - Catches initialization failures, replaces loading with a visible alert, marks map busy state, announces the no-coordinate state, and changes the popup action to accessible primary `#c2410c`.

**Regression coverage**

- `scripts/async-state-accessibility.test.ts`
  - Requires backend error propagation, safe account and note failures, busy states, live announcements, query-module recovery, map failure replacement, accessible popup contrast, and removal of the stale same-tab event path.

**Verification**

- Focused async-state, shortlist, account-boundary, compare-payload, query-enhancer, and source-hygiene tests: passed.
- ESLint and TypeScript: passed.
- Full suite after the final stale-sync correction: 135/135 passed in 1m 50.97s.
- Standard production build after the final correction: passed in 85.7s; all route, search-chunk, and compare payload budgets passed.
- Built directory/map journey:
  - Switching to map announced `3,187 restaurants updated.`
  - Client results and map completed at `aria-busy=false`; map loading cleared and no map alert remained.
- Built detail-page shortlist journey after removing the custom event:
  - Saving updated the button, status announcement, and header count from 0 to 1 through the shared store.
  - Removing updated all three back to the unsaved/0 state.
  - The test shortlist item was removed before browser cleanup.
- Browser console warnings/errors: none.
- Auth failure branches are protected by static regression and type checks; live Supabase failure injection was not available because auth is disabled in the current local configuration.
- `git diff --check`: passed.

**Status:** Phase 3D complete; Phase 3 remains in progress.

### 2026-07-15 - Phase 3E: remove dead interface code and harden interactive controls

**Maintainability finding:** Six client-interface modules had no importer, dynamic reference, or live route. They included the inaccessible custom `SearchableSelect` pattern and 551 lines of obsolete alternative search/filter UI that could mislead future template work.

**Confirmed accessibility and reliability findings**

- Mobile navigation, account, and share popovers did not share complete initial-focus, Escape, outside-click, and focus-restoration behavior.
- The mobile detail sticky header was translated off-screen but its Save/Share controls remained exposed to keyboard and assistive technology. After scrolling, its original action set could likewise duplicate the sticky tab stops.
- Listing image carousels had named previous/next buttons but no carousel semantics or live position announcement.
- Restaurant-section navigation and the interactive map lacked explicit programmatic names; desktop section links did not expose the current location.
- Share-copy failure only wrote to the console and gave the user no recovery message.

**Implementation**

- Removed the unused `CategoryPills`, `DirectoryListingsQueryController`, `HomepageSeoLinks`, `OpenNowToggle`, `SearchableSelect`, and `SearchBarClient` modules after repository-wide reference checks.
- Added `src/lib/use-dismissible-popover.ts` and applied it to mobile navigation, account options, and share options for focus entry, Escape dismissal/restoration, and outside-click dismissal.
- Made the sticky and original mobile detail action sets mutually `inert`/`aria-hidden` according to scroll state, while preserving the sticky transition.
- Added carousel group/roledescription semantics and polite atomic position status regions to both card variants.
- Named mobile/desktop restaurant-section navigation and map regions; desktop navigation now exposes `aria-current="location"`.
- Added an accessible share-copy error state with address-bar recovery guidance. Recoverable native-share rejection now opens the fallback without generating a console error.

**Regression coverage**

- `scripts/dead-code-hygiene.test.ts` prevents the six deleted modules from returning.
- `scripts/interactive-controls-accessibility.test.ts` enforces popover, carousel, sticky-action, navigation, map, and share-failure contracts.
- `scripts/listing-detail-mobile-layout.test.ts` now rejects off-screen or duplicated sticky action tab stops.
- Existing tests that referenced obsolete modules were retargeted to current live components.

**Verification**

- Repository reference scan: the six removed modules had no live references.
- Focused dead-code, interactive-control, mobile-detail, and header-menu tests: passed.
- ESLint and TypeScript: passed.
- Full suite after final share recovery change: 137/137 passed in 2m 4.71s.
- Final standard production build: passed in 95.6s; all initial, async-search, and compare payload budgets passed.
- True 390 x 844 production-browser journeys:
  - Mobile navigation focused search on open, closed on Escape/outside click, and restored the trigger after Escape.
  - Share fallback focused its close control, closed on Escape, restored the exact Share trigger, and produced zero console errors in a clean tab.
  - At scroll position 0 the fixed actions were inert/hidden and original actions active; after scrolling 300 px those states reversed.
  - `Royal Nawaab images` advanced from `1 / 3` to `2 / 3` in a polite atomic status region.
  - Map view completed with `aria-busy=false`, label `Map showing 3187 restaurants`, named Zoom in/out controls, no alert, and no mobile overflow.
- Auth is disabled in the local configuration, so account-popover live interaction remains protected by shared-hook/static regression rather than a signed-in browser journey.
- Ad network loading is disabled; current placeholders are labeled. Injected iframe titles and network behavior must be rechecked when an ad provider is enabled.
- `git diff --check`: passed.

**Status:** Dead-code cleanup and Phase 3E are complete. Phase 3 remains open only for a formal automated accessibility scan and assisted screen-reader pass on a deployable preview.

### 2026-07-15 - Phase 4A: triage and enforce dependency security risk

**Finding:** The current lockfile initially reported five advisories: one low and four moderate. There were no high or critical findings. Three findings were development-only dependency paths; the two production entries were the same PostCSS advisory represented once for `postcss` and once for direct parent `next`.

**Reachability and decisions**

- `brace-expansion@5.0.5` was reachable only through the TypeScript ESLint parser and its numeric-range denial-of-service behavior was not part of the production application.
- `js-yaml@4.1.1` was reachable only through ESLint configuration parsing and was not used for site/user content.
- `esbuild@0.27.7` was reachable through `tsx`; its arbitrary-file-read advisory applied to a Windows development server and was relevant to this Windows workspace even though it was not deployable production code.
- Next 15.5.18 pinned `postcss@8.4.31`. Registry inspection confirmed Next 15.5.20 and current Next 16.2.10 still pin the same PostCSS version. `npm audit fix --force` proposed downgrading Next to 9.3.3, which was rejected as unsafe.
- The remaining PostCSS stringify advisory requires attacker-controlled CSS containing a closing style tag. This application processes only trusted authored CSS during its build and does not accept, parse, or stringify user CSS at runtime. The moderate finding is therefore accepted as build-time unreachable until Next updates its pinned dependency.

**Implementation**

- Updated the lockfile to Next 15.5.20, `brace-expansion@5.0.7`, and `js-yaml@4.3.0` through non-breaking audit remediation.
- Updated `tsx` from `^4.21.0` to `^4.23.1`, moving esbuild from 0.27.7 to patched 0.28.1.
- Added `scripts/check-dependency-security.ts` and `npm run audit:dependencies`.
  - Fails on every high/critical advisory.
  - Fails on any low/moderate advisory that is not the exact reviewed Next/PostCSS chain.
  - Allows a future clean audit and explicitly warns against the unsafe force/downgrade path.
- Added `scripts/dependency-security-policy.test.ts` to protect the severity, advisory-identity, package-chain, and Windows-launch contracts without requiring network access in the full test suite.

**Measured result**

| Scope | Before | After |
| --- | --- | --- |
| Production audit | 0 high/critical, 2 moderate | 0 high/critical, 2 linked reviewed moderates |
| Full dependency audit | 1 low, 4 moderate, 5 total | 0 low, 2 moderate, 2 total |
| Unreviewed advisories | 3 development findings | 0 |

**Verification**

- `npm run audit:dependencies`: passed with exactly the reviewed Next/PostCSS chain and no high/critical finding.
- `npm ci`: passed from the new lockfile in 164.4s; 376 packages installed reproducibly.
- ESLint and TypeScript: passed.
- Full fresh-tree suite: 138/138 passed in 2m 0.88s.
- Production build on Next 15.5.20: passed in 111.4s; all route, search-chunk, and compare payload budgets passed.
- `git diff --check`: passed.

**Status:** Phase 4A complete. The remaining moderate advisory has an explicit, constrained reachability decision and is guarded against accidental expansion.

### 2026-07-15 - Phase 4B: prevent JSON-LD script termination

**Confirmed finding:** Seven live JSON-LD emissions across the homepage, restaurant detail, guide/FAQ, and SEO landing renderers inserted raw `JSON.stringify` output through `dangerouslySetInnerHTML`. Imported content containing `</script>` could terminate the structured-data element and inject markup.

**Implementation**

- Added `serializeJsonLd` to serialize once and escape `<`, `>`, `&`, U+2028, and U+2029 as JSON Unicode escapes; unserializable values fail explicitly.
- Added one `JsonLd` server component as the sole owner of `application/ld+json` and `dangerouslySetInnerHTML`.
- Migrated all seven schema emissions in four live renderers to the shared component without changing schema objects.
- Added a repository-wide emitter scan and hostile payload containing closing/opening script tags, HTML-significant characters, and JavaScript line separators.

**Verification**

- Hostile serialization contained no literal closing-script sequence or HTML-significant/separator character and parsed back to the exact original object.
- Focused JSON-LD security, structured-data, homepage, article, TypeScript, and ESLint checks: passed.
- Full suite: 139/139 passed in 1m 46.55s.
- Production build: passed in 91.7s; all payload budgets passed.
- Built homepage HTML contained exactly two valid parseable schemas (`Organization`, `WebSite`) and no embedded closing-script sequence.
- `git diff --check`: passed.

**Status:** Phase 4B complete. JSON-LD script emission is centralized and hostile imported strings cannot terminate its script element.

### 2026-07-15 - Phase 4C: enforce production security headers

**Confirmed finding:** The Cloudflare deployment defined cache rules but no CSP or browser security headers. The normal Next server likewise returned no application-defined security policy.

**Compatibility decision:** Static Next output requires inline framework bootstrap scripts and authored/React inline styles, so this export architecture cannot use nonce-only CSP. The policy permits `'unsafe-inline'` for scripts/styles but does not permit `unsafe-eval` or external scripts. HTTPS directory images, same-origin resources/geolocation, blob workers, and optional Supabase HTTPS/WebSocket connections remain supported. Ad network scripts remain blocked while ads are disabled.

**Implementation**

- Added one shared security policy with CSP, strict referrer handling, MIME-sniff protection, frame denial, restricted browser permissions, and one-year HSTS.
- Normal Next responses use the shared policy through `headers()`; static export deliberately omits that unsupported runtime hook.
- Cloudflare `public/_headers` mirrors the policy for every path while preserving existing asset/SEO cache rules.
- Cloudflare artifact validation now checks every shared header/value, and static tests prevent drift or accidental external-script/eval permissions.

**Verification**

- Focused security-header and Cloudflare publishing tests, TypeScript, ESLint, and diff checks: passed.
- Full suite: 140/140 passed in 1m 41.62s.
- Normal production build: passed in 87.7s; all payload budgets passed.
- Live normal server returned all six intended headers exactly.
- True 390 x 844 CSP browser journey: directory map hydrated, reached `aria-busy=false`, loaded six map tiles, retained named Zoom controls, had no page overflow, and produced no browser error or warning.
- Static export: all 3,660 pages generated in 539.2s without an unsupported-header warning; payload budgets passed.
- Cloudflare artifact check: 7,411 files passed, `_headers` contained every policy value, and no asset exceeded 25 MiB.

**Status:** Phase 4C complete. Both deployment modes enforce the same tested browser security baseline.

### 2026-07-15 - Phase 4D: align privacy disclosures with active data flows

**Confirmed finding:** The privacy page used conditional “may use” language that did not distinguish active behavior from future integrations. Current analytics events remain inside the page, ads and Supabase are disabled, contact/update pages do not submit data, browser comments are local, and near-you coordinates are processed locally only after permission.

**Implementation**

- Replaced vague disclosure with explicit sections for current analytics, local saved listings/comments, on-demand location, disabled account sync, non-submitting contact/update pages, external links, and disabled advertising.
- Clarified that browser comments are private/not published, location is not stored or sent to the directory, and ads/account sync require policy/provider/consent review before activation.
- Added a data-flow regression that rejects cookie-setting APIs and external analytics transmission while no consent mechanism exists, and ties disabled ads/forms to the published disclosure.

**Verification**

- Focused privacy-flow, trust-page, ad, heading, TypeScript, ESLint, and diff checks: passed.
- First full suite: 140/141; only the intentional privacy-heading snapshot was stale.
- Updated the exact heading contract; final full suite passed 141/141 in 1m 47.87s.
- Production build passed in 106.3s; all payload budgets passed.

**Status:** Phase 4D complete. Current visitor data behavior and the published privacy policy now agree, with regressions guarding silent activation.

### 2026-07-15 - Phase 4E: guard the commit-to-Cloudflare production handoff

**Confirmed deployment findings**

- `publish:cloudflare` deployed as soon as `CLOUDFLARE_PROJECT_NAME` existed; it did not require an explicit confirmation of the exact production target.
- The publisher did not reject uncommitted source before or after generation, so it could deploy an unreviewed change or a generator-modified tracked file.
- Windows command execution used `shell: true` while passing an environment-derived project name.
- The upload checklist recommended bypassing the publisher with a raw Wrangler command and preserved a stale dated artifact count. Because `out/` is ignored, a clean worktree alone cannot prove that a direct-upload artifact is current.
- The raw `npx wrangler` path could download tooling during a production operation.

**Implementation**

- The publisher now requires `--confirm-project` to exactly match the validated `CLOUDFLARE_PROJECT_NAME`.
- It checks the full tracked/untracked Git status before release checks and again after the static export.
- It reports the source branch/commit, target project, explicit production branch, and existing Wrangler version before work begins.
- npm, npx, and Wrangler arguments use direct process spawning with `shell: false`; Wrangler is invoked through `npx --no-install`.
- The deploy step explicitly supplies `--branch`, using `CLOUDFLARE_PRODUCTION_BRANCH` or the documented `main` default.
- Replaced stale/direct-upload guidance with one authoritative commit, prepare, guarded publish, and live-verification checklist. The change rules now point to that workflow and prohibit raw deployment of ignored output.

**Verification**

- Exact-target mismatch: refused with exit code 1 before build or deployment.
- Exact confirmation with a dirty worktree: refused with exit code 1 before build or deployment.
- TypeScript and focused Cloudflare publishing policy test: passed.
- ESLint: passed.
- Full suite: 141/141 passed in 2m 2.39s.
- Fresh `npm run prepare:cloudflare`: all 3,660 routes exported; client payload budgets passed.
- Cloudflare artifact validation: 7,411 files passed, no file exceeded 25 MiB, and required production URLs, headers, and redirects were present.
- No Cloudflare publish, push, or live-site mutation was performed.
- `git diff --check`: passed.

**Status:** Phase 4E local implementation is complete. Phase 4 remains open only for an explicitly authorized production publish and post-release live verification.

### 2026-07-15 - Phase 5A: establish listing-quality baseline and launch gates

**Dataset and grain:** The canonical `data/listings.json` contains 3,187 records at an intended grain of one physical restaurant location. The import report records 3,188 source rows, one merged duplicate, and 3,187 imported listings.

**Confirmed findings**

- No critical identity, place-ID, coordinate, rating/review, or public-URL integrity defect was found.
- All 3,187 records lack structured per-record provenance.
- 3,163 records (99.25%) lack a usable image.
- Four records form two normalized name-and-postcode near-duplicate groups and require manual review.
- 492 records lack categories, 129 lack opening hours, 68 lack a complete rating/review pair, and 31 lack a useful contact or map action.

**Implementation**

- Added an explicit provenance model containing source identity, import/verification dates, and verification status without mutating current records or inventing unavailable evidence.
- Added a deterministic operational-quality report with critical/high/medium/low severity, affected counts/rates, samples, impact, remediation, coverage metrics, and a launch verdict.
- Added `npm run audit:listings`; it exits non-zero whenever critical or high findings exist.
- Added tests for clean data plus duplicate identity, possible entity duplication, invalid rating pairs, missing provenance/images/categories/contact actions, report rendering, and launch verdict behavior.
- Added a durable technical baseline report at `docs/listing-quality-baseline-2026-07-15.md`.

**Verification**

- TypeScript and focused ESLint: passed.
- Focused listing operational-quality test: passed.
- Full suite: 142/142 passed in 2m 8.51s.
- Full ESLint: passed.
- Current `npm run audit:listings`: intentionally exits 1 with 0 critical, 3 high, and 4 medium issue classes; this is the correct not-ready launch verdict.
- The analytical MCP report validator was attempted but rejected the local JSON/TypeScript source because its chart/table contract requires SQL provenance. The findings were preserved in Markdown rather than fabricating SQL.
- Current listing records were not edited, merged, enriched, or deleted.
- `git diff --check`: passed.

**Status:** Phase 5A is complete. The audit framework is enforceable and the dataset's launch blockers are quantified; Phase 5 remains in progress for provenance, duplicate resolution, images, and record remediation.

### 2026-07-15 - Phase 5B: capture truthful provenance during directory imports

**Confirmed pipeline gap:** The importer retained a Google place ID for deduplication but discarded dataset identity and import time when generating canonical listings. Re-running an import would also regenerate `src/data/listings.ts` without the new provenance type. There was no safe distinction between imported/unverified data and a later verified record.

**Implementation**

- Every newly imported listing now receives a required provenance object with source name, source ID, optional public source URL, normalized import timestamp, and forced `unverified` status.
- Source name defaults to the CSV filename and import time defaults to the actual command time.
- Upstream deduplication IDs are used as source IDs; generic rows without an ID receive a transparent `source-name#row=N` locator.
- Optional `--source-name=`, `--source-url=`, and `--imported-at=` CLI inputs are validated and exposed in the import report.
- Local/file URL provenance and invalid timestamps fail before output generation.
- No import option can claim source/editor verification. Those statuses require a separate verified workflow and a valid `lastVerifiedAt` value.
- Updated the generated listing TypeScript template so future imports preserve the provenance model.
- Tightened the Phase 5A quality gate to require a source ID, valid import date, valid optional source URL, and a valid last-verified date for any verified status.
- Added `docs/directory-import-provenance.md` with the safe dry-run and import contract.

**Verification**

- TypeScript, focused ESLint, importer tests, and listing-quality tests: passed.
- Full source CSV dry run: 3,188 rows produced 3,187 listings, merged one duplicate, wrote no files, and reported the selected source, normalized timestamp, and `unverified` status.
- Operational audit of that preview import: provenance coverage 3,187/3,187 (100%). The remaining not-ready findings were images and the two candidate duplicate-location groups; no provenance finding remained.
- Full suite: 142/142 passed in 2m 5.51s.
- Full ESLint: passed.
- The current canonical dataset was deliberately not re-imported or backfilled because historical source/provider and import/verification evidence must not be guessed.
- `git diff --check`: passed.

**Status:** Phase 5B import-pipeline implementation is complete. Current-data provenance remains a deliberate open backfill decision, and no record is falsely marked verified.

### 2026-07-15 - Phase 5C: resolve confirmed listing entities without guessing

**Confirmed findings**

- `yummy-dosa-catering` was not a separate restaurant location after the existing local correction: it shared Yummy Dosa's name, 68 Cranbrook Road address, postcode, main phone, and official website. The official site presents catering/live dosa as a service of that restaurant.
- The importer used stable place IDs for listing fields and provenance but generic CSV role inference did not use them for deduplication. The Yummy alias could therefore return on a future import.
- The existing Monty's Nepalese Cuisine merge also relied on normalized name/address matching even though its two source rows have different historical/current place IDs.
- The Wimbledon pair shares a phone, postcode, adjacent address numbers, and operational lineage, but first-party sources conflict over its current name, 26/28 Ridgway address, and primary domain. A canonical merge would currently require guessing.

**Implementation**

- Added a reviewed entity-resolution registry for confirmed source-ID aliases.
- Generic imports now classify stable source-ID columns for deduplication while retaining the original source ID in provenance.
- Made the Monty's merge explicit and added the confirmed Yummy Dosa alias.
- Added a dry-run-by-default entity migration that validates canonical/alias source IDs and updates the canonical JSON plus all derived indexes only with `--write`.
- Consolidated Yummy Dosa from 3,187 to 3,186 canonical listings and removed the retired slug from search and shortlist data.
- Added a one-hop permanent redirect from `yummy-dosa-catering` to `yummy-dosa`.
- Documented the evidence and kept Wimbledon open pending authoritative identity confirmation.

**Verification**

- TypeScript, focused ESLint, importer tests, and entity-resolution tests: passed.
- Resolver dry run before migration: exactly one alias found; 3,187 -> 3,186 predicted.
- Full source CSV dry run after importer change: 3,188 rows -> 3,186 listings, two merges, no writes.
- Post-migration canonical, search-record, and shortlist counts: 3,186 each; retired Yummy slug absent.
- Redirect generation includes all four legacy/current trailing-slash variants for the retired slug.
- Listing audit: 0 critical, 3 high, 4 medium; candidate duplicates reduced from four records/two groups to two records/one group.
- Wimbledon records were not modified or suppressed.

**Status:** Phase 5C confirmed-duplicate implementation is complete. One evidence-blocked Wimbledon group remains intentionally unresolved and visible in the launch gate.

### 2026-07-15 - Phase 5D: backfill historical provenance without inventing dates

**Evidence decision**

- The exact source CSV has been byte-identical in Git since the initial repository commit.
- The import report names that file and was updated in the same 1 July commit that first added the 3,187-record canonical JSON.
- After the explicit Phase 5C entity rules, the source reproducibly generates 3,186 records and matches all 3,186 current canonical listings.
- The original extraction/import-command time and provider URL are not durably known. Filesystem timestamps were rejected as provenance evidence.

**Implementation**

- Added a historical provenance path using `firstRecordedAt`, `recordDateBasis: first-committed`, full source commit, and source SHA-256 instead of a fabricated `importedAt`.
- Added a dry-run-by-default backfill script that validates the immutable source hash, requires a complete source-to-canonical match, and refuses to overwrite existing provenance.
- Backfilled all 3,186 records with exact source filename and per-record source ID while retaining `verificationStatus: unverified` and no `lastVerifiedAt`.
- Updated the operational-quality gate to accept either a valid actual import timestamp or a fully supported historical first-commit record.
- Added integrity tests for source hash, field consistency, full coverage, the no-invented-date rule, and the no-false-verification rule.

**Measured result**

- Provenance coverage: 0/3,186 -> 3,186/3,186.
- High issue classes: 3 -> 2; `missing_provenance` is resolved.
- Listing count and public search/shortlist counts remain 3,186.
- Launch verdict remains `not_ready` because images and the unresolved Wimbledon group remain high severity.

**Status:** Phase 5D is locally implemented. Historical lineage is complete; record freshness/verification remains a separate workflow.

### 2026-07-16 - Phase 5E: enforce listing-media rights and priority enrichment

**Confirmed findings**

- Canonical data exposed 59 gallery URLs across 24 listings and 2,877 remote logos; no menu images remained.
- All 2,936 unique URLs were HTTPS and traceable to the immutable historical CSV, but none carried licence, permission, creator, or attribution evidence.
- 2,935 URLs used Googleusercontent domains; one used a restaurant-site favicon.
- The enrichment command wrote by default, contained two laptop-specific input paths, accepted media without rights metadata, and synchronized only the verbose search records—not the packed browser index.

**Implementation**

- Added a server-side registry separating source lineage, listing usage, publication state, rights status, evidence, licence, attribution, and validation date.
- Backfilled all 2,936 historical assets as source-traced, rights-unknown, and quarantined.
- Removed 59 gallery URLs and 2,877 logos from canonical/public search data while preserving the URLs in the registry.
- Added `npm run audit:media` with critical unregistered-media, high public-rights, top-100 launch coverage, long-tail backlog, orphan-registry, domain, and deterministic priority checks.
- Made media enrichment read-only by default, removed machine-specific paths, required explicit source/rights evidence for writes, and synchronized both browser search representations.
- Added a dry-run-by-default quarantine command and integrity tests preventing unapproved registry assets from appearing in public listing data.
- Reclassified general missing-image coverage as medium; the dedicated top-100 rights-approved cohort is the high launch gate.

**Measured result**

- Public unregistered/unapproved media URLs: 2,936 -> 0.
- Traceable quarantined assets: 0 -> 2,936.
- Launch-priority approved gallery coverage: 0/100 (high blocker).
- Long-tail fallback backlog: 3,086 (medium).
- Listing audit: 0 critical, 1 high, 5 medium; Wimbledon is the remaining high listing-identity issue.
- No images were downloaded, approved, relicensed, or published.

**Verification**

- Full automated suite passed: 146/146 tests.
- Full lint and TypeScript checks passed.
- Production build passed: all 26 static pages generated successfully.
- Client-payload audit passed for every guarded route and chunk budget.
- Media quarantine was idempotent on a second dry run, and the unsafe enrichment write path refused to run without source and rights evidence.
- `git diff --check` passed before staging.

**Status:** Phase 5E policy and enforcement are implemented. Production remains not ready until the top-100 media cohort and Wimbledon identity are resolved.

### 2026-07-16 - Phase 5F: dated verification and correction workflow

**Confirmed findings**

- All 3,186 listings had immutable historical provenance, but all remained `unverified` and none had a dated verification event.
- `lastVerifiedAt` and verification status existed only as passive optional fields; there was no evidence schema, append-only history, guarded writer, or stale/conflict audit.
- The suggest-update page provided guidance only and could not generate a structured correction request or prefill the relevant restaurant.
- Current public evidence distinguishes Wimbledon Tandoori at 26 Ridgway from The Village Tandoori at 28 Ridgway. The second record had the wrong name and a website hostname that no longer resolved.

**Implementation**

- Added an append-only verification ledger covering event identity, restaurant/source identity, check/record times, reviewer, evidence URLs, fields checked, prior/new values, applied status, and notes.
- Added a dry-run-by-default `npm run verify:listing -- <proposal.json>` command that validates a strict field allowlist, timestamps, URLs, value types, evidence, paired rating/coordinate invariants, and derived-data synchronization.
- Made identical proposals idempotent with deterministic event IDs; a repeated accepted proposal performs no write.
- Added `npm run audit:verification` for ledger schema/integrity, duplicate IDs, orphan events, unmatched canonical verification claims, future dates, partial core scope, unverified/stale records, and unresolved conflicts.
- Added a browser-local correction-request builder requiring public evidence, with optional environment-configured email handoff and explicit no-submit/no-retention disclosure.
- Linked every restaurant page to a prefilled correction request and updated privacy/trust language.
- Recorded the first fully scoped editor event for the 28 Ridgway entity, renamed it to The Village Tandoori, marked the checked operational status, and removed its dead website without merging the separate 26 Ridgway record.

**Measured result**

- Ledger events: 0 -> 1; integrity issues: 0.
- Fresh editor-verified listings: 0 -> 1; explicitly unverified: 3,186 -> 3,185.
- Operational listing audit: 0 critical, 1 high, 5 medium -> 0 critical, 0 high, 5 medium.
- Duplicate-name/postcode affected records: 2 -> 0.
- Canonical listing count remains 3,186.
- Verification audit remains `not_ready` because 99.97% of records have no current scoped check.

**Verification**

- TypeScript and focused verification, verification-audit, correction-workflow, and privacy tests passed.
- Guarded Wimbledon proposal dry run passed before the write; repeating it returned the existing event ID and changed no files.
- Complete regression suite passed against the final code: 149/149 tests.
- Full ESLint, TypeScript, and `git diff --check` passed.
- Standard production build generated all 26 route families and passed client-payload budgets.
- Static Cloudflare export produced 7,411 files, retained `/suggest-update/` as static HTML, passed export checks, and contained no asset over 25 MiB.

**Status:** Phase 5F is locally implemented and verified. The former Wimbledon identity blocker is resolved; the next data gate is systematic priority-cohort verification.

### 2026-07-16 - Phase 5G: deterministic verification queue and first priority batch

**Confirmed findings**

- Of 3,185 unverified listings, 609 had at least one operational data gap: 31 lacked a contact action, 129 lacked opening hours, 492 lacked categories, and 67 lacked a complete rating/review pair.
- The four records missing all four data groups were Biriyani Junction, Chotiwala, Golis South Norwood, and Spikky Pepperdem Food.
- Current FSA evidence did not corroborate those four imported identities. Chotiwala and Golis also conflicted with current same-premises/postcode records. Absence or a premises conflict was not treated as proof of closure.
- Arena Lounge had a live official site matching its identity, address, postcode, phone, operating restaurant, and full seven-day hours; the FSA also returned a matching restaurant entity.

**Implementation**

- Added `npm run report:verification-priority -- <limit>` and a deterministic one-task-per-location queue.
- The scheduling score puts unresolved evidence conflicts first, guarantees incomplete records outrank data-complete records, weights missing contact and hours most heavily, caps the popularity/value proxy, and resolves ties by slug.
- Retained a dated FSA response summary, the first five-listing batch, and the later Arena correction proposal under `docs/verification-evidence/`.
- Appended four `needs-review` events without changing canonical listing facts for evidence-blocked records.
- Verified Arena Lounge, normalized its official site to HTTPS, recorded current operational status, added seven-day hours, and applied supported East African/Chinese taxonomy values.
- Preserved the first Arena category event and appended a later corrective event after regression testing showed the initial broad `Indian / Asian` normalization conflicted with existing description semantics.

**Measured result**

- Ledger events: 1 -> 7; integrity issues remain 0.
- Fresh editor-verified listings: 1 -> 2; explicitly unverified: 3,185 -> 3,184.
- Priority queue: 3,184 records, including 608 with one or more operational gaps and four open evidence conflicts.
- Missing categories: 492 -> 491; missing opening hours: 129 -> 128. Missing contact actions and rating/review pairs remain 31 and 67.
- Operational listing audit remains `conditional` with 0 critical, 0 high, and 5 medium issue classes.
- Verification audit remains `not_ready` with two high issue classes: the 3,184-record verification backlog and four unresolved evidence conflicts.
- Google/Outscraper media remained quarantined and untouched.

**Verification**

- Queue-focused tests, full ESLint, TypeScript, and `git diff --check`: passed.
- The first complete regression run passed 149/150 tests and exposed the Arena category/description mismatch. The append-only corrective event resolved it; the final complete run passed 150/150 tests in 1m 52.53s.
- Production static build compiled successfully, generated all 3,659 static pages, and passed every route/chunk payload budget.
- The first standalone Cloudflare check correctly refused to run without `NEXT_PUBLIC_SITE_URL` in that process. Repeating it with `https://indianrestaurantlondon.co.uk` passed: 7,409 exported files and no asset over 25 MiB.
- `/suggest-update/index.html` remains present in the export; no deployment or push occurred.

**Status:** Phase 5G is locally complete. The queue and first evidence batch are reviewable in separate commits; Phase 5 remains in progress because current verification coverage is 0.06%, four identity/status conflicts are open, and the rights-approved top-100 media cohort remains 0/100.

### 2026-07-16 - Phase 5H preparation: restaurant data verification operating guide

**Outcome**

- Added `docs/restaurant-data-verification-program.md` as the controlling reference for the 608-record operational-gap program.
- Documented current counts, implemented controls, proposed publication/scope states, evidence hierarchy, V0-V5 cohort order, per-listing and per-batch procedures, outcome matrix, field-specific rules, required gates, tracking template, definition of done, and model/mode recommendation.
- Clearly separated implemented verification controls from the proposed `published`, `pending-review`, and `excluded` states so the guide does not imply that public suppression already exists.
- Kept Google/Outscraper media restoration separate and on hold.

**Verification**

- Cross-linked the guide from the remediation plan and existing verification workflow.
- `git diff --check` passed.
- No application code, canonical restaurant data, verification events, dependencies, build output, deployment configuration, or production state changed.

**Status:** The operating guide is complete. Phase 5H implementation has not started; its first step is Plan-mode design and approval of publication/scope behaviour.

### 2026-07-16 — Phase 5H: publication eligibility and scope control

**Confirmed architecture and decisions**

- Kept historical provenance, verification state/event outcome, business operating status, publication eligibility, and entity resolution as separate concepts.
- Added one materialized publication state for every retained listing in `data/listing-publication-states.json` plus append-only decisions in `data/listing-publication-events.json`.
- Controlled states are `published`, `pending-review`, and `excluded`; reasons, successor requirements, recheck dates and transitions are validated centrally.
- Migrated all 3,186 existing records without claiming they were reviewed: 3,182 retain the legacy-public baseline, while the four current evidence conflicts have explicit evidence-backed `pending-review` decisions.
- Pending records retain a minimal noindex URL but are withheld from search, filters, maps, comparisons, shortlists, sitemaps, canonical metadata and LocalBusiness structured data.
- Excluded records remain in canonical/history data. A validated published successor produces a redirect; otherwise the public route returns 404.

**Implementation**

- Added guarded dry-run-first publication migration and decision commands, strict proposal/evidence allowlists, deterministic event IDs, expected-count write guards, atomic writes and idempotency checks.
- Added a publication audit covering registry/listing identity, event chains, evidence references, successor cycles, published verification conflicts and exact public-derivative integrity.
- Centralized publication-aware rendering for every canonical-data writer so verification, provenance, media, import, entity-resolution and publication changes cannot repopulate public files with held records.
- Changed imports to dry-run by default. Existing records are preserved even when absent from a source; genuinely new records begin as `pending-review`; writes require expected new/matched/source-absent counts.
- Changed entity resolution to retain aliases, record reviewed resolution evidence, assign `excluded/superseded-by-canonical`, and require a published successor rather than deleting historical rows.
- Integrated publication state into operational, verification, priority, template-readiness and client-payload audits. Pending records are always first in the queue; excluded records are retained but omitted from ordinary work.
- Added a static-export-only 180-second page-generation timeout after the first full export exposed default 60-second worker-contention failures across eight concurrent area pages. Normal builds and development keep their existing behavior.

**Measured result**

- Retained listings/states: 3,186 / 3,186.
- Published: 3,182; pending review: 4; excluded: 0; publication decision events: 4.
- Public search and shortlist derivatives: 3,182 records with zero pending-slug leakage.
- Verification queue: 3,184 tasks, including 608 with operational gaps; the four pending records rank 1–4.
- Published operational cohort remains `conditional`: 27 missing contact actions, 124 missing opening-hours records, 487 missing-category records, and 63 missing rating/review pairs.
- Verification remains intentionally `not_ready`: 3,184 unverified listings and four open evidence conflicts. The publication audit confirms zero published records with an open conflict.
- Template readiness has zero blockers and two existing import-report warnings: 75 missing-image warnings and three missing-category warnings.
- Google/Outscraper media remained on hold, and the 31 missing-contact cohort was not processed.

**Verification and failure record**

- Final regression suite: 156/156 passed; ESLint, TypeScript and `git diff --check` passed.
- Publication audit: ready with no integrity or public-leakage findings.
- SEO and indexation audits passed: 3,520 expected sitemap URLs and 3,069 indexable restaurant URLs.
- Normal production build passed all route/chunk budgets; client chunks contain no reviewer identity, publication event IDs, baseline reason or pending reasons.
- First static export attempt failed after 447.8s because eight area pages hit Next's default 60-second worker timeout and `/areas/hackney` exhausted three retries. Focused route-generation performance tests passed, confirming worker contention rather than a deterministic route defect.
- After the static-only timeout guard, the full export passed: 3,659 pages in 668.8s, payload budgets passed, Cloudflare checks passed for 7,409 files, and no asset exceeded 25 MiB.
- Direct inspection of all four pending exports confirmed noindex metadata, the review message, no LocalBusiness schema, no operational-field leakage, and no presence in sitemap/search/shortlist/filter data.
- No push, deployment, media restoration or unrelated restaurant-data processing occurred.

**Status:** Phase 5H is locally complete. Publication eligibility is enforceable and reusable; Phase 5 remains in progress for evidence review, the 608-record operational-gap program, rights-cleared media, and authorized live verification.

### 2026-07-16 — Phase 5 contact batch 01: identity and contact-action research

**Cohort and scope**

- Rechecked the four existing `pending-review` records, then processed the first 10 records from the missing-contact cohort.
- Fixed batch slugs: `republic-restaurant-verney-road`, `the-palm-indian-restaurant-limited`, `bombay-kitchen-brixton`, `borough-market`, `calm-indiana-cow`, `chef-tazzy`, `contemporary-indian-cuisine`, `delhiacacies-deliveroo`, `home-kitchen`, and `indian-food-camden`.
- Preserved all historical source rows, source IDs and prior verification/publication events.
- Kept Google/Outscraper media restoration out of scope.

**Evidence outcomes**

- The four original conflicts remain `pending-review`. Current premises evidence identifies possible replacements or other occupants, but does not establish continuity, closure, a successor, or a safe merge.
- `bombay-kitchen-brixton` was verified as permanently closed at its historical premises and changed to `excluded/confirmed-permanently-closed`.
- `borough-market` was identified as an invalid restaurant import at hotel ancillary premises and changed to `excluded/invalid-import`; it was not redirected to the unrelated Borough Market in Southwark.
- Eight records lacked sufficient current evidence to safely assign a phone, website, hours, operating status, or successor. They changed from the legacy public baseline to `pending-review`.
- No contact detail was guessed, copied from a replacement tenant, or assigned solely from a postcode, shared kitchen, delivery platform, company registration, or FSA absence.

**Measured result**

- Verification events: 7 to 21; publication events: 4 to 14.
- Fresh editor-verified listings: 2 to 3; unverified listings: 3,184 to 3,183.
- Publication states: 3,182 published / 4 pending / 0 excluded to 3,172 published / 12 pending / 2 excluded.
- Ordinary verification queue: 3,184 to 3,182 because excluded historical records are omitted.
- Queued records with operational gaps: 608 to 606 for the same exclusion reason; the retained canonical dataset still contains 608 gap records.
- Retained-data gaps remain 31 missing contact actions, 128 missing hours, 491 missing categories, and 67 missing rating/review pairs because this batch did not manufacture replacement values.
- Published-data gaps are now 17 missing contact actions, 114 missing hours, 487 missing categories, and 55 missing rating/review pairs.
- Public search, filter and shortlist derivatives contain exactly 3,172 published listings. All 12 pending records are withheld from normal discovery and both excluded routes are absent.

**Verification**

- All verification and publication proposals passed dry-run checks before their guarded writes.
- Regression suite: 156/156 passed; ESLint, TypeScript and `git diff --check` passed.
- Publication audit: `ready`; no registry, ledger, successor or public-leakage issue.
- SEO and indexation audits passed with 3,520 sitemap URLs, 3,069 indexable restaurant URLs and zero crawl warnings.
- Standard production build passed.
- Full static export passed: 3,657 pages; payload budgets passed.
- Cloudflare export check passed for 7,405 files with no asset over 25 MiB.
- Direct export inspection confirmed all 12 pending pages are present with `noindex` and no LocalBusiness schema; both excluded restaurant routes are absent.
- Verification audit remains intentionally `not_ready`: 3,183 listings are unverified and 13 evidence conflicts remain open, including the retained excluded invalid-import record.

**Git checkpoint**

- Evidence/data commit: `e3a90e7` (`Verify first missing-contact listing batch`).
- No push or deployment occurred.

### 2026-07-16 — Phase 5 contact batch 02: verified actions and identity holds

**Cohort and scope**

- Processed the next 10 published missing-contact records: `ishaak`, `kothu`, `kundar-tandoori`, `modern-indian`, `spice-garden`, `staffordshire`, `sucess-worker`, `taj`, `thanjavur-food-lounge-ltd`, and `the-layered-biryani-by-mom`.
- Checked exact identity, premises, operating state, website/phone/order actions and hours from first-party, FSA, local-authority, Companies House and current transactional evidence.
- Kept separate brands at shared premises separate unless explicit entity evidence supported a merge.

**Evidence outcomes**

- `ishaak`: verified operational; corrected the street form and added the official website and phone.
- `kothu`: verified operational; corrected the premises from `50C` to `48-50 South End`, corrected cuisine to Sri Lankan/South Indian, and added the official website, phone, email and complete weekly hours.
- `kundar-tandoori`: verified as a current delivery brand and added its exact Deliveroo order action. The separate Taste of Punjab record at the same premises was not merged or used as a source of contact details.
- `the-layered-biryani-by-mom`: verified against exact FSA kitchen evidence and a current delivery menu; normalized the address and added the exact order action.
- `modern-indian`, `spice-garden`, `staffordshire`, `sucess-worker`, `taj`, and `thanjavur-food-lounge-ltd`: retained without speculative canonical edits and changed to `pending-review` because current identity, scope, unit or operating evidence was materially insufficient.
- No FSA hygiene score was used as a customer rating.

**Measured result**

- Verification events: 21 to 31; publication events: 14 to 20.
- Fresh editor-verified listings: 3 to 7; unverified listings: 3,183 to 3,179.
- Publication states: 3,172 published / 12 pending / 2 excluded to 3,166 published / 18 pending / 2 excluded.
- Ordinary queue: 3,182 to 3,178; queued operational-gap records: 606 to 602 because four newly verified records leave the ordinary unverified queue.
- Retained-data gaps: missing contact actions 31 to 27; missing hours 128 to 127; missing categories remain 491; missing rating/review pairs remain 67.
- Published-data gaps: missing contact actions 17 to 7; missing hours 114 to 107; missing categories remain 487; missing rating/review pairs 55 to 49.

**Verification and failure record**

- All 10 verification proposals and six publication proposals passed dry-run validation before writes.
- The first write attempt for `spice-garden` hit a transient Windows `EPERM` while atomically renaming `shortlist-summaries.json.publication-tmp`. The guarded writer restored every original file and removed temporary files. Inspection confirmed the event was not appended; the identical proposal then succeeded on retry.
- Regression suite: 156/156 passed; ESLint, TypeScript and `git diff --check` passed.
- Publication audit: `ready`; SEO and indexation audits passed with zero crawl warnings.
- Verification audit remains intentionally `not_ready`: 3,179 unverified listings and 19 open evidence conflicts.
- Standard production build and full 3,657-page static export passed; payload budgets passed.
- Cloudflare export check passed for 7,405 files with no asset over 25 MiB.
- Direct export inspection confirmed the six new pending pages are present with `noindex` and no LocalBusiness schema.

**Git checkpoint**

- Evidence/data commit: `a272717` (`Verify second missing-contact listing batch`).
- Documentation commit: `807cb11` (`Document second restaurant data batch`).
- No push or deployment occurred.

### 2026-07-16 — Phase 5 contact batch 03: complete published contact-action cohort

**Cohort and scope**

- Processed the final seven published missing-contact records: `chakra-indian-cuisine`, `dancing-elephant`, `bazaar-london-s-indian-takeaway-aldgate`, `bazaar-london-s-indian-takeaway-hackney`, `faizan-ahmad`, `ghani-food-and-spices`, and `real-taste-of-india`.
- Checked current identity, exact premises, restaurant-directory scope, operating evidence and any safe contact or transaction action.
- Did not copy a phone, website, hours or successor identity from a nearby or replacement business without explicit entity evidence.

**Evidence outcomes**

- `chakra-indian-cuisine`: current first-party location evidence does not include the imported Tooting premises, and the current premises evidence does not establish Chakra there; changed to `pending-review` for identity uncertainty.
- `dancing-elephant`: the imported address appears malformed and current exact-unit evidence identifies a different caterer without an established entity link; changed to `pending-review` for a material data conflict.
- Both Bazaar records: the former restaurant domain no longer supplies operational restaurant information, and current exact-premises evidence identifies other businesses without a confirmed continuity link; changed to `pending-review` for identity uncertainty.
- `faizan-ahmad`: the record uses a personal name and current premises evidence does not establish an in-scope restaurant identity; changed to `pending-review` for identity uncertainty without exposing personal contact data.
- `ghani-food-and-spices`: current directory evidence indicates an e-commerce/food-supply business rather than a confirmed restaurant, while current authoritative premises evidence is insufficient; changed to `pending-review` for scope uncertainty.
- `real-taste-of-india`: current first-party and exact-premises evidence identifies Kulcha Express, with replacement signals but no explicit legal or editorial continuity evidence; changed to `pending-review` for a material data conflict rather than merging or redirecting.
- All seven verification outcomes are `needs-review`. No canonical contact details were guessed and no unsupported entity merge or closure claim was made.

**Measured result**

- Verification events: 31 to 38; publication events: 20 to 27.
- Fresh editor-verified listings remain 7; unverified listings remain 3,179.
- Publication states: 3,166 published / 18 pending / 2 excluded to 3,159 published / 25 pending / 2 excluded.
- Ordinary queue remains 3,178; queued operational-gap records remain 602.
- Retained-data gaps remain 27 missing contact actions, 127 missing hours, 491 missing categories and 67 missing rating/review pairs.
- Published-data gaps: missing contact actions 7 to 0; missing hours 107 to 106; missing categories 487 to 486; missing rating/review pairs 49 to 43.
- Published contact-action coverage is now 100%. The 27 retained missing-contact records consist only of 25 pending-review records and two excluded historical records.

**Verification and failure record**

- All seven verification proposals and seven publication proposals passed dry-run validation before guarded writes.
- The first full regression run exposed a stale Southall dining-hub count after publication filtering changed it from 83 to 82; the expected fixture was corrected.
- The second full regression run exposed the corresponding stale Tooting count change from 37 to 36; the expected fixture was corrected.
- Final regression suite: 156/156 passed; ESLint, TypeScript and `git diff --check` passed.
- Publication audit: `ready`; operational audit contains no published missing-contact finding.
- Verification audit remains intentionally `not_ready`: 3,179 listings are unverified and 26 evidence conflicts remain open, including the retained excluded invalid-import record.
- SEO and indexation audits passed with 3,519 sitemap URLs, 3,069 indexable restaurant URLs and zero crawl warnings.
- Standard production build and full 3,656-page static export passed; payload budgets passed.
- Cloudflare export check passed for 7,403 files with no asset over 25 MiB.
- Direct export inspection confirmed all seven new pending pages are present with `noindex` and no LocalBusiness structured data.

**Git checkpoint**

- Evidence/data commit: `24183c3` (`Complete published missing-contact review`).
- Documentation commit: `7552211` (`Document published contact cohort completion`).
- No push or deployment occurred.

### 2026-07-16 — Phase 5 Google Place ID follow-up for contact-batch holds

**Cohort and method**

- Rechecked all 21 listings moved from `published` to `pending-review` during the three missing-contact batches using their stored Google Place IDs.
- Confirmed whether each current Place ID route resolved to the expected historical name and address, and inspected category, explicit closure state, displayed hours, phone and website.
- Reconciled Google signals against the existing official-site, FSA, premises, company and ordering-platform evidence. A resolving profile was treated as historical identity support, not automatic proof of current operation.
- Recorded all 21 outcomes in `docs/verification-evidence/google-place-id-review-pending-contact-cohort-2026-07-16.json`.

**Evidence outcomes**

- All 21 stored Place IDs still resolve to the expected historical business name and imported address.
- `bazaar-london-s-indian-takeaway-aldgate`: the exact profile is explicitly marked closed and provides a reopen action; its exact Deliveroo route is retired and current premises evidence identifies unrelated operators. Verified `businessStatus` as permanently closed and changed publication from `pending-review` to `excluded/confirmed-permanently-closed`.
- `dancing-elephant`: the exact Google profile resolves as an Indian takeaway and displays hours, but Shahi Caterers identifies the unit under Biryani House London Limited and current FSA evidence names Shahi Catering. It remains pending because no explicit operator relationship was found.
- `bazaar-london-s-indian-takeaway-hackney`: the profile displays hours, but its exact Deliveroo route now redirects away while Rays Curry Base Pizza is currently orderable at the premises. It remains pending.
- `real-taste-of-india`: the exact profile displays hours, but Kulcha Express currently identifies the same premises. It remains pending without a merge, redirect or successor claim.
- `ghani-food-and-spices`: Google categorises the exact profile as an Indian restaurant and displays hours, while Restaurantji describes delivery. It remains pending because no current official or transactional menu was found and company evidence still classifies the operation as e-commerce.
- `faizan-ahmad`: the profile displays hours but provides no category, phone, website or corroborated customer-facing restaurant identity. It remains pending.
- The other 15 profiles resolve but add no phone, website or live-hours evidence; their existing conflicts remain controlling.
- No listing was republished from Google evidence alone.

**Measured result**

- Verification events: 38 to 43; publication events: 27 to 28.
- Fresh editor-verified listings: 7 to 8; unverified listings: 3,179 to 3,178.
- Publication states: 3,159 published / 25 pending / 2 excluded to 3,159 published / 24 pending / 3 excluded.
- Ordinary queue: 3,178 to 3,177; queued operational-gap records: 602 to 601.
- Ordinary queued missing-contact records: 25 to 24.
- Retained and published operational field counts are otherwise unchanged; every published listing still has a contact action.

**Verification and failure record**

- All five append-only verification proposals passed dry-run validation before guarded writes.
- The Bazaar Aldgate publication proposal passed dry-run validation and its expected published-count guard remained 3,159.
- The first regression run passed 155/156 and exposed one stale fixture expecting 25 pending and two excluded records. The fixture was corrected to 24 pending, three excluded and 3,183 routable records.
- Final regression suite: 156/156 passed; ESLint, TypeScript and `git diff --check` passed.
- Publication audit: `ready`; 3,159 published, 24 pending and three excluded.
- Verification audit remains intentionally `not_ready`: 3,178 listings remain unverified and 25 evidence conflicts remain open, including the retained excluded Borough Market conflict.
- SEO and indexation audits passed with 3,519 sitemap URLs, 3,069 indexable restaurant URLs and zero crawl warnings.
- Standard production build passed.
- Full static export passed with 3,655 pages; payload budgets passed.
- Cloudflare export check passed for 7,401 files with no asset over 25 MiB.
- Direct export inspection confirmed Bazaar Aldgate is absent, while the four retained follow-up pages remain `noindex` and contain no LocalBusiness structured data.
- The first standalone Cloudflare check omitted the required `NEXT_PUBLIC_SITE_URL` environment value and correctly refused to run; the check passed after supplying the production HTTPS domain.

**Git checkpoint**

- Evidence/data commit: `086aca8` (`Record pending listing Google profile review`).
- No push or deployment occurred.

### 2026-07-16 — Phase 5 opening-hours batch 01: scope-first restaurant hours review

**Cohort and scope**

- Processed the first 10 published missing-opening-hours records: `premier-inn-london-blackfriars-fleet-street-hotel`, `premier-inn-london-edgware-hotel`, `premier-inn-london-harrow-hotel`, `everyman-maida-vale`, `premier-inn-london-hendon-the-hyde-hotel`, `premier-inn-london-dagenham-hotel`, `chaiwrap`, `east-india-club`, `the-hornbeam-community-centre-cic`, and `three-falcons-hotel-and-pub`.
- Checked exact entity, address, operating status, directory scope, cuisine, restaurant-specific hours and current core contacts before treating any venue schedule as restaurant hours.
- Retained the dated evidence summary and per-listing proposals under `docs/verification-evidence/opening-hours-batch-01-*`.

**Evidence outcomes**

- The five Premier Inn records are current hotels. Their attached operations are Thyme Bar & Grill, Traveller's Rest Beefeater or Brewers Fayre rather than Indian restaurant locations. All five were verified operational, supported address/phone corrections were applied, no hotel or venue hours were copied, and publication changed to `excluded/out-of-directory-scope`.
- `everyman-maida-vale` is a cinema with bar, Spielburger and cinema-seat food service. Cinema opening times were not used as restaurant hours; the record was verified operational and excluded as out of scope.
- `east-india-club` is a private members' club whose official dining page describes British cuisine for members and guests. Club dining hours were not used; the record was verified operational and excluded as out of scope.
- `the-hornbeam-community-centre-cic` is a community hub whose cafe space hosts changing projects, community meals and referral-only sessions. Office and event schedules were not used as restaurant hours; the current general email and HTTPS website were corrected, and the record was excluded as out of scope.
- `chaiwrap` remains unresolved. Current FSA premises evidence identifies Yak Yummy, Hullabaloo's first-party site now points to Greenwich, and another current directory reports Hullabaloo Deptford closed, while a claimed Tripadvisor Chai Wrap profile still presents the exact historical record as open. No closure, merge, redirect or hours were inferred; verification recorded `needs-review` and publication changed to `pending-review/material-data-conflict`.
- `three-falcons-hotel-and-pub` has a current in-scope Indian gastropub and restaurant operation. The official Old Delhi Times/Indian food pages and live OpenTable profile support Indian cuisine, daily restaurant hours of `12-10pm`, the current reservation email, restaurant phone, menu and booking action. A follow-up append-only event synchronized its visible and metadata descriptions with the verified category.
- Google/Outscraper media restoration remained separate and on hold.

**Measured result**

- Verification events: 43 to 54; publication events: 28 to 37.
- Fresh editor-verified listings: 8 to 17; unverified listings: 3,178 to 3,169.
- Open evidence conflicts: 25 to 26 because Chaiwrap moved into the explicit conflict queue.
- Publication states: 3,159 published / 24 pending / 3 excluded to 3,150 published / 25 pending / 11 excluded.
- Ordinary queue: 3,177 to 3,168; queued operational-gap records: 601 to 592.
- Unique retained records with operational gaps: 608 to 607.
- Retained-data gaps: missing contact actions remain 27; missing hours 127 to 126; missing categories 491 to 490; missing rating/review pairs remain 67.
- Published-data gaps: missing contact actions remain 0; missing hours 106 to 96; missing categories 486 to 476; missing rating/review pairs remain 43.

**Verification and failure record**

- All 10 verification proposals passed guarded dry runs before writes. All nine publication proposals then passed guarded dry runs against the appended verification events before expected-count writes.
- The first full regression run passed 152/156. Three failures were stale publication/indexation/count expectations after the nine eligibility changes. The fourth exposed inherited Three Falcons descriptive copy that no longer matched its newly verified Indian category.
- The verification field contract was extended to support attributable `description` and `metaDescription` corrections. The Three Falcons correction was recorded as a separate append-only, fully scoped follow-up event rather than rewriting the accepted event.
- Final regression suite: 156/156 passed; ESLint, TypeScript and `git diff --check` passed.
- Publication audit: `ready`; operational audit: `conditional` with no high or critical findings; verification audit remains intentionally `not_ready` with 3,169 unverified listings and 26 open conflicts.
- SEO and indexation audits passed with 3,514 sitemap URLs, 3,065 indexable restaurant URLs and zero crawl warnings.
- Full static export passed with 3,646 pages; payload budgets passed.
- Cloudflare export check passed for 7,383 files with no asset over 25 MiB.
- Direct export inspection confirmed the eight excluded routes are absent, Chaiwrap remains present with `noindex` and no LocalBusiness schema, and Three Falcons contains the verified Indian description and daily hours.

**Git checkpoint**

- Evidence/data commit: `d0b5d5a` (`Verify first published missing-hours batch`).
- No push or deployment occurred.

## Exact next checkpoint

Follow `docs/restaurant-data-verification-program.md` as the controlling reference for the remaining operational-gap verification work.

1. Continue the published missing-hours cohort with `rara-caterers`, `lady-buddha`, `empress-market`, `let-s-eat-and-greet`, `casuarina-tree-restaurant-and-bar`, `the-arch-wembley`, `clay-kitchen`, `amma-ma-foods-limited`, `the-events-place`, and `ramad-somali-restaurant`.
2. Treat exact restaurant operation, cuisine scope and restaurant-specific hours as first-class checks before using venue, event-space, hotel, pub, caterer or market schedules.
3. Keep all 25 `pending-review` records in the explicit conflict queue and revisit them only when stronger direct identity, premises, owner or successor evidence is available. Chaiwrap now belongs to this queue.
4. Record verification and publication decisions separately if new evidence resolves or changes their eligibility.
5. Configure `CORRECTIONS_EMAIL` only after a monitored mailbox, privacy owner, and retention process exist.
6. Keep Google/Outscraper media restoration on hold; acquire and document rights-cleared media for the priority cohort through a separate authorized phase.
7. When production deployment is explicitly authorized, use the guarded Phase 4E workflow and complete the outstanding live performance/accessibility/security verification gates.

## Template for future entries

### YYYY-MM-DD — Phase/item: title

**Finding/outcome:**

**Root cause or decision:**

**Files changed:**

**Tests added/updated:**

**Verification:**

**Risks/follow-ups:**

**Status:** Pending / In progress / Complete / Blocked.
