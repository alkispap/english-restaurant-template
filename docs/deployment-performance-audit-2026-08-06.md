# Deployment performance audit — 2026-08-06

> **Status: historical audit.** This report measured the former Cloudflare Pages Direct Upload process on 2026-08-06. It is retained for its timing evidence, but it is not a release runbook. Since 2026-08-12, normal releases use [release-process.md](release-process.md): GitHub merge → Cloudflare Workers Builds → Worker deployment.

## Executive summary

The review confirmed the initial assumption: the release is slow primarily because safe, expensive work is repeated, not because it contains many individually useless checks.

The former documented manual release ran the complete check, regular-build, and static-build sequence during `check:release`, obtained approval for the resulting artifact hash, and then repeated that sequence during `publish:cloudflare`. The controlled model attributes approximately **17 minutes 47 seconds** to this pre-upload path. A historical repository record reports another **18 minutes 25 seconds** for Wrangler upload/deploy.

Representative post-merge GitHub Actions run `30497304870` took **9 minutes 2 seconds**. A second successful run for pull request #40 produced job totals within seven seconds of the first run; the sum of its two job durations was only three seconds lower. Combining measured CI, modeled manual work, and historical upload gives a post-merge path of approximately **45 minutes 14 seconds**, excluding approval, Cloudflare metadata calls, reconciliation, and live checks. Including a comparable pre-merge pull-request workflow brings the change-to-production path toward **54 minutes 16 seconds**.

The static export is also unusually large: the deterministic commit build produced **3,648 pages, 7,385 files, and 1,104,277,536 bytes**. Restaurant routes account for 3,176 HTML pages and approximately 914 MB. HTML and React Server Component (RSC) payloads make up approximately 99.3% of raw output.

The recommended target is to **build, validate, benchmark, attest, approve, and deploy one exact immutable artifact**. This can remove most of the 17m 47s repeated pre-upload computation while retaining the existing commit, approval, project, rollback, artifact-hash, no-retry, and reconciliation protections. CI-job parallelization is a secondary opportunity; page-output reduction should be a separate later project.

## Scope and constraints

The audit included:

- cold and warm dependency/build behavior;
- regular and static Next.js builds;
- generated routes and artifact composition;
- representative restaurant HTML/RSC analysis;
- test-worker scaling and slow tests;
- the two existing snapshot failures;
- payload, redirects, artifact validation, traversal, and hashing;
- release-script expansion and duplicate work;
- PowerShell, Windows, and browser limitations;
- documentation consistency;
- release safeguards;
- historical Cloudflare upload evidence;
- two representative Actions runs; and
- end-to-end critical-path modeling.

The audit did **not** deploy, upload, request secrets, change release behavior, update snapshot expectations, or make the private repository public.

### Evidence labels

- **Measured:** observed during this audit or shown in the supplied Actions screenshots.
- **Modeled:** arithmetic using measured stages rather than a single end-to-end execution.
- **Historical:** recorded in a prior dated repository report.
- **Inferred:** supported by code/output evidence but not directly isolated.
- **Unknown:** requires a future non-production implementation experiment.

## Audit environment

| Item | Value |
| --- | --- |
| Local OS | Ubuntu 24.04.4 LTS, Linux 6.12.13, ext4 |
| CPU | 3 logical CPUs, Intel Xeon Platinum 8370C @ 2.80 GHz |
| Memory | 17 GiB, no swap |
| Node.js | 24.15.0 |
| npm | 11.4.2 |
| Next.js | 15.5.21 |
| Wrangler | 4.111.0 |
| Measured commit | `c1736caaeaf83477d3050d4fa559fb6f84758042` |
| Actions platform | `windows-latest`, Node 24 |

Ignored `.next/` and `out/` directories were removed only between controlled scenarios. Raw logs were kept outside tracked source.

## Dependency installation

