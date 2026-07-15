# Audit Remediation and Implementation Plan

**Started:** 15 July 2026
**Source audit:** `CODEBASE-AUDIT-2026-07-15.md`
**Implementation log:** `AUDIT-IMPLEMENTATION-LOG.md`
**Goal:** Move the directory from **not ready** to at least **conditionally ready**, then to **ready for production**, without losing the reusable-template objective.

## Working rules

- Preserve existing user changes and avoid broad formatting or unrelated refactors.
- Treat each confirmed issue as a testable outcome, not just a code task.
- Add regression coverage before or with every material fix.
- Keep static-export behaviour as a first-class acceptance requirement.
- Re-run lint, type-check, tests, production build, and relevant browser journeys at phase boundaries.
- Do not combine risky dependency/data migrations with unrelated UI changes.

## Phase 1 — Restore query-driven listing journeys

**Priority:** Immediate launch blocker
**Status:** Complete — verified against the production/static export at desktop and mobile widths

### 1.1 Main directory query activation

- Add a regression assertion that the lightweight browser enhancer is mounted even when the server model has no query string.
- Mount `DirectoryListingsQueryEnhancer` unconditionally.
- Retain the enhancer's current behaviour of lazy-loading large browser search modules only when a normalized query exists.

**Acceptance criteria**

- `/restaurants` still renders its normal server/static result region.
- `/restaurants/?q=Dishoom` activates client results and does not leave the unfiltered result set visible.
- Supported filter parameters behave the same way.
- The clean `/restaurants` route does not eagerly load the heavy query modules.

### 1.2 SEO landing result replacement

- Add a regression assertion for reliable hiding of the server result region.
- Make the server result container unambiguously non-visible while client-filtered results are active.
- Confirm only one results heading, one filter set, and one listing region remain visible.

**Acceptance criteria**

- A clean SEO landing page remains server-rendered.
- A supported query parameter replaces, rather than duplicates, its results.
- Clearing the query restores the original server result region.

### 1.3 Verification gate

- Run focused regression tests.
- Run the complete test suite, type-check, and lint.
- Run a production build.
- Validate both journeys against the static export at desktop and mobile widths.

## Phase 2 — Performance and export-size reduction

**Priority:** Before launch
**Status:** In progress — initial directory/SEO first-load payload reduced from 1.31 MB to 143–145 KB and protected by build budgets

### Work packages

1. Generate a route/chunk size baseline and define budgets for first-load JS, largest async chunk, and export size.
2. Trace the largest client chunks to listing/search data and UI dependencies.
3. Separate server/static data generation from the minimal browser search index.
4. Load maps, advanced filters, and other expensive capabilities only when used.
5. Reduce repeated per-page serialized data and duplicated export assets.
6. Add a CI check that fails on material budget regressions.

**Acceptance criteria**

- Agreed budgets are documented and enforced.
- No core route ships the full directory dataset without a demonstrated need.
- Query/filter journeys remain correct in a static export.
- Mobile lab performance is measured on a deployed preview.

## Phase 3 — WCAG 2.2 AA accessibility

**Priority:** Before launch
**Status:** In progress

### Work packages

1. Introduce accessible colour tokens and replace failing white-on-primary combinations.
2. Audit every dialog for label, initial focus, focus containment, Escape, inert background, and focus restoration.
3. Give every form control a persistent programmatic label and associate help/error messages.
4. Test keyboard journeys, zoom/reflow, reduced motion, landmarks, headings, and accessible names.
5. Add automated checks while retaining manual keyboard and screen-reader verification.

**Acceptance criteria**

- Normal text meets 4.5:1 and large text/UI boundaries meet their applicable AA requirements.
- All important journeys work with keyboard alone.
- Dialog focus never escapes to obscured content.
- Automated scans have no serious/critical violations, with manual results recorded.

## Phase 4 — Security, privacy, and deployment hardening

**Priority:** Before launch
**Status:** In progress

### Work packages

1. Triage all dependency advisories by production reachability and upgrade safely.
2. Centralize script-safe JSON-LD serialization and add hostile-input tests.
3. Make Supabase error states explicit, recoverable, and observable.
4. Define and test production response headers, including CSP compatibility.
5. Self-host runtime map assets.
6. Inventory analytics, ads, forms, cookies/storage, and third-party data flows; align notice and consent behaviour.
7. Consolidate Cloudflare/static-export deployment documentation.

**Acceptance criteria**

- No unresolved critical/high production dependency advisory without an explicit risk decision.
- Structured data cannot terminate its script element through imported content.
- Failed remote mutations never present a false success state.
- Preview response headers pass the agreed policy.
- Production privacy copy accurately matches enabled services and controls.

## Phase 5 — Listing quality and operational readiness

**Priority:** Before launch for minimum quality; continuing after launch
**Status:** Pending

### Work packages

1. Define image licensing, provenance, validation, deduplication, and fallback rules.
2. Prioritize image enrichment by traffic/value and avoid blocking launch on low-value long-tail records.
3. Classify and resolve link-governance warnings; add recurring health checks.
4. Add per-listing source, source ID/URL, imported date, last verified date, status, and editorial history.
5. Add correction/dispute and refresh workflows.

**Acceptance criteria**

- Priority listings meet the launch image-quality threshold.
- High-risk external links are reviewed and every link category has an owner/rule.
- Every listing can be traced to its source and verification state.

## Phase 6 — Reusable directory productization

**Priority:** After the first directory is stable
**Status:** Pending

### Work packages

1. Define a schema for a directory pack: brand, domain, cuisine/category, city/region, labels, navigation, SEO defaults, content, analytics, ads, and assets.
2. Replace build-script domain literals with validated environment/config values.
3. Move Indian/London-specific editorial content and imagery out of shared components.
4. Add a bootstrap command and readiness audit for new directories.
5. Prove reusability by creating a test configuration for “Mexican Restaurants in London” without copying application logic.

**Acceptance criteria**

- A second directory can be configured without editing shared React components.
- Automated tests detect leaked source-brand, cuisine, city, or domain strings.
- Deployment, sitemap, metadata, structured data, and content all derive from the selected directory pack.

## Recommended delivery slices

| Slice | Outcome | Risk | Verification |
| --- | --- | --- | --- |
| 1 | Fix both query-rendering blockers | Low and isolated | Focused tests, full checks, static browser journeys |
| 2 | Establish budgets and remove largest payload source | Medium | Build analysis, route tests, deployed mobile lab run |
| 3 | Correct colour/dialog/form accessibility | Medium | Automated scan plus manual keyboard/screen-reader pass |
| 4 | Harden dependencies, JSON-LD, Supabase, headers, privacy | Medium/high | Security tests, preview headers, operational review |
| 5 | Improve data, images, provenance, and links | Operational | Data-quality report and sampled record verification |
| 6 | Extract reusable directory packs | Architectural | Second-directory configuration proof |

## Current implementation checkpoint

Phase 1 passed its verification gate. Phase 2 local payload remediation passed and remains open only for deployed mobile lab measurement. Phase 3 corrected confirmed accessibility defects and remains open for a formal automated scan and assisted screen-reader pass on a deployable preview. Phase 4A reduced the full dependency audit from five findings to two linked reviewed moderates and added an enforced advisory policy. Phase 4B centralized all seven JSON-LD emissions behind a serializer that preserves valid schema data while escaping script-terminating content. The next implementation slice is production security headers and CSP/static-export compatibility.
