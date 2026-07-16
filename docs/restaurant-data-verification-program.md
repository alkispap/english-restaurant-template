# Restaurant Data Verification Program

**Created:** 2026-07-16  
**Status:** Operating reference; publication/scope controls implemented locally in Phase 5H
**Dataset grain:** One canonical record per restaurant location  
**Objective:** Make the public directory trustworthy without guessing, deleting history, or presenting historical source data as current verification

## 1. Purpose

Restaurant data is a core product asset. A technically correct website is not launch-ready if restaurant identities, operating states, addresses, categories, hours, contacts, or ratings are unreliable.

This is the controlling reference for the remaining operational-gap program. It defines acceptable evidence, processing order, per-record outcomes, batch size, commands, tests, commits, progress tracking, and completion criteria.

The goal is **100% evidence-checked coverage of the operational-gap cohort**, not 100% forced field population. If a current authoritative source does not publish a phone number or hours, “checked but not publicly provided” can be correct. Never invent a value to improve completeness.

## 2. Current baseline

Checkpoint after completing the published missing-contact cohort and its 21-record Google Place ID follow-up:

| Measure | Count | Meaning |
| --- | ---: | --- |
| Canonical location records | 3,186 | Total dataset grain |
| Fresh editor-verified records | 8 | Complete current core-field checks with retained evidence |
| Unverified records | 3,178 | Historically traceable but not fully checked for current facts |
| Retained records with operational gaps | 608 | Unique canonical records missing at least one important data group |
| Ordinary queued records with operational gaps | 601 | Excludes excluded records and fresh verified records from the ordinary unverified queue |
| Open evidence conflicts | 25 | Reviewed records with insufficient or contradictory current evidence |
| Missing contact action | 27 | No validated contact, transaction or map action |
| Missing opening hours | 127 | No structured current hours |
| Missing categories | 491 | No supported cuisine/category value |
| Missing rating/review pair | 67 | Rating and review count are not both present and valid |
| Published missing contact action | 0 | Every public record has a contact, transaction or map action |
| Published missing opening hours | 106 | Next public operational-gap cohort |

The gap counts overlap. One restaurant can appear in several categories, so they must not be added to estimate unique records.

These figures do not mean that 3,178 restaurants are wrong. They mean the directory lacks a dated, complete, evidence-backed current check for them.

## 3. Existing controls

These already exist and must not be bypassed:

- Historical source provenance for every canonical listing.
- One canonical row per restaurant location.
- Reviewed entity-resolution rules for confirmed aliases and duplicates.
- Append-only ledger: `data/listing-verification-events.json`.
- Guarded dry-run writer: `npm run verify:listing -- <proposal.json>`.
- Verification audit: `npm run audit:verification`.
- Materialized publication registry: `data/listing-publication-states.json`.
- Append-only publication decisions: `data/listing-publication-events.json`.
- Guarded publication writer: `npm run decide:listing-publication -- <proposal.json>`.
- Publication integrity/public-leakage audit: `npm run audit:publication`.
- Deterministic read-only queue: `npm run report:verification-priority -- 50`.
- Operational audit: `npm run audit:listings`.
- Evidence proposals retained under `docs/verification-evidence/`.
- Google/Outscraper media remains quarantined unless separate rights evidence is approved.

Do not directly edit `verificationStatus`, `lastVerifiedAt`, `lastVerificationEventId`, or historical events. Correct an accepted event with a later append-only event.

## 4. Core principles

1. **Evidence before edits.** Every accepted current fact needs an attributable source and access date.
2. **Absence is not closure.** A missing FSA result, failed search, unavailable ordering page, or dead domain does not alone prove closure.
3. **Conflicts stay visible.** Record `needs-review`; never choose a convenient source.
4. **Historical and current truth are separate.** Import history establishes lineage, not current operation.
5. **No silent deletion.** Closed, moved, duplicate, renamed, unverifiable, and out-of-scope records retain an audit trail.
6. **One location, one record.** Chain locations remain separate; aliases are reconciled explicitly.
7. **A checked blank can be valid.** Never manufacture a value to improve a percentage.
8. **Ratings are not interchangeable.** A food-hygiene score is not a customer rating.
9. **Small batches, complete gates.** Finish evidence, application, tests, tracking, and commit before the next batch.
10. **No deployment by implication.** Verification work never authorizes pushing or publishing.

## 5. Separate states and meanings

### Verification state — implemented

| State | Meaning |
| --- | --- |
| `unverified` | Source lineage exists, but no accepted current scoped event exists. |
| `source-verified` | A current authoritative source supports the checked fields. |
| `editor-verified` | An editor reconciled and accepted the checked facts or corrections. |
| `needs-review` event | Evidence conflicts or is insufficient; no verification claim is applied. |