- A populated-cache `npm ci` completed in 25.58 seconds during the initial baseline and approximately 17 seconds during restoration.
- Both Actions jobs independently reconstructed dependencies in 29 and 28 seconds.
- An empty-cache local attempt did not complete after approximately ten minutes because of the audit environment's network behavior. It was terminated and is not treated as a cold-install result.
- `actions/setup-node` caches npm downloads, not a ready `node_modules`; the second job therefore retains an installation cost.

## Controlled build matrix

All builds passed. Times include the package script's payload audit.

| Scenario | Wall time | User CPU | System CPU | Max RSS | Generated pages |
| --- | ---: | ---: | ---: | ---: | ---: |
| Regular cold | 89.61s | 111.43s | 33.90s | 1.21 GiB | 28 |
| Regular warm | 86.01s | 105.73s | 28.93s | 1.32 GiB | 28 |
| Regular before static | 85.75s | 115.07s | 24.31s | 1.34 GiB | 28 |
| Static cold | 215.76s | 306.40s | 48.23s | 1.25 GiB | 3,648 |
| Static warm | 212.83s | 298.36s | 44.74s | 1.25 GiB | 3,648 |
| Static after regular | 206.72s | 294.85s | 37.50s | 1.23 GiB | 3,648 |
| Static fixed-ID, first | 217.98s | 313.63s | 40.77s | 1.22 GiB | 3,648 |
| Static fixed-ID, second | 209.88s | 296.66s | 39.31s | 1.26 GiB | 3,648 |

### Build findings

1. A warm regular build saved only 3.60 seconds end to end.
2. A warm static build saved only 2.93 seconds.
3. Running regular before static saved about 9.04 seconds from static generation but cost 85.75 seconds itself.
4. Regular plus static took 292.47 seconds, **76.71 seconds more than cold static alone**.
5. Compilation was similar across modes at approximately 26.6–29.2 seconds; the static build's extra cost follows compilation while producing thousands of routes and files.
6. `.next` reached approximately 1.55 GB after export, versus approximately 435–450 MB after a regular build.

### Deterministic artifact

Two consecutive static builds with `NEXT_BUILD_ID` set to the same commit produced exactly:

| Field | Result |
| --- | --- |
| Aggregate SHA-256 | `fa1c632a38af33fa0f1703675c16ff67f42bf8bb1d25606fea20a680a56cecad` |
| Files | 7,385 |
| Bytes | 1,104,277,536 |

This proves reproducibility on the audit host and supports an exact-artifact handoff design. It does not by itself solve storage, transfer, retention, or authorization.

## Static route inventory

`NEXT_STATIC_EXPORT=1` enables full parameter generation. The restaurant route maps every publicly routable listing to a static slug.

| Route family | HTML pages |
| --- | ---: |
| Restaurants | 3,176 |
| Neighborhoods | 203 |
| Areas, including area/category routes | 195 |
| Categories | 24 |
| Guides | 9 |
| Best searches | 7 |
| Offerings | 5 |
| Dietary | 4 |
| Services | 4 |
| Types | 4 |
| Compatibility listings | 2 |
| Other HTML | 15 |
| **Generated pages** | **3,648** |

Per-family generation time was not instrumented because the audit did not change rendering behavior.

## Artifact analysis

### File types

| Type | Files | Raw bytes | gzip level-6 bytes | Raw share |
| --- | ---: | ---: | ---: | ---: |
| HTML | 3,643 | 744,151,362 | 94,821,103 | 67.4% |
| RSC `.txt` | 3,642 | 352,036,751 | 51,257,332 | 31.9% |
| WebP | 29 | 2,701,956 | 2,703,378 | 0.24% |
| JSON | 1 | 2,533,706 | 566,982 | 0.23% |
| JavaScript | 57 | 2,099,811 | 645,238 | 0.19% |
| Other | 14 | 592,895 | less than 61 KB | less than 0.1% |

HTML and RSC total approximately 99.3% of raw output. Their combined gzip size is approximately 146 MB, showing high textual compressibility; this does not establish Wrangler's wire bytes.

### Route-family size

