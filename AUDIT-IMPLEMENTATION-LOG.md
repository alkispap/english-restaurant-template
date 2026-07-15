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

These changes existed before remediation began and must not be overwritten or attributed to the audit implementation:

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

The audit documents are kept in their own checkpoint commit. Generated deployment folders such as `out/` and `.next/` are deliberately excluded from Git.

## Status summary

| Phase | Status | Current checkpoint |
| --- | --- | --- |
| 1. Query-driven listing journeys | Complete | All tests, builds, export checks, and desktop/mobile rendered-state checks passed |
| 2. Performance/export size | In progress | Initial route payload fixed and budgeted; on-demand search chunk and export size/time remain |
| 3. WCAG 2.2 AA accessibility | Pending | Not started |
| 4. Security/privacy/deployment | Pending | Not started |
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

This fallback produced hydrated DOM evidence and 390×844 screenshots. It also exposed apparent horizontal clipping on the mobile directory and SEO landing layouts. Because the query journeys themselves work and the clipping needs its own width/overflow diagnosis, it is recorded as a new follow-up for the responsive/accessibility phase rather than being folded into the query fix.

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

## Exact next checkpoint

1. Trace how the on-demand 6.87 MB browser search chunk is consumed and identify a safe sharding/fetch strategy.
2. Add a separate budget for query-activated data without forcing it into clean first load.
3. Measure static-output bytes by file family and repeated content before changing route generation.
4. Trace the 364 KB `/compare` route payload.
5. Separately diagnose the observed 390 px horizontal clipping in the responsive/accessibility workstream.

## Template for future entries

### YYYY-MM-DD — Phase/item: title

**Finding/outcome:**

**Root cause or decision:**

**Files changed:**

**Tests added/updated:**

**Verification:**

**Risks/follow-ups:**

**Status:** Pending / In progress / Complete / Blocked.