### Business operating state — listing fact

Recommended controlled meanings:

- Operational
- Temporarily closed
- Permanently closed
- Moved
- Unknown/current evidence insufficient

An active company registration does not prove that a specific restaurant location is operational.

### Publication/scope state — implemented

The public-eligibility control uses:

| State | Public behaviour | Use |
| --- | --- | --- |
| `published` | Eligible for routes, search, filters, sitemap and structured data | In-scope listing with sufficient publication evidence |
| `pending-review` | Retained internally but withheld from normal public discovery | Identity, scope, status or important facts remain materially uncertain |
| `excluded` | Retained historically but not published | Confirmed out-of-scope, permanently closed without replacement, invalid import, or documented exclusion |

Moved, renamed, or duplicate records can require a published canonical successor and permanent redirect. Do not treat them as ordinary exclusions when an active replacement exists.

Current baseline: 3,159 `published`, 24 `pending-review`, and three `excluded`. Pending records retain a minimal, non-indexable route at their existing URL but are omitted from search, filters, maps, comparisons, shortlists, sitemaps, canonical metadata and LocalBusiness structured data. Excluded records are retained in canonical/history data and either redirect to a validated published successor or return 404. Publication state is deliberately separate from provenance, verification outcome and business operating status.

Every publication decision records the previous and next state, controlled reason, reviewer, reviewed timestamp, evidence references and notes. Direct manual edits to the materialized registry or ledger are prohibited.

## 6. Evidence hierarchy

Use the strongest available evidence and retain exact public URLs and timestamps.

### Tier 1 — first-party current evidence

- Official restaurant website, contact page or location page
- Official current menu, reservation or ordering page
- Direct owner/business correction containing verifiable evidence

Preferred for customer-facing name, contact details, cuisine, menu, hours, booking and ordering.

### Tier 2 — authoritative public records

- Food Standards Agency/FHRS
- Local-authority business, licensing, rates or food-establishment records
- Companies House, only for facts it actually establishes
- Other relevant official registries

Strong for legal identity, premises, postcode and establishment type. It may not prove customer-facing branding, current hours or current trading.

### Tier 3 — current transactional platforms

- Reputable booking platforms
- Current ordering/delivery platforms
- Current venue or shopping-centre directories

Use for corroboration. “Closed” or “unavailable” may describe only that platform and is not automatically permanent closure.

### Tier 4 — map and review profiles

Use cautiously with an exact access date. Do not bulk scrape or republish restricted data without an approved source/terms decision.

### Tier 5 — historical/import evidence

- Original CSV and Outscraper data
- Historical URLs and snapshots
- Existing unverified fields

This explains origin but cannot establish current truth.

### Evidence rules

- Inspect the actual source page; a search-result snippet alone is insufficient.
- Prefer two independent sources for closure, replacement, moved-location, duplicate or out-of-scope decisions.
- Record disagreements and limitations in proposal notes.
- Retain a dated snapshot summary for volatile API or live-page evidence.
- Never store secrets, private correspondence, personal data or tokens in evidence files.
- When evidence is unavailable or conflicting, use `needs-review`.

## 7. Program sequence

Run the deterministic queue before every batch:

```powershell
npm run report:verification-priority -- 50
```

It puts unresolved conflicts first, ensures operational-gap records outrank complete records, weights contact and hours heavily, caps the value proxy, and resolves ties by slug.

### V0 — publication and scope control — complete

`published`, `pending-review`, and `excluded` are implemented with guarded decisions, append-only history, safe import defaults, retained excluded records, successor validation, publication-aware derived files, public-surface enforcement, audits and tests.

### V1 — four current conflicts

Resolve or explicitly hold:

- `biriyani-junction`
- `chotiwala`
- `golis-south-norwood`
- `spikky-pepperdem-food`

Do not infer closure from FSA absence. Seek direct owner, registry, premises or first-party evidence. Once implemented, the recommended interim state is `pending-review`.

### V2 — 31 missing contact actions

Check identity and scope first, then website, phone, email, map, booking, ordering and menu actions.

### V3 — 128 missing-hours records

Use official/location pages first. Record seven days where supported, including `Closed` when stated. Do not store temporary holiday hours as the permanent weekly schedule.

### V4 — 491 missing-category records

Confirm scope before cuisine. Use official cuisine/menu wording and controlled taxonomy. Never infer Indian cuisine from a name, owner, address or historical inclusion.

This cohort is also where hotels, cinemas, shops, generic venues and other out-of-scope imports should be identified.

### V5 — 67 missing rating/review pairs

Approve a customer-rating source policy before bulk work. Update rating and review count together with a timestamp. Never copy an FSA hygiene score into customer-rating fields. If no approved reusable source exists, leave the pair blank, record the check, and omit the rating publicly.