| Family | Files | HTML pages | Raw bytes |
| --- | ---: | ---: | ---: |
| Restaurants | 6,352 | 3,176 | 913,850,117 |
| Areas | 390 | 195 | 80,037,903 |
| Neighborhoods | 406 | 203 | 77,837,878 |
| Categories | 48 | 24 | 10,920,539 |
| Best | 14 | 7 | 3,463,309 |
| Remaining output | 175 | 38 | approximately 18 MB |

Exact hashing found only five duplicate groups, 22 extra files, and 66,698 duplicate bytes. Ordinary duplicate files do not explain the size; distinct route documents repeat structure and data.

## Restaurant page analysis

| Metric | HTML + RSC bytes |
| --- | ---: |
| Minimum | 40,673 |
| Median | 293,206 |
| Mean | 287,691 |
| P95 | 333,661 |
| Maximum | 375,107 |

Average restaurant output is 194,104 bytes of HTML plus 93,587 bytes of standalone RSC. At the current shape, each additional routable restaurant adds approximately two files and 288 KB raw.

| Representative | HTML | RSC | Combined | Visible text chars | Tags | Links |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `taj` (minimum) | 26,680 | 13,993 | 40,673 | 1,369 | 161 | 38 |
| `reesa-london` (median) | 198,453 | 94,753 | 293,206 | 5,721 | 911 | 130 |
| `yogi-s-...-kensington` (P95) | 224,843 | 108,818 | 333,661 | 7,974 | 966 | 150 |
| `dishoom-covent-garden` (maximum) | 252,197 | 122,910 | 375,107 | 8,118 | 1,076 | 191 |

JSON-LD contributed only about 2.0–2.7 KB in normal samples. For all four representatives, decoding and concatenating the HTML's `self.__next_f.push(...)` chunks produced a string exactly equal to the standalone `index.txt` payload. Next.js therefore embeds the full route payload for hydration and stores it separately for navigation. The standalone 352 MB RSC set cannot be assumed safely deletable.

## Test runner and snapshot audit

The runner discovers 166 `*.test.ts` files, launches each as a separate Node/TSX process, and defaults to four workers.

| Workers | Wall time | Sum test time | Effective parallelism | Median | P95 | Maximum |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 211.02s | 210.90s | 1.00× | 0.740s | 3.62s | 4.81s |
| 2 | 113.29s | 225.47s | 1.99× | 0.665s | 4.11s | 6.00s |
| 4 | 121.36s | 481.16s | 3.96× | 1.625s | 8.92s | 12.46s |
| 8 | 126.36s | 991.92s | 7.85× | 3.085s | 17.57s | 27.20s |

Two workers were locally fastest, but the representative Windows run completed the current four-worker suite in only 46 seconds. A Windows comparison is required before changing the default.

### Linux snapshot failures

`listing-media-registry.test.ts` and `listing-provenance-backfill.test.ts` hash `data/Indian Restaurants - Outscraper - Test.csv` as raw bytes.

| Representation | SHA-256 |
| --- | --- |
| Current Linux checkout (LF) | `cb5ef566ab3476fb66c5c860dd4ef10740be3c76ad321a091f76d74718e655b5` |
| Git object at recorded commit (LF) | `cb5ef566ab3476fb66c5c860dd4ef10740be3c76ad321a091f76d74718e655b5` |
| Same content normalized to CRLF | `3b7985768ff080490fb27767371979bd181ec1afb9ad4a1c40cf2219916d262d` |

The expected provenance hash is exactly the CRLF representation. The CSV did not change; the contract is line-ending dependent. The Windows Actions suite passed, confirming platform dependence. No data or expectation was changed by this audit.

## Small operation costs

| Operation | Time |
| --- | ---: |
| List 7,385 files | 0.143s |
| `stat` all files | 0.027s |
| Read 1.104 GB from warm cache | 0.320s |
| SHA-256 each file in Python | 4.320s |
| Publisher artifact manifest | 5.223s |
| Cloudflare export validation | 1.216s |
| Payload audit | 0.781s |
| Redirect generation | 0.755s |

