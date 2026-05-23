# Koray Methodology Gap Plan for This Directory

This plan captures the current gaps found in the site and the next implementation steps.

## Current Direction for Homepage Architecture
Your current homepage pattern (search + filters + internal links) is valid for directory UX.

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

## Priority Plan (What to Implement Next)

### 1) Enforce route-level indexation rules
Define explicit index/noindex/canonical rules for each route type and apply count/quality thresholds.

### 2) Add information-gain blocks to SEO landing pages
Add unique local editorial blocks (price ranges, “best for” guidance, practical constraints).

### 3) Introduce listing completeness scoring
Create listing quality score and index listing pages only above threshold.

### 4) Tighten crawl-path control for parameter URLs
Audit query/facet URL combinations, keep only strategic combinations indexable.

### 5) Expand contextual internal linking from entity pages
Strengthen listing-to-hub links for area, neighborhood, category, and facet intents.

### 6) Add freshness and revalidation workflows
Define update cadence for hours, status, reviews, and service options.

### 7) Add supporting editorial pages
Publish “how to choose”, “best by budget”, and use-case intent pages.

### 8) Homepage link architecture upgrade
Keep search-first UX and increase visibility of crawlable area/category hub links.

### 9) Measurement and rollout workflow
Track indexation, traffic, rankings, and conversions by page type in rollout waves.

## Suggested 30-Day Execution Sequence
Week 1:
- Finalize indexation matrix and canonical/noindex rules.
- Ship homepage hub-link architecture update.

Week 2:
- Implement listing completeness scoring and thresholds.
- Apply listing detail indexation gating.

Week 3:
- Add information-gain modules to area/category templates.
- Expand listing-to-hub internal links.

Week 4:
- Add KPI reporting checkpoints.
- Audit results and prune weak pages.