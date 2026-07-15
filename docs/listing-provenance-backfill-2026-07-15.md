# Historical Listing Provenance Backfill — 2026-07-15

## Technical summary

All 3,186 canonical listings can be traced to the repository's unchanged `Indian Restaurants - Outscraper - Test.csv` snapshot. The backfill records the exact source filename, per-record source ID, source SHA-256, and the commit/time when the canonical JSON was first durably recorded. It deliberately does not invent the unknown extraction or import time, provider URL, verification date, or verified status.

Provenance coverage improved from 0% to 100%. Every record remains `unverified`, so this change establishes lineage only; it does not assert that current hours, ratings, contact details, operating status, or identity have been freshly checked.

## Provenance is complete, but launch readiness is unchanged

| Measure | Before | After | Interpretation |
| --- | ---: | ---: | --- |
| Canonical listings | 3,186 | 3,186 | No listing was added, removed, or re-keyed. |
| Complete provenance | 0 (0.00%) | 3,186 (100.00%) | Historical lineage is now machine-readable. |
| High-severity issue classes | 3 | 2 | `missing_provenance` is resolved; images and Wimbledon remain. |
| Verification status: unverified | 3,186 | 3,186 | The backfill makes no freshness claim. |
| Launch verdict | `not_ready` | `not_ready` | Remaining high-severity blockers still apply. |

No chart is included because this is a single exact before/after control result; the audit table is more precise and less likely to imply a trend.

## Scope, source, and field definitions

- **Canonical grain:** one record per intended physical restaurant location.
- **Source snapshot:** `data/Indian Restaurants - Outscraper - Test.csv`.
- **Snapshot SHA-256:** `3b7985768ff080490fb27767371979bd181ec1afb9ad4a1c40cf2219916d262d`.
- **First canonical record:** commit `80eb6b4f2ac8db490423757cc1eb3edafc5f66e3`, committed 1 July 2026 at 04:40:55 UTC.
- **`firstRecordedAt`:** the earliest durable version-control timestamp for `data/listings.json`; it is not called `importedAt`.
- **`sourceId`:** the stable place ID retained by the source/importer, or the importer's deterministic name/address key for the one source row without a place ID.
- **`verificationStatus`:** `unverified` for every record.

## Evidence and matching method

1. Git history shows the exact source CSV was added in the initial repository commit and its Git blob remains unchanged at the current commit.
2. The import report names that CSV, records a normal import of 3,188 rows to 3,187 listings, and was updated in the same commit that first added `data/listings.json`.
3. The reviewed entity rules now reproduce 3,186 preview listings from those 3,188 rows after the explicit Monty's and Yummy Dosa merges.
4. All 3,186 current canonical records matched that preview: 3,185 unique place IDs plus `gandhi-tandoori`, matched by its deterministic `gandhitandoori:712chigwellrd` source key.
5. The backfill script verifies the source SHA-256 before making changes, refuses to overwrite any existing provenance, defaults to a dry run, and rebuilds all derived indexes only with `--write`.

The post-backfill quality audit reports 3,186/3,186 complete provenance records and no `missing_provenance` finding.

## Limitations and robustness checks

- The exact source extraction time and original import-command time are unknown. Filesystem modification times were inspected but not used because they are not durable provenance.
- The filename contains “Outscraper,” but the import report classifies the structure as Generic CSV. The backfill records the exact filename and does not claim a provider account, export job, or public source URL.
- Subsequent commits corrected local business fields, removed blocked media, enriched some media, and merged confirmed entities. The source snapshot therefore proves origin, not that every current field is byte-for-byte identical to the CSV.
- A source snapshot and place ID do not prove a business is currently open or its details are current. No `lastVerifiedAt` value was added.
- The SHA-256 guard, full source-to-canonical match, idempotent second dry run, provenance audit, and regression tests protect against silent mismatch or future source replacement.

## Recommended next steps

1. Keep the historical backfill immutable; future imports should continue using the actual `importedAt` captured by the import command.
2. Add dated source/editor verification only when a record is actively checked, beginning with high-traffic listings and the unresolved Wimbledon identity.
3. Define the licensed image-source and attribution policy before bulk image enrichment.
4. Preserve the source snapshot hash and commit reference in any copied directory template so lineage is not confused with the next directory's source.

## Further questions

- Can the original export job or provider account supply an authoritative extraction timestamp and source URL?
- Which listings should receive the first verified refresh based on traffic, commercial value, or launch prominence?
- Should later editorial changes receive a per-record history log in addition to the source-level provenance now present?
