# Deployment artifact handoff implementation plan — 2026-08-06

## Status and boundary

This plan translates the final deployment-performance audit into staged engineering work. Phase 1 implements only a cross-platform provenance fix and a **non-production** artifact evidence foundation. It does not upload an Actions artifact, change the production publisher's control flow, call Cloudflare, or authorize production deployment.

The target is to build, validate, benchmark, attest, approve, and deploy one exact immutable artifact without weakening the guarded release controls.

## Official-platform verification status

The implementation attempted to retrieve the current official documentation through the browsing tool and direct HTTPS requests. The environment returned HTTP 401/403 responses for all requested official pages, so no changing GitHub quota, retention maximum, or Cloudflare platform limit is asserted as newly verified here.

Official sources that must be rechecked during the non-production transfer spike:

- [GitHub: Store and share data with workflow artifacts](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)
- [GitHub `actions/upload-artifact`](https://github.com/actions/upload-artifact)
- [GitHub `actions/download-artifact`](https://github.com/actions/download-artifact)
- [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Cloudflare Pages CI Direct Upload](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)
- [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/)

The project-pinned Wrangler 4.111.0 CLI was verified locally. `wrangler pages deploy [directory]` accepts the directory plus `--project-name`, `--branch`, `--commit-hash`, `--commit-message`, and `--commit-dirty`. Those are the same provenance fields used by the guarded publisher. No deploy command was run.

Before enabling Actions transfer, a maintainer must record from current official documentation and a private non-production experiment:

1. action versions pinned by full commit;
2. maximum artifact size and repository storage quota;
3. default and allowed retention periods;
4. compression controls and observed compressed size;
5. artifact immutability/overwrite behavior;
6. upload outputs, including ID, URL, and digest behavior;
7. download digest verification behavior;
8. permissions needed for same-run, cross-job, and cross-run download;
9. behavior for expired, deleted, or unavailable artifacts;
10. private-repository access boundaries;
11. current Cloudflare file-count and per-file limits; and
12. current Direct Upload caching/deduplication behavior.

## Trust model

### Trusted inputs

- full protected-branch commit from a fresh checkout;
- locked dependencies and pinned actions/tools;
- both required successful checks for the exact commit;
- deterministic static output using the commit as `NEXT_BUILD_ID`;
- per-file SHA-256 manifest and aggregate manifest SHA-256;
- explicit operator approval naming commit, artifact hash, target, and rollback deployment;
- freshly verified Cloudflare account/project/production metadata; and
- Cloudflare deployment history after the upload attempt.

### Untrusted inputs

- an arbitrary local `out/` directory;
- an artifact name without its immutable ID/digest and internal manifest;
- evidence JSON supplied by an untrusted filesystem without expected commit/branch/URL values;
- mutable branch names without the full commit;
- raw action outputs copied from an unrelated run;
- expired or missing candidate evidence; and
- Wrangler exit output without deployment-history reconciliation.

### Separation of evidence

The foundation creates a **candidate evidence document**, not production authority. It deliberately uses purpose `non-production-candidate`. A later production approval envelope must separately bind:

- candidate evidence digest;
- exact required GitHub check run IDs and conclusions;
- artifact service ID/digest;
- approval identity and timestamp;
- Cloudflare project/branch/URL;
- confirmed rollback deployment; and
- permitted release attempt.

The current publisher does not consume candidate evidence, so adding the foundation cannot bypass existing production checks.

## Candidate evidence contract (schema version 1)

`release-candidate.json` contains:

```json
{
  "schemaVersion": 1,
  "purpose": "non-production-candidate",
  "source": {
    "branch": "main",
    "commit": "<40-character lowercase SHA>"
  },
  "build": {
    "buildId": "<same commit SHA>",
    "productionUrl": "https://indianrestaurantlondon.co.uk"
  },
  "artifact": {
    "aggregateSha256": "<hash of deterministic per-file manifest>",
    "fileCount": 7385,
    "manifestFile": "artifact-manifest.sha256",
    "manifestSha256": "<hash of retained manifest bytes>",
    "totalBytes": 1104277536
  },
  "validity": {
    "createdAt": "<ISO-8601>",
    "expiresAt": "<ISO-8601>"
  }
}
```

The retained `artifact-manifest.sha256` contains one SHA-256 and normalized relative path per file. Verification recomputes every file hash and checks externally expected commit, branch, URL, and verification time.

### Local non-production usage

```powershell
$commit = git rev-parse HEAD
$createdAt = (Get-Date).ToUniversalTime().ToString("o")
$expiresAt = (Get-Date).ToUniversalTime().AddDays(7).ToString("o")

npm run create:release-candidate -- `
  --artifact=out `
  --evidence-directory=.codex-local/release-candidate `
  --branch=main `
  --commit=$commit `
  --production-url=https://indianrestaurantlondon.co.uk `
  --created-at=$createdAt `
  --expires-at=$expiresAt

$verifiedAt = (Get-Date).ToUniversalTime().ToString("o")
npm run verify:release-candidate -- `
  --artifact=out `
  --evidence-directory=.codex-local/release-candidate `
  --branch=main `
  --commit=$commit `
  --production-url=https://indianrestaurantlondon.co.uk `
  --verified-at=$verifiedAt
```

These commands only create or verify local evidence. They do not contact GitHub or Cloudflare. The evidence directory must remain outside `out/` so candidate metadata cannot modify the artifact it describes.

## Expiry and missing-artifact behavior

- Expired evidence fails closed.
- Missing evidence fails closed.
- Missing retained manifest fails closed.
- Missing artifact directory fails closed.
- Any changed, added, or removed artifact file fails manifest comparison.
- Wrong commit, branch, build ID, or production URL fails closed.
- Unsupported schema or purpose fails closed.
- A future production publisher must never rebuild automatically after these failures; it must require a new candidate and approval.

Candidate expiry is independent of GitHub retention. The eventual workflow must choose an evidence expiry no later than the actual artifact retention deadline and verify availability before requesting approval.

## Approval flow target

1. A trusted CI job checks out the exact commit and builds with that commit as build ID.
2. CI validates Cloudflare constraints, payload budgets, and the rendered benchmark against that output.
3. CI creates the manifest and candidate evidence.
4. CI uploads `out/`, the manifest, and candidate evidence as one immutable logical candidate, recording artifact service identity/digest.
5. Both required checks finish successfully.
6. A separate preflight retrieves the exact candidate by immutable identity, verifies service digest plus internal evidence, and displays the commit/hash/target/rollback tuple.
7. The operator approves that exact tuple.
8. The guarded publisher retrieves the same candidate, repeats verification against externally supplied expectations, refreshes GitHub and Cloudflare state, and uploads once.
9. Deployment history is reconciled exactly as today; an indeterminate result is never retried automatically.

## Rollback and indeterminate uploads

Artifact handoff changes only how upload bytes arrive. It must not change:

- selection of the current successful production deployment as rollback target;
- explicit rollback confirmation;
- unique release-attempt marker;
- exact commit/project/branch/status matching;
- refusal to accept multiple matching new deployments;
- recording a verified deployment even if Wrangler exits after Cloudflare succeeds; or
- the prohibition on automatic retry after an indeterminate attempt.

If artifact retrieval or verification fails before upload, no Cloudflare operation occurs. If upload begins, the existing deployment-history reconciliation remains authoritative.

## Files and staged implementation

### Phase 1 — implemented foundation

- `scripts/source-snapshot-hash.ts`: canonical historical CSV hashing.
- `scripts/source-snapshot-hash.test.ts`: LF/CRLF and mutation coverage.
- Historical backfill commands and tests: use the canonical helper without changing source data or expected provenance.
- `scripts/release-artifact-manifest.ts`: reusable deterministic manifest implementation extracted from the publisher.
- `scripts/release-artifact-evidence.ts`: versioned candidate contract and fail-closed validation.
- `scripts/release-artifact-candidate.ts`: local create/verify CLI.
- Artifact evidence and CLI tests.
- `package.json`: non-production create/verify commands.

### Phase 2 — non-production Actions spike

**Implementation status:** Workflow and local safety checks added; no GitHub Actions run has yet been authorized or performed.

- `.github/workflows/artifact-handoff-spike.yml` is manual-dispatch only, uses a read-only token, and contains no secrets or Cloudflare commands.
- It builds the static candidate, creates internal evidence, uploads it through a full-commit-pinned artifact action, downloads by immutable artifact ID in a separate job, and verifies the downloaded tree.
- The spike uses seven-day retention and no compression so the first run can record the uncompressed transfer cost without an uncontrolled compression variable.
- `scripts/release-artifact-candidate.test.ts` exercises wrong commit and tampered-tree failures locally. The first authorized Actions run must record service ID, service digest, URL, size, retention, upload/download/verification time, and the action's own digest-verification result.
- Expired/deleted artifact and wrong-ID behavior remain deliberately unexercised until an uploaded candidate exists; they must be tested only against the disposable spike artifact, never a production candidate.

### Phase 3 — approval envelope

**Implementation status:** Local contract and adversarial validation added; it is intentionally not connected to the publisher.

- `scripts/release-approval-envelope.ts` binds the exact `main` commit, both successful required check IDs, immutable artifact ID, service digest, aggregate artifact hash, candidate-evidence hash, target, current rollback deployment, approver identity, and expiry.
- The approval may not outlive the candidate; a changed commit, check, artifact, rollback target, digest, target, or expired approval fails closed.
- `scripts/release-approval-envelope.test.ts` covers a valid approval plus wrong artifact, wrong check commit, duplicate check, changed rollback target, and expiry failures.
- The current publisher remains on its existing local rebuild path. Phase 4 must separately retrieve the artifact and invoke this validation before any Cloudflare write.

### Phase 4 — guarded publisher migration (not implemented)

- Add an explicit artifact-source mode without removing the legacy rebuild path.
- Retrieve and verify candidate before any Cloudflare API write.
- Run a credential-free dry run and a Cloudflare preview/non-production exercise.
- Require separate approval before production activation.

### Phase 5 — cleanup and optional CI parallelism (not implemented)

- Remove duplicated rebuild behavior only after measured production-equivalent validation.
- Retain a documented rollback to the legacy rebuild path.
- Evaluate CI parallelism independently.

## Testing strategy

### Provenance

- LF and CRLF versions hash identically to the recorded historical digest.
- Any non-newline content change changes the digest.
- Both historical backfill commands validate on Linux and Windows.
- Complete suite passes cross-platform.

### Candidate contract

- deterministic manifest;
- valid creation and verification;
- wrong commit/branch/URL;
- changed/added/removed file;
- changed retained manifest;
- malformed evidence;
- unsupported schema/purpose;
- expired evidence;
- missing artifact/evidence/manifest; and
- CLI create/verify behavior.

### Future Actions spike

- service digest plus internal manifest verification;
- same-run and approved cross-run access;
- private-repository permission denial;
- expiry/deletion handling;
- measured upload/download/compression; and
- no production deployment permissions in the spike job.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Artifact too large or slow for Actions | Measure before workflow adoption; retain legacy rebuild path. |
| Artifact service digest differs from file-tree identity | Keep internal deterministic manifest authoritative and verify both. |
| Evidence JSON is substituted | Require external expected commit/branch/URL and later bind immutable service identity. |
| Candidate expires after approval | Make approval expiry no later than retention and recheck immediately before upload. |
| CI artifact permissions are too broad | Use least-privilege `actions: read`, protected environments, and pinned actions. |
| Publisher migration weakens safeguards | Add artifact mode alongside legacy path; remove nothing until equivalence is proven. |
| Cross-platform archive extraction changes paths/modes | Manifest normalized paths and exact extracted-file verification; test Windows/Linux. |
| Operator retries an indeterminate upload | Preserve current no-retry reconciliation path unchanged. |

## Rollback plan

Phase 1 rollback is a normal code revert; production behavior is unchanged. Later phases must keep the current rebuild-based publisher available until the exact-artifact path completes a production-equivalent dry run. If retrieval, evidence, permissions, performance, or verification is unsatisfactory, disable artifact mode and return to the guarded rebuild flow without changing Cloudflare state.

## Exit criteria before production implementation

- Current official GitHub and Cloudflare documentation recorded with access date.
- Candidate upload/download succeeds within agreed time and storage limits.
- Service and internal digests both verify.
- Expired, missing, cross-run unauthorized, and tampered candidates fail closed.
- Required checks and approval are cryptographically/logically bound to the candidate.
- Existing rollback and indeterminate-upload tests pass unchanged.
- Production-equivalent dry run demonstrates expected savings.
- Maintainer explicitly approves activation.
