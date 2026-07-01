# Test Runtime Follow-Up

Current status:

- `npm run test` previously timed out under the old command limits.
- After the first optimization pass, it now passes in about `292` seconds (`4m 52s`).
- This is much better than the previous timed run of about `533` seconds (`8m 53s`), but it is still heavy for a normal quick test command.

How to judge the current time:

- Good quick test time: under `1 minute`
- Acceptable full test time: about `2-3 minutes`
- Current time: about `4m 52s`
- Conclusion: usable, but still worth improving later.

Likely next improvements:

- Avoid reloading the large listings dataset in many separate test processes.
- Split tests into:
  - quick tests for normal development
  - full tests for pre-upload/pre-release checks
- Keep static export and build-heavy checks separate from normal quick tests.
- Investigate whether independent tests can run in parallel safely.
- Reduce repeated SEO/page-model generation in tests where a smaller fixture would prove the same behavior.

Website performance impact:

- This is not expected to directly affect Google PageSpeed.
- Visitors do not run `npm run test`.
- The value is faster development, faster verification, and better confidence before uploading a new version.

Recommended timing:

- Revisit after the main Google PageSpeed issues are handled, unless test speed starts slowing day-to-day work too much.

## Investigation Notes - 2026-06-20

Goal:

- Investigate why `npm run test` still takes about `4m+`.
- Identify the safest next improvement without changing production website code.

Current runner:

- `npm run test` runs `tsx scripts/run-tests.ts`.
- `scripts/run-tests.ts` discovers all `scripts/*.test.ts` files.
- It runs every test file one by one.
- Each file starts a fresh Node/tsx process.

Fresh baseline:

- Test files: `78`
- Sequential timed run: `279.96` seconds
- Slowest files:
  - `seo-pages.test.ts`: `10.66s`
  - `seo-landing-page-render.test.ts`: `10.18s`
  - `template-readiness-audit.test.ts`: `9.90s`
  - `metadata-title.test.ts`: `9.59s`
  - `homepage-heading-structure.test.ts`: `8.30s`
  - `internal-linking.test.ts`: `7.49s`
  - `dynamic-routes.test.ts`: `7.12s`
  - `listing-indexation.test.ts`: `6.79s`
  - `query-url-governance.test.ts`: `6.76s`
  - `normal-build-routes.test.ts`: `6.32s`
  - `static-route-params-performance.test.ts`: `5.88s`
  - `homepage-crawl-architecture.test.ts`: `5.50s`
  - `search-quality.test.ts`: `5.14s`
- Only `2` tests were over `10s`.
- `13` tests were over `5s`.
- The tests over `5s` account for about `99.63s`.
- `38` tests were under `3s`.

Startup overhead measurement:

- Empty `node -e ""` average startup: `0.094s`
- Empty `tsx -e ""` average startup: `1.287s`
- With `78` test files, tsx startup alone is roughly `100s`.
- This means the remaining runtime is not caused by one very slow test; it is mostly repeated process startup plus repeated imports of app/data modules.

Cost categories:

- Full listing dataset / directory logic:
  - tests importing `src/data/listings`
  - search, transport, listing indexation, directory UX/growth tests
- SEO/sitemap/static route logic:
  - `seo-pages.test.ts`
  - `seo-landing-page-render.test.ts`
  - `sitemap.test.ts`
  - `dynamic-routes.test.ts`
  - `normal-build-routes.test.ts`
  - `static-route-params-performance.test.ts`
- Environment-sensitive tests:
  - `account-sync.test.ts`
  - `dynamic-routes.test.ts`
  - `normal-build-routes.test.ts`
  - `static-route-params-performance.test.ts`
  - `cloudflare-publish.test.ts`
- Source/config-only checks:
  - many fast tests read source files or config and are safe candidates for quick/parallel execution.

Parallel safety trial:

- Ran the same `78` test files with `4` worker processes.
- Result: `0` failures.
- Wall-clock time: `69.61` seconds.
- This is about `4x` faster than the sequential timed baseline.
- Parallel execution is safer than single-process grouping because each test still gets its own process and environment.

Evaluation of possible next improvements:

- Quick/full split:
  - Low risk.
  - Useful for day-to-day workflow.
  - Not enough by itself, because even the "quick" group would still pay repeated process startup costs.
- Parallel runner:
  - Best payoff.
  - A script-only change can keep each test isolated in its own process.
  - The 4-worker trial showed the full suite can run in about `70s`.
  - Recommended first fix target.
- Fewer process starts / grouped imports:
  - Higher risk.
  - Could be faster, but tests mutate `process.env` and rely on module import timing.
  - Not recommended as the first optimization.

Recommended first fix target:

- Replace or extend `scripts/run-tests.ts` with a bounded parallel runner.
- Keep one process per test file for isolation.
- Use `4` workers by default on this Windows laptop.
- Preserve fail-fast or collect-failures behavior clearly.
- Keep `npm run test` as the reliable full suite.
- Optionally add `npm run test:quick` later after the parallel runner is stable.

Expected benefit:

- Current sequential full suite: about `280s`.
- Proven 4-worker trial: about `70s`.
- Real implementation target: under `90s` for the full suite.

Website performance impact:

- This does not directly affect Google PageSpeed.
- Visitors do not run tests.
- The benefit is faster development and faster confidence before upload.

## Parallel Runner Fix Notes - 2026-06-20

What changed:

- `scripts/run-tests.ts` now runs test files with bounded parallel workers.
- Default worker count is `4`.
- `TEST_WORKERS=1` keeps a sequential fallback for debugging.
- Each test file still runs in its own Node/tsx process, so tests keep process isolation.
- Output is captured per test, then the runner prints a readable summary with total tests, passed tests, failed tests, runtime, and the slowest tests.
- If any test fails, the runner continues already scheduled work and exits with code `1` after reporting all failures.

Verification:

- Sequential fallback passed:
  - `TEST_WORKERS=1 npm run test`
  - Result: `79` passed, `0` failed
  - Runtime: `5m 40.64s`
- Explicit parallel mode passed:
  - `TEST_WORKERS=4 npm run test`
  - Result: `79` passed, `0` failed
  - Runtime: `1m 45.03s`
- Normal command passed:
  - `npm run test`
  - Result: `79` passed, `0` failed
  - Runtime: `1m 12.36s`
- Failure behavior was checked with a temporary failing test:
  - Runner reported `79` passed and `1` failed.
  - Runner returned a non-zero exit code.
  - Temporary failing test file was removed after the check.

Before/after:

- Previous reliable full-suite runtime: about `292s` / `4m 52s`.
- Earlier measured sequential baseline during investigation: `279.96s`.
- New normal full-suite runtime: `72.36s` / `1m 12s`.
- This is roughly a `4x` development-speed improvement.

Website performance impact:

- This is not a live website performance fix.
- It does not affect Google PageSpeed, visitors, SEO, or static export output.
- It makes local verification much faster before uploading a new version.
