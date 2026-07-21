# Restaurant Listing Quality Baseline

## Technical summary

The canonical dataset contains 3,187 records at the intended grain of one row per physical restaurant location. Deterministic checks found no critical slug, place-ID, coordinate, rating/review, or public-URL integrity failure.

The dataset is still **not ready for production launch** under the new operational gate because it has three high-severity issue classes:

- All 3,187 listings lack structured per-record provenance.
- 3,163 listings (99.25%) lack a usable image.
- Four listings form two likely duplicate name-and-postcode groups that require manual review.

These are concentrated operational gaps rather than general corruption: core location and coordinate coverage are complete, and contact, opening-hours, and rating/review coverage all exceed 95%.

## Dataset, grain, and sources

- Canonical data: `data/listings.json`
- Import record: `data/import-report.md`
- Source rows recorded by the import: 3,188
- Imported listings: 3,187
- Duplicate rows merged during import: 1
- Audit population: all 3,187 listings; no sampling or exclusions
- Intended grain: one record per physical restaurant location
- Audit implementation: `src/lib/listing-operational-quality.ts`
- Reproducible command: `npm run audit:listings`

The import report records the source file but the canonical records do not retain source name/ID, import date, verification status, or last-verified date as structured provenance. Google place IDs are present as operational deduplication identifiers, but they do not replace a complete provenance record.

## Coverage profile

| Field | Covered | Missing | Coverage |
| --- | ---: | ---: | ---: |
| Core location | 3,187 | 0 | 100.00% |
| Coordinates | 3,187 | 0 | 100.00% |
| Contact action | 3,156 | 31 | 99.03% |
| Rating and review count | 3,119 | 68 | 97.87% |
| Opening hours | 3,058 | 129 | 95.95% |
| Categories | 2,695 | 492 | 84.56% |
| Images | 24 | 3,163 | 0.75% |
| Structured provenance | 0 | 3,187 | 0.00% |

Coverage rate is the number of listings satisfying the stated field rule divided by all 3,187 listings.

## Confirmed findings

| Severity | Finding | Affected records | Rate | Launch treatment |
| --- | --- | ---: | ---: | --- |
| High | Missing structured provenance | 3,187 | 100.00% | Blocks launch gate |
| High | Missing usable images | 3,163 | 99.25% | Blocks launch gate |
| High | Possible duplicate name and postcode | 4 | 0.13% | Manual review required |
| Medium | Missing categories | 492 | 15.44% | Remediation or explicit acceptance |
| Medium | Missing opening hours | 129 | 4.05% | Remediation or explicit acceptance |
| Medium | Missing rating/review pair | 68 | 2.13% | Remediation or explicit acceptance |
| Medium | Missing contact action | 31 | 0.97% | Remediation or explicit acceptance |

The two possible-duplicate groups are:

- `yummy-dosa` and `yummy-dosa-catering` at postcode `IG1 4NH`
- `wimbledon-tandoori` and `wimbledon-tandoori-merton` at postcode `SW19 4QW`

These are candidates, not confirmed duplicates. Catering variants, chains, or legitimately separate businesses at one address must not be merged automatically.

## Checks performed

- Required name and slug completeness
- Normalized slug uniqueness
- Google place-ID uniqueness
- Normalized name-plus-postcode near-duplicate groups
- Complete coordinate pairs, global numeric validity, and configured London bounds
- Rating range, review-count validity, and pair consistency
- Absolute HTTP(S) validation for public contact, booking, menu, map, social, logo, and image URLs
- Core location, category, image, contact, opening-hours, rating/review, and provenance coverage
- Severity counts and a deterministic launch verdict

The audit command exits non-zero whenever a critical or high-severity finding exists. Unit coverage verifies both a clean record and representative duplicate, missing, and invalid cases.

## Why the gaps matter

Missing provenance prevents reliable refreshes, disputes, correction history, and evidence-backed verification claims. Missing images create a visibly repetitive directory and provide no licensing or source trail. Possible duplicate pages can split trust and SEO signals. The medium gaps weaken filters, open-now confidence, rankings, and the ability to contact a business.

## Temporal and trend limitations

The directory-level freshness audit recorded the source dataset as 58 days old on 2026-07-15. There are no per-record import or last-verified timestamps, so freshness cannot yet be segmented by restaurant, source, borough, category, or verification status. No historical snapshots exist in this audit, so it cannot measure drift or determine when missingness changed.

## Recommended remediation

1. Populate provenance during import: source name, source ID, source URL where applicable, imported date, verification status, and last-verified date.
2. Review the two near-duplicate groups manually; merge only confirmed duplicates and preserve redirects from retired slugs.
3. Define an image licensing, attribution, validation, deduplication, and fallback policy before bulk enrichment.
4. Enrich high-value listings first rather than attempting 3,163 images without prioritization.
5. Review the 492 uncategorized records, then the smaller hours, review, and contact-action gaps.
6. Keep `npm run audit:listings` non-passing for launch until every high finding is fixed or documented as an explicit risk acceptance.

## Assumptions and open questions

- The intended entity grain is one physical restaurant location, not one brand or one Google profile.
- HTTP(S) syntax does not prove a URL is live, safe, licensed, or relevant; external health checks remain future work.
- Image presence does not prove licensing or suitability.
- The correct source/provider identity and extraction date for the current import must be confirmed before backfilling provenance.
- The team must define what qualifies as `source-verified` versus `editor-verified`.
- A traffic/value signal is needed to choose the first image-enrichment batch.

## Report delivery note

The audit was preserved as Markdown because the available analytical report renderer requires SQL provenance for chart/table blocks and rejected this JSON-plus-TypeScript evidence path. No SQL provenance was invented. The source files and command above remain directly inspectable and reproducible.