Cohorts overlap. Rerun both audits after every batch because earlier work reduces later counts.

## 8. Per-listing procedure

For every listing:

1. Confirm slug, source/place ID, name, address and postcode.
2. Decide whether it is an in-scope restaurant location.
3. Check current identity and operating state.
4. Inspect Tier 1 evidence, then relevant corroboration.
5. Check the complete core scope even if the batch began from one gap:
   - name
   - address
   - postcode
   - business status
   - website
   - phone
   - opening hours
6. Check the cohort-specific fields.
7. Prepare a dated proposal under `docs/verification-evidence/`.
8. State what each source establishes and does not establish.
9. Select one decision-matrix outcome.
10. Dry-run the proposal and review event ID, previous values, changes and notes.
11. Apply only when evidence supports every change.
12. Confirm canonical and derived search/filter/shortlist data remain synchronized.

When verification evidence changes public eligibility, prepare a separate publication proposal from `docs/listing-publication-proposal-template.json`.

Publication dry run:

```powershell
npm run decide:listing-publication -- docs\verification-evidence\publication-proposal.json
```

Publication apply, after confirming the predicted count:

```powershell
npm run decide:listing-publication -- docs\verification-evidence\publication-proposal.json --write --expected-published-count=<count>
```

Dry run:

```powershell
npm run verify:listing -- docs\verification-evidence\proposal.json
```

Apply:

```powershell
npm run verify:listing -- docs\verification-evidence\proposal.json --write
```

## 9. Decision matrix

| Evidence result | Outcome | Canonical action | Publication recommendation |
| --- | --- | --- | --- |
| Current evidence supports checked facts | Verified | Record event; no change required | `published` |
| Current evidence supports corrections | Verified | Apply only supported changes | `published` if in scope |
| Checked field is not publicly provided | Verified with explicit note | Keep blank | `published` if not a launch safety requirement |
| Sources materially conflict | `needs-review` | No speculative change | `pending-review` |
| No source corroborates imported entity | `needs-review` | Do not infer closure | `pending-review` |
| Temporary closure confirmed | Verified correction | Set state and recheck date | Normally `pending-review` |
| Permanent closure confirmed | Verified correction | Preserve evidence/history | `excluded`, unless successor exists |
| Same entity moved or renamed | Verified/entity resolution | Update canonical and redirect retired URL if needed | Active canonical record `published` |
| Confirmed duplicate | Entity resolution | Merge through explicit alias rule; preserve redirect | Alias redirected; canonical published |
| Confirmed outside directory scope | Verified scope decision | Preserve provenance and reason | `excluded` |

## 10. Field rules

### Identity and location

- Prefer the current customer-facing name.
- Verify exact unit, address and postcode; same postcode does not prove same premises.
- Do not merge adjacent locations because names, phones or owners overlap.
- A moved location needs an entity decision, not a blind address overwrite.

### Operating state

- A live domain may be stale.
- Platform unavailability may be platform-specific.
- Permanent closure normally requires strong direct evidence or corroboration.

### Contact actions

- Normalize to HTTPS when the canonical HTTPS site works.
- Remove dead, hijacked, parked or identity-mismatched domains only with evidence.
- Confirm phone, email, map, booking, ordering and menu actions belong to the exact location.

### Opening hours

- Record what the source publishes and the access date.
- Use restaurant hours, not hotel/bar hours, for a restaurant listing.
- Do not present temporary event or bank-holiday hours as permanent weekly hours.

### Categories

- Use controlled taxonomy values already supported by routes and filters when possible.
- Add taxonomy only through an explicit reusable decision.
- Describe supported cuisine, not amenities, owner background or nearby businesses.

### Ratings and reviews

- Treat rating and review count as one dated pair.
- Never combine a rating from one platform with another platform’s count.
- Never convert hygiene, critic, award or inspection scores into customer ratings.
- Hide unsupported ratings instead of filling zeroes.

## 11. Batch procedure

Recommended size: **10–20 unique restaurants**.

1. Record queue snapshot and before-counts.
2. Fix the slug list; do not silently add unrelated records.
3. Research and retain evidence for every slug.
4. Prepare and dry-run all proposals before applying any.
5. Review conflicts and scope decisions.
6. Apply accepted proposals through the guarded command.
7. Rerun priority, operational and verification reports.
8. Run focused checks and the full suite in proportion to risk.
9. Run lint, TypeScript and `git diff --check`.
10. Build/export if public routes, filters, structured data or publication state changed.
11. Update the durable log with before/after metrics, failures and remaining items.
12. Commit the batch separately with its evidence.
13. Confirm a clean worktree before the next batch.

Suggested commit structure:

1. Schema/control implementation and tests.
2. Evidence-backed data batch and synchronized derived files.
3. Documentation and measured checkpoint.