These operations are sometimes duplicated but are not meaningful targets compared with builds, tests, benchmark, and upload. Production's second manifest costs about five seconds and provides a valuable unchanged-artifact guarantee.

## Release graph and duplicate work

The authoritative manual flow is:

```text
fresh main checkout
  -> npm ci
  -> check:release
  -> record artifact hash and obtain approval
  -> publish:cloudflare with exact confirmations
  -> verify live release
```

Both checks-only and production publish call:

```text
typecheck -> test -> lint -> dependency/publication/freshness/SEO/indexation/link/template audits
  -> regular build + payload audit
  -> prepare:cloudflare
       -> redirects -> static build + payload audit -> artifact checks
  -> artifact manifest
```

Production then validates the approved hash and hashes the artifact again immediately before upload.

| Operation | PR CI | Main CI | `check:release` | Publish |
| --- | ---: | ---: | ---: | ---: |
| `npm ci` | 2 jobs | 2 jobs | fresh checkout | normally reused |
| Tests/lint/typecheck/audits | 1 | 1 | 1 | 1 |
| Regular build | 1 | 1 | 1 | 1 |
| Static build | 1 | 1 | 1 | 1 |
| Artifact validation | 1 | 1 | 1 | 1 |
| Browser benchmark | 1 | 1 | 0 | 0 |
| Manifest | 0 | 0 | 1 | 2 |

## Representative GitHub Actions run

Run `30497304870` was a successful `push` run for merge commit `c1736ca...` on `main`. Because the repository is private, evidence came from authenticated GitHub job-summary screenshots supplied by the repository owner, not shared credentials.

### Fast quality gate

| Step | Duration |
| --- | ---: |
| Checkout | 9s |
| Node setup | 11s |
| `npm ci` | 29s |
| Tests | 46s |
| ESLint | 17s |
| TypeScript | 13s |
| Dependency policy | 3s |
| Publication integrity | 2s |
| SEO and crawl policy | 21s |
| Template readiness | 1s |
| Regular build | 48s |
| Source-clean check | 1s |
| Post steps | 3s |
| **Job total** | **3m 25s** |

The regular build and tests are the two largest steps, followed by install and SEO/crawl policy.

### Static export and benchmark

| Step | Duration |
| --- | ---: |
| Setup | 1s |
| Checkout | 8s |
| Node setup | 9s |
| `npm ci` | 28s |
| Static export | 2m 14s |
| Artifact validation | 2s |
| Rendered benchmark | 2m 21s |
| Source-clean check | 1s |
| Post steps | 2s |
| **Job total** | **5m 28s** |

The benchmark consumes approximately 43% of this job and the static export approximately 41%; together they account for about 84%.

### Workflow critical path

| Field | Duration |
| --- | ---: |
| Fast gate | 3m 25s |
| Dependent static job | 5m 28s |
| Inter-job/summary overhead | approximately 9s |
| **Workflow** | **9m 2s** |

The local-equivalent estimate was 9m 11s; the real workflow differed by only nine seconds overall.

### Second successful run: pull request #40

The second supplied run was the successful `Fix active filter badge contrast` pull-request run. Its run ID and workflow-summary total were not included in the screenshots, so the audit records the displayed job and step durations without inventing the missing fields.

#### Fast quality gate comparison

| Step | Main push | PR #40 | Difference |
| --- | ---: | ---: | ---: |
| Setup | 0s | 1s | +1s |
| Checkout | 9s | 8s | -1s |
| Node setup | 11s | 12s | +1s |
| `npm ci` | 29s | 28s | -1s |
| Tests | 46s | 51s | +5s |
| ESLint | 17s | 15s | -2s |
| TypeScript | 13s | 13s | 0s |
| Dependency policy | 3s | 3s | 0s |
| Publication integrity | 2s | 2s | 0s |
| SEO and crawl policy | 21s | 20s | -1s |
| Template readiness | 1s | 2s | +1s |
| Regular build | 48s | 47s | -1s |
| Source-clean check | 1s | 1s | 0s |
| Post steps | 3s | 3s | 0s |
| **Job total** | **3m 25s** | **3m 29s** | **+4s (+2.0%)** |

