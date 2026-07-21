# Listing Duplicate Review — 2026-07-15

## Scope and decision rule

This review covers the two normalized name-and-postcode candidate groups reported by `npm run audit:listings`. A record is merged only when local source fields and current public evidence support one business entity. Conflicting identity evidence remains unresolved rather than being silently accepted or guessed.

## Review outcomes

| Candidate group | Local evidence | Public evidence checked | Classification | Action |
| --- | --- | --- | --- | --- |
| `yummy-dosa` / `yummy-dosa-catering` | The corrected records share the same name, 68 Cranbrook Road address, IG1 4NH postcode, main phone, and website. The main record carries 2,160 reviews; the catering row had no review evidence and its raw coordinates were outside London. | The [official Yummy Dosa website](https://yummydosarestaurant.co.uk/) publishes one restaurant at 68 Cranbrook Road and presents live dosa/catering as a service. | Confirmed duplicate/service alias | Merged into `yummy-dosa`; retired slug redirects permanently to the canonical page. |
| `wimbledon-tandoori` / `wimbledon-tandoori-merton` | The records have different place IDs but the same name, postcode, and phone, adjacent 26/28 Ridgway addresses, and nearly identical coordinates. | [Wimbledon Tandoori](https://wimbledontandoori.com/) is live. The [Village Tandoori first-party site](https://www.thevillagetandoori.co.uk/home/) describes a reopening under new management and contains conflicting 26/28 Ridgway references; the [Wimbledon Village directory](https://wimbledonvillage.com/food-drink/restaurants/the-village-tandoori/) currently publishes The Village Tandoori at 28 Ridgway with the shared phone. | Likely one operational lineage, canonical identity unresolved | No merge yet. Confirm the current trading name, premises number, primary domain, and surviving place ID with the business or another authoritative registry first. |

## Implementation

- Added a reviewed entity-resolution registry keyed by stable source IDs.
- Made generic CSV imports recognize `place_id`, `google_id`, `cid`, and explicit source-ID columns as deduplication identifiers.
- Preserved the existing Monty's Nepalese Cuisine merge explicitly instead of relying on a normalized name/address coincidence.
- Added an idempotent, guarded `npm run resolve:listing-entities` migration. It defaults to a read-only dry run and requires `--write` to update the canonical dataset and all derived search/filter/shortlist files.
- Removed `yummy-dosa-catering` from the canonical dataset and every derived index.
- Added a one-hop permanent redirect from the retired slug to `yummy-dosa`.

## Measured result

| Metric | Before | After |
| --- | ---: | ---: |
| Canonical listings | 3,187 | 3,186 |
| Candidate duplicate records | 4 | 2 |
| Candidate duplicate groups | 2 | 1 |
| Missing image records | 3,163 | 3,162 |
| Missing rating/review pairs | 68 | 67 |

The listing audit remains `not_ready`: the unresolved Wimbledon identity, missing provenance on the historical canonical dataset, and image coverage remain high-severity launch blockers.

## Verification performed

- Resolver dry run found exactly one current alias before migration and validated both stored place IDs.
- Post-migration canonical, search-record, and shortlist counts all equal 3,186; the retired slug is absent from each.
- Full source CSV dry run: 3,188 rows, 3,186 listings, two merged entity pairs, no file writes.
- `npm run audit:listings`: 0 critical, 3 high, 4 medium; only the Wimbledon pair remains in the duplicate finding.
- Automated tests cover entity source-ID resolution, removal from all public indexes, redirect preservation, and import behavior.

## Required evidence before resolving Wimbledon

Record a dated confirmation of all four fields below before changing the canonical record:

1. Current trading name.
2. Current public entrance/premises number (26 or 28 Ridgway).
3. Primary official website/domain.
4. Current authoritative place or registry identifier.
