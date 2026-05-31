# Koray Methodology Gap Plan for This Directory

This plan captures the current gaps found in the site and the next implementation steps.

## Current Direction for Homepage Architecture

Your current homepage pattern, search plus filters plus internal links, is valid for directory UX.

Recommended evolution:

1. Keep search and filtering as the primary utility layer.
2. Add stronger static hub links above the fold to core topical hubs:
   - Top Areas in London
   - Top Categories/Cuisines
   - Best-of intent pages
3. Use area hubs to route users into:
   - area -> category-in-area pages
   - area -> neighborhood pages
   - area -> high-intent facet pages
4. Keep faceted query pages functional for users but only index selected high-value combinations.

## Priority Plan

### 1) Enforce route-level indexation rules

Status: Completed.

Define explicit index/noindex/canonical rules for each route type and apply count/quality thresholds.

### 2) Add information-gain blocks to SEO landing pages

Status: Completed.

Add unique local editorial blocks, including price ranges, best-for guidance, and practical constraints.

### 3) Introduce listing completeness scoring

Status: Completed.

Create listing quality score and index listing pages only above threshold.

### 4) Tighten crawl-path control for parameter URLs

Status: Completed.

Audit query/facet URL combinations, keep only strategic combinations indexable.

### 5) Expand contextual internal linking from entity pages

Status: Completed.

Strengthen listing-to-hub links for area, neighborhood, category, and facet intents. Contextual bridge groups now include descriptions, avoid noindex targets, and are covered by an internal-link governance audit.

### 6) Add freshness and revalidation workflows

Status: Completed as an advisory audit/report workflow.

Define update cadence for hours, status, reviews, and service options.

### 7) Add supporting editorial pages

Status: Future content work.

Publish how-to-choose, best-by-budget, and use-case intent pages.

### 8) Homepage link architecture upgrade

Status: Completed.

Keep search-first UX and increase visibility of crawlable area/category hub links.

### 9) Measurement and rollout workflow

Status: Partially completed. Provider-neutral event hooks and template readiness audits are implemented; Search Console review and real analytics reporting remain post-launch setup.

Track indexation, traffic, rankings, and conversions by page type in rollout waves.

## Suggested 30-Day Execution Sequence

Week 1:

- [x] Finalize indexation matrix and canonical/noindex rules.
- [x] Ship homepage hub-link architecture update.

Week 2:

- [x] Implement listing completeness scoring and thresholds.
- [x] Apply listing detail indexation gating.

Week 3:

- [x] Add information-gain modules to area/category templates.
- [x] Expand listing-to-hub internal links.
- [x] Add report-only internal-link governance for bridge descriptions, anchor quality, route shape, and indexable targets.

Week 4:

- [x] Add KPI/event hook checkpoints.
- [x] Add freshness audit report.
- [x] Add template readiness audit for future copied directories.
- [ ] Review Search Console and real analytics reports after deployment.
