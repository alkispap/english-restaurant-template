# Directory Import Provenance

Every new directory import records provenance for each listing. This supports refreshes, corrections, duplicate review, and future directory templates without claiming that imported data has been independently verified.

## Recommended dry run

```powershell
npm run import:directory -- "data/your-directory.csv" --dry-run --source-name="Provider or export name" --source-url=https://example.com/source --imported-at=2026-07-15T12:00:00Z
```

Options use `--name=value` syntax:

- `--source-name`: Human-readable provider/export identity. Defaults to the CSV filename.
- `--source-url`: Optional public HTTP(S) source page. Do not use a signed, private, credential-bearing, or local file URL.
- `--imported-at`: Optional ISO date/time for a known import event. Defaults to the time the command runs.

The dry run prints the complete import report and changes no files. Review its row counts, merged duplicates, warnings, source identity, timestamp, and initial verification status before running a normal import.

## Per-listing fields

Each generated listing receives:

- `sourceName`
- `sourceId`
- optional `sourceUrl`
- `importedAt`
- `verificationStatus: "unverified"`

The source ID uses the upstream deduplication ID when available. If a generic source has no stable ID, the importer records a transparent row locator such as `source.csv#row=42`.

## Historical datasets without a known import timestamp

Do not invent `importedAt` for a dataset created before provenance tracking existed. A historical backfill may instead record:

- `firstRecordedAt`: the earliest durable timestamp supported by version-control history
- `recordDateBasis: "first-committed"`
- `sourceCommit`: the full commit that first recorded the canonical dataset
- `sourceSnapshotSha256`: the SHA-256 of the exact source snapshot

This establishes lineage, not freshness or verification. The record must remain `unverified` until a separate source/editor verification event supplies `lastVerifiedAt`.

There is intentionally no import option that marks records verified. A later source/editor verification workflow must set `source-verified` or `editor-verified` together with a real `lastVerifiedAt` value.

## Current dataset

This change does not backfill the existing 3,187 listings because the historical source identity and verification evidence have not yet been confirmed. Run `npm run audit:listings` to see current provenance coverage and the remaining launch blockers.