Do not push or deploy without explicit authorization.

## 12. Required gates

```powershell
npm run report:verification-priority -- 50
npm run audit:listings
npm run audit:verification
npm run audit:publication
npm test
npm run lint
npm run typecheck
git diff --check
```

- Priority reporting is read-only and must succeed.
- The operational audit may stay `conditional` while medium long-tail gaps exist.
- The verification audit remains `not_ready` until high backlog/conflict thresholds are met. Record the expected non-zero result; never hide it.
- Ledger integrity, publication integrity, invalid canonical data, orphan events, duplicate slugs/place IDs, public leakage, or mismatched derived data are never acceptable.

When public/static output changes:

```powershell
npm run build:static
$env:NEXT_PUBLIC_SITE_URL='https://indianrestaurantlondon.co.uk'
npm run check:cloudflare
```

Creating `out/` does not authorize deployment; it remains excluded from Git.

## 13. Batch tracking template

Add each completed batch to `AUDIT-IMPLEMENTATION-LOG.md`:

```markdown
### YYYY-MM-DD — Phase 5 batch: title

**Cohort and scope**
- Queue snapshot:
- Slugs processed:
- Before counts:

**Evidence outcomes**
- Verified unchanged:
- Verified corrected:
- Checked but not publicly provided:
- Needs review:
- Closed/moved/renamed:
- Duplicate:
- Out of scope:

**Measured result**
- After counts:
- Verification coverage:
- Operational gaps:
- Publication-state changes:

**Verification**
- Dry runs:
- Audits:
- Tests/lint/typecheck:
- Build/export when required:
- Failures and corrections:

**Git checkpoint**
- Evidence/data commit:
- Documentation commit:

**Next exact batch**
- Cohort:
- Slugs/count:
- Open decisions:
```

## 14. Definition of done

The 608-record program is complete only when:

- Every original cohort record has a dated evidence outcome.
- Every published record has a supported identity, location and scope decision.
- Every remaining blank operational field is checked and documented, not merely untouched.
- No confirmed closed, duplicate, invalid or out-of-scope record appears as an ordinary operational restaurant.
- Moved/renamed/merged records preserve canonical identity and redirect history.
- Public ratings use an approved current source and retain their paired count and date.
- Unresolved conflicts are visible, owned and withheld under the approved publication policy.
- Canonical and derived datasets agree and ledger integrity passes.
- Relevant tests, lint, TypeScript, build and export checks pass.
- The implementation log records batch evidence, metrics, failures, fixes and commits.

Long-tail records without operational gaps can remain for a later verification program, but the production verdict must still disclose their unverified coverage.

## 15. Model and mode recommendation

For publication-state design, conflicts, duplicate/moved/closed decisions, taxonomy reconciliation and final reviews:

- **Model:** GPT-5.6 Sol
- **Reasoning:** High
- **Mode:** Plan mode for publication/scope design and ambiguous schema decisions; Default mode for an approved mechanical batch

High reasoning is appropriate for assumptions and edge cases. Medium is suitable for later straightforward batches once controls are stable. Extra High is optional for unusually ambiguous, high-impact conflicts, not required for every batch.

Official references:

- [Codex best practices](https://learn.chatgpt.com/guides/best-practices.md)
- [Codex models](https://learn.chatgpt.com/docs/models)

## 16. Exact next sequence

1. Start the published missing-hours cohort with `premier-inn-london-blackfriars-fleet-street-hotel`, `premier-inn-london-edgware-hotel`, `premier-inn-london-harrow-hotel`, `everyman-maida-vale`, `premier-inn-london-hendon-the-hyde-hotel`, `premier-inn-london-dagenham-hotel`, `chaiwrap`, `east-india-club`, `the-hornbeam-community-centre-cic`, and `three-falcons-hotel-and-pub`.
2. Confirm restaurant-directory scope and exact restaurant identity before applying venue-level opening hours to hotel, cinema, club or community-centre records.
3. Keep the 24 current `pending-review` records in the explicit conflict queue and revisit them only when stronger evidence is available.
4. Record verification and publication decisions separately through their guarded commands.
5. Continue missing hours, categories and ratings in order, refreshing counts after every batch.
6. Use import dry runs and expected-count guards; every genuinely new import begins as `pending-review`.
7. Keep Google/Outscraper media restoration separate and on hold.
8. Do not deploy without explicit authorization.

## Related references

- `AUDIT-IMPLEMENTATION-LOG.md`
- `AUDIT-REMEDIATION-PLAN.md`
- `docs/listing-verification-workflow-2026-07-16.md`
- `docs/listing-quality-baseline-2026-07-15.md`
- `docs/listing-media-policy-2026-07-16.md`
- `docs/directory-import-provenance.md`
