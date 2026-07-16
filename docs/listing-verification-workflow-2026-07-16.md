# Listing Verification and Correction Workflow — 2026-07-16

For the complete multi-batch program, evidence hierarchy, proposed publication/scope states, field rules, gates, tracking template, and definition of done, follow `docs/restaurant-data-verification-program.md`.

## Purpose and grain

The canonical dataset has one row per restaurant location. Historical provenance establishes where a row came from; it does not establish that the restaurant's current identity, status, hours, contact details, or address are still correct.

Phase 5F adds one current verification state per canonical listing plus an append-only event ledger at `data/listing-verification-events.json`. Every accepted event identifies the listing, check time, reviewer, evidence sources, fields checked, proposed changes, prior values, and whether each change was applied.

## Verification states

| State | Meaning |
| --- | --- |
| `unverified` | The listing is source-traceable but has no accepted current verification event. |
| `source-verified` | A current authoritative source supports the checked fields. |
| `editor-verified` | An editor reconciled evidence and accepted the checked fields and changes. |
| `needs-review` event | Evidence conflicts or is insufficient; no canonical change or verification claim is applied. |

Verification is explicitly scoped by `fieldsChecked`. A listing counts as fresh in the audit only when its latest matching event covers the core identity and operational scope: name, address, postcode, business status, website, phone, and opening hours.

## Safe command

Prepare a JSON proposal using `docs/listing-verification-proposal-template.json`, retain the real evidence file under `docs/verification-evidence/`, and run a dry check:

```powershell
npm run verify:listing -- docs\verification-evidence\proposal.json
```

After reviewing the proposed event ID and changes, apply the exact proposal:

```powershell
npm run verify:listing -- docs\verification-evidence\proposal.json --write
```

The command updates canonical listings, both browser-search representations, filter counts, shortlist summaries/indexes, and the append-only ledger together. Repeating an identical proposal produces the same deterministic event ID and changes nothing.

Do not manually edit `lastVerifiedAt`, `lastVerificationEventId`, or `verificationStatus`. Do not rewrite a historical event; append a later evidence-backed event that supersedes it.

## Quality gate

Run:

```powershell
npm run audit:verification
```

The gate checks:

- unsupported ledger versions and duplicate event IDs;
- malformed evidence, timestamps, fields, or outcomes;
- events referencing missing canonical listings;
- verified canonical states without a matching ledger event;
- future verification dates;
- partial core-field verification;
- unverified listings;
- verification aged 90–179 days or at least 180 days;
- latest events that remain `needs-review`.

The freshness thresholds are operational controls, not claims that every field changes on a fixed schedule. Ninety days creates a medium review queue; 180 days is a high-priority recheck.

## Deterministic priority queue

Run:

```powershell
npm run report:verification-priority -- 50
```

The command writes nothing. It schedules one task per restaurant location, puts current `needs-review` conflicts first, then prioritizes missing contact actions, opening hours, categories, and rating/review pairs. A capped featured/review/rating/completeness proxy orders records within those operational groups. The score is an editorial scheduling heuristic, not measured traffic or a restaurant rating; exact weights and tie-breaking are printed in every report and covered by tests.

Publication state is now part of scheduling. `pending-review` records are always placed first, while `excluded` records remain retained in history but are omitted from the ordinary verification queue. The report prints publication counts separately.

## Publication eligibility workflow

Publication eligibility is separate from verification status and business operating status. Current state is stored in `data/listing-publication-states.json`; append-only decisions are stored in `data/listing-publication-events.json`.

Prepare a proposal from `docs/listing-publication-proposal-template.json`, then dry-run it:

```powershell
npm run decide:listing-publication -- docs\verification-evidence\publication-proposal.json
```

Apply only after reviewing the predicted transition, evidence references and published count:

```powershell
npm run decide:listing-publication -- docs\verification-evidence\publication-proposal.json --write --expected-published-count=<count>
```

Run `npm run audit:publication` after every publication decision or data-writer/import change. Do not edit the registry or ledger manually.

## Visitor correction requests

Every restaurant page links to a prefilled `/suggest-update` workflow. The form generates structured correction text in the browser and requires a public evidence URL. It does not automatically transmit, store, or publish form contents.

Set the server environment variable `CORRECTIONS_EMAIL` only after a real monitored mailbox and retention process exist. When configured, the form can open the visitor's email application with the generated request. The website still does not submit the message itself.

## First recorded correction

The 28 Ridgway record was corrected from `Wimbledon Tandoori` to `The Village Tandoori`. Evidence distinguishes it from the separate Wimbledon Tandoori premises at 26 Ridgway. The dead `thevillagetandoorionline.com` URL was removed, the checked operational state was recorded, and the formerly high duplicate-name/postcode finding cleared without merging either entity.

Evidence is retained in `docs/verification-evidence/wimbledon-tandoori-merton-2026-07-16.json` and linked to ledger event `verification-2026-07-15-wimbledon-tandoori-merton-d184af1d280a`.

## Current baseline

| Measure | Result |
| --- | ---: |
| Canonical listings | 3,186 |
| Verification ledger events | 38 |
| Publication decision events | 27 |
| Fresh editor-verified listings | 7 |
| Unverified listings | 3,179 |
| Open evidence conflicts | 26 |
| Retained records with data gaps | 608 |
| Ordinary queued records with data gaps | 602 |
| Published listings | 3,159 |
| Pending publication review | 25 |
| Excluded listings | 2 |
| Published records missing contact actions | 0 |
| Published records missing opening hours | 106 |
| Ledger integrity issues | 0 |
| Operational duplicate-name/postcode high issues | 0 |

The verification audit remains `not_ready` because 99.78% of listings have not received a current scoped check and 26 evidence conflicts remain open. This is an explicit queue, not evidence that all 3,179 records are incorrect. One open verification conflict belongs to an excluded invalid import and remains retained for audit history.

## Next verification priority

1. Start the published missing-hours cohort with `premier-inn-london-blackfriars-fleet-street-hotel`, `premier-inn-london-edgware-hotel`, `premier-inn-london-harrow-hotel`, `everyman-maida-vale`, `premier-inn-london-hendon-the-hyde-hotel`, `premier-inn-london-dagenham-hotel`, `chaiwrap`, `east-india-club`, `the-hornbeam-community-centre-cic`, and `three-falcons-hotel-and-pub`.
2. Confirm restaurant-directory scope and the exact restaurant identity before adding venue-level hours for hotels, clubs, cinemas or community buildings.
3. Keep the 25 `pending-review` records withheld from normal discovery until stronger evidence supports publication, exclusion, correction, or entity resolution.
4. Record verification and publication decisions separately when evidence changes both current facts and public eligibility.
5. Configure a monitored corrections mailbox and retention policy before enabling email handoff.
6. Keep the deferred Google media decision separate from restaurant-data verification.