#### Static job comparison

| Step | Main push | PR #40 | Difference |
| --- | ---: | ---: | ---: |
| Setup | 1s | 1s | 0s |
| Checkout | 8s | 9s | +1s |
| Node setup | 9s | 11s | +2s |
| `npm ci` | 28s | 28s | 0s |
| Static export | 2m 14s | 2m 19s | +5s |
| Artifact validation | 2s | 1s | -1s |
| Rendered benchmark | 2m 21s | 2m 7s | -14s |
| Source-clean check | 1s | 1s | 0s |
| Post steps | 2s | 2s | 0s |
| **Job total** | **5m 28s** | **5m 21s** | **-7s (-2.1%)** |

#### Two-run stability

| Metric | Main push | PR #40 | Two-run mean | Range |
| --- | ---: | ---: | ---: | ---: |
| Fast gate | 205s | 209s | 207s | 4s |
| Static job | 328s | 321s | 324.5s | 7s |
| Sum of job durations | 533s | 530s | 531.5s | 3s |
| Tests | 46s | 51s | 48.5s | 5s |
| Regular build | 48s | 47s | 47.5s | 1s |
| Static export | 134s | 139s | 136.5s | 5s |
| Benchmark | 141s | 127s | 134s | 14s |

The two runs are highly consistent at job level: the fast gate varied by 2.0%, the static job by 2.1%, and the combined job durations by 0.6%. The browser benchmark had the largest individual range at 14 seconds (10.4% of its two-run mean), but that variation was offset by other steps. The second run therefore strengthens the timing baseline and does not change the architectural recommendation or expected order of magnitude of savings.

## End-to-end model

| Stage | Duration | Evidence |
| --- | ---: | --- |
| Post-merge Actions | 9m 2s | Measured |
| Fresh install + checks-only + publish before upload | 17m 47s | Modeled from local measurements |
| Wrangler upload/deploy | 18m 25s | Historical |
| **Post-merge through deployment** | **45m 14s** | Mixed evidence |

Approval, Cloudflare API calls, reconciliation, and live verification are excluded. Adding a comparable pre-merge workflow yields approximately 54m 16s before those costs.

## Documentation consistency

| Document | Finding |
| --- | --- |
| `docs/release-process.md` | Current authoritative GitHub-to-Cloudflare Workers process. |
| `docs/website-change-rules.md` | Points to the current release process. |
| `AUDIT-IMPLEMENTATION-LOG.md` | Explains why weak/raw deployment was replaced. |
| `docs/pagespeed-performance-report-2026-06-19.md` | Valuable historical timing, but its raw-upload advice is superseded. |

The historical report retains its measurement but receives a superseded notice in this audit change.

## Safeguards that must be preserved

Any implementation must retain or equivalently replace:

1. fresh isolated checkout and locked dependencies;
2. protected `main` only;
3. full commit confirmation;
4. HEAD/local/remote `main` agreement;
5. clean worktree checks;
6. both exact successful required checks;
7. pinned local Wrangler;
8. exact account, project, branch, and production URL;
9. explicit production, commit, artifact, and rollback approval;
10. deterministic manifest and SHA-256;
11. unchanged-artifact verification;
12. immediate pre-upload revalidation;
13. unique release-attempt marker;
14. no automatic retry after indeterminate upload;
15. exact deployment reconciliation; and
16. sanitized evidence and live verification.

Raw upload of an ignored local `out/` directory is not an acceptable optimization.

## Options considered

### A. Conservative de-duplication

Trust exact successful GitHub checks instead of rerunning source checks locally, and prove whether the regular non-export build has unique coverage.

- Potentially removes about 7m 21s of repeated source checks and 2m 52s of repeated regular builds in the controlled two-pass model.
- Retains local static reproduction unless artifact identity crosses approval.
- Low-to-medium risk if exact check verification remains mandatory.

### B. Parallel CI jobs

Start the fast and static jobs together while requiring both to pass.

