# Local Directory Indexation Matrix (Route-by-Route)

This matrix turns the strategy into concrete implementation rules for your current route system.

## How to Use
- **Index** = include in sitemap + self-canonical + index,follow.
- **Noindex** = noindex,follow + canonical to strongest relevant parent URL.
- Re-check thresholds monthly and after major data imports.

## 1) Homepage and Core Hubs
- `/` -> Index
- `/areas` -> Index
- `/categories` -> Index
- `/listings` -> Keep redirect behavior to avoid duplicate listing surface

## 2) Listing Detail Pages
- `/listings/[slug]` -> Conditional index
- Index only when listing quality score >= threshold and not permanently closed
- Otherwise: noindex,follow + canonical remains stable

## 3) Location Hubs
- `/areas/[area]` -> Conditional index (minimum listing count + unique value)
- `/neighborhoods/[neighborhood]` -> Conditional index (minimum listing count + unique local value)

## 4) Category / Intent Hubs
- `/categories/[category]` -> Conditional index (higher threshold than area pages)
- `/best/[slug]` or curated pages -> Conditional index if explicit selection criteria and sufficient results

## 5) Facet and Combination Pages
- `/dietary/[x]`, `/services/[x]`, `/types/[x]`, `/offerings/[x]` -> only approved high-intent facets + thresholds
- `/areas/[area]/categories/[category]` -> index only when combo has sufficient results and unique value

## 6) Query/Filter URL Rules
- Parameterized filter permutations remain for UX
- Do not treat them as primary SEO index targets
- Canonicalize toward strongest static hub where applicable

## 7) Sitemap Inclusion Rules
Include only URLs that satisfy:
1. Approved route type
2. Threshold met
3. Unique value present
4. Canonical target
5. Listing quality gate passed for detail pages

## 8) Implementation Checklist
1. Add per-route indexability guards
2. Emit dynamic robots metadata
3. Emit explicit canonical per template
4. Keep sitemap logic aligned with same gates
5. Add QA checks for index/noindex outcomes

## 9) Homepage Internal Link Priority
Keep search-first UX but prioritize static crawlable links to:
- top areas
- top categories
- approved high-intent facets
- top area+category combinations