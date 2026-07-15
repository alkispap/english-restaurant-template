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

The audit documents are kept in their own checkpoint commit. Generated deployment folders such as `out/` and `.next/` are deliberately excluded from Git.

## Status summary

| Phase | Status | Current checkpoint |
| --- | --- | --- |
| 1. Query-driven listing journeys | Complete | All tests, builds, export checks, and desktop/mobile rendered-state checks passed |
| 2. Performance/export size | In progress | Local payload remediation complete; deployed-preview mobile performance remains an acceptance gate |
| 3. WCAG 2.2 AA accessibility | In progress | Confirmed code defects fixed; formal automated scan and assisted screen-reader pass remain preview gates |
| 4. Security/privacy/deployment | In progress | Dependencies, JSON-LD, headers, and privacy alignment complete; deployment documentation remains |
| 5. Listing quality/operations | Pending | Not started |
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

## Exact next checkpoint

1. Start Phase 4E by consolidating Cloudflare deployment documentation and launch verification into one authoritative workflow.
2. Audit the generated output/publish scripts for safe failure behavior and an explicit commit-to-deploy handoff.
3. On the first deployed preview, run mobile lab performance, a formal automated accessibility scan, an assisted screen-reader pass, and recheck any enabled third-party embeds.

## Template for future entries

### YYYY-MM-DD — Phase/item: title

**Finding/outcome:**

**Root cause or decision:**

**Files changed:**

**Tests added/updated:**

**Verification:**

**Risks/follow-ups:**

**Status:** Pending / In progress / Complete / Blocked.