- Representative potential: approximately 3m 34s, moving 9m 2s toward the 5m 28s slower job plus startup variation.
- Correctness can remain unchanged.
- Consumes more runner time when the fast gate fails.

### C. Build once, attest, approve, deploy exact bytes

Build the static candidate once, validate and benchmark it, create its manifest, retain it immutably, approve that identity, and deploy those exact bytes without rebuilding.

- Removes most of the modeled 17m 47s manual pre-upload path.
- Makes CI validation and production deployment refer to the same bytes.
- Medium implementation complexity because the 1.1 GB raw artifact requires storage, compression, retention, transfer, tamper, and authorization validation.
- Can preserve all existing release safeguards.

### D. Reduce static output

Reduce per-listing markup/RSC while preserving SEO, accessibility, hydration, and functionality.

- May reduce build and the historically dominant upload.
- Higher product/SEO risk than workflow-only changes.
- Framework-emitted standalone RSC must not simply be deleted.

### E. Test-worker tuning

- Two workers were locally fastest.
- The existing Windows run completed tests in 46 seconds with four workers.
- No Windows evidence currently justifies changing the default.

## Final recommendation

Use **Option C as the target architecture**, preceded by a non-production artifact-handoff spike. Combine it with **Option B** if additional CI compute is acceptable. Do not begin with test tuning or page-output changes.

Implementation order for a future, separately approved change:

1. Define an immutable evidence contract containing commit, build ID, file count, bytes, file hashes, aggregate SHA-256, required checks, and build metadata.
2. Test storage, compression, retention, and transfer of the current artifact without production deployment.
3. Make CI generate, validate, benchmark, attest, and retain the exact candidate.
4. Make checks-only approval approve that retained identity instead of reproducing it.
5. Make the guarded publisher verify and upload the exact approved artifact without rebuilding.
6. Preserve all target, rollback, no-retry, and reconciliation controls.
7. Perform a non-production dry run and publish before/after evidence.
8. Then evaluate parallel CI and unique regular-build coverage.
9. Treat output-size reduction as a later SEO/functional project.

### Expected result

Removing most of the 17m 47s repeated manual work moves the modeled post-merge path from **45m 14s toward 27m 27s** before artifact-transfer overhead: a theoretical **17m 47s, or 39%**, reduction. Parallel CI offers a further representative target of about 3m 34s.

These are targets, not guarantees. A later implementation is successful only if before/after measurements improve and every safeguard remains enforceable.

## Implementation foundation status

The former non-production artifact-handoff experiment and its manually dispatchable GitHub workflows were retired with the Pages Direct Upload workflow. Its code-level provenance work remains available in the repository, but it is not part of the current release process.

Current official GitHub Actions and Cloudflare documentation could not be fetched from the audit environment because the available network paths returned authorization/403 responses. No changing platform quota is treated as verified. Artifact upload/download integration remains gated on an official-documentation review and a credential-free non-production transfer experiment with the current 1.1 GB export.

Before this foundation, the Linux suite reported 164/166 passing because two historical snapshot checks hashed Git's LF worktree bytes against the original CRLF digest. After canonical newline hashing and three new artifact/provenance test files, the complete Linux suite passed **169/169** in **4m 35.64s**. This comparison records correctness, not a performance improvement: the suite grew and host contention differed from the earlier timing run.

## Audit completion checklist

- [x] Environment and dependency baseline.
- [x] Cold/warm regular and static build matrix.
- [x] Fixed-ID determinism.
- [x] Route and artifact analysis.
- [x] Restaurant HTML/RSC analysis.
- [x] Test scaling and snapshot root cause.
- [x] Small validation/traversal/hash costs.
- [x] Release duplication graph.
- [x] Documentation and safeguards.
- [x] Historical upload evidence.
- [x] Two representative Actions runs and timing-variance comparison.
- [x] Final options and recommendation.
- [x] Non-production candidate evidence foundation and staged implementation plan.
- [ ] Implementation and before/after measurement (not authorized by this audit).
