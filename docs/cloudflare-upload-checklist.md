# Cloudflare Production Release Checklist

This is the authoritative commit-to-production workflow. Do not upload `out/` with a raw Wrangler command: the folder is ignored by Git and may be stale even when the source tree is clean.

Production releases must be rebuilt from the protected `main` branch in a fresh isolated checkout. Do not replace the Code Quality worktree's `node_modules` junction for a release, and do not publish from a feature branch even if the Cloudflare `--branch` argument says `main`.

## 1. Merge A Verified Release Checkpoint

- Mark the release pull request ready only after its current preview and external production gates are complete.
- Require `Fast quality gate` and `Full static export and rendered benchmark` to pass for the exact final pull-request commit.
- Resolve review conversations and merge through the protected `main` branch.
- Create a fresh isolated checkout of `main`, run `npm ci`, and confirm `HEAD`, local `main`, and `origin/main` are the same full SHA.
- Confirm `git status --short` is empty and record the pull request, merge commit, CI run IDs, operator, and timestamp.

The publish command refuses tracked or untracked changes. Ignored build output such as `.next/` and `out/` does not make the worktree dirty.

## 2. Prepare Without Publishing

From the isolated checkout, run:

```powershell
$commit = git rev-parse HEAD
npm run check:release -- --confirm-commit=$commit
```

This uses the pinned project-local Wrangler installation and runs TypeScript, tests, ESLint, dependency policy, publication integrity, SEO, crawl, internal-link and template-readiness audits, the production build, static export, client-payload audit, Cloudflare artifact validation, and clean-worktree checks. It generates a deterministic artifact manifest and sanitized preflight evidence under `.codex-local/evidence/`. It does not upload anything.

Use `npm run prepare:cloudflare` only when you need to rebuild and inspect `out/` without repeating the full type-check and test gate.

Confirm the final output reports:

- The upload-ready folder is `out/`.
- `out/sitemap.xml` and `out/robots.txt` use `https://indianrestaurantlondon.co.uk`.
- `out/_headers` and `out/_redirects` are present.
- No file exceeds `25 MiB` and the export stays below Cloudflare's file-count limit.
- The reported artifact file count, byte count, and aggregate SHA-256 are recorded in the release evidence.

If source files change after preparation, treat the output as stale and prepare it again.

## 3. Publish The Exact Committed Source

Run `npm ci` in the isolated checkout before release checks so the exact Wrangler version pinned in `package-lock.json` is available. The publisher refuses cached or global Wrangler installations. Wrangler must also be authenticated with the intended Cloudflare account.

For production, privately provide `CLOUDFLARE_ACCOUNT_ID` and a least-privilege `CLOUDFLARE_API_TOKEN` with Pages Read and Pages Write. The publisher uses the REST API to verify the full project and deployment metadata because Wrangler 4.111's `pages ... list --json` output abbreviates commit hashes and is not sufficient for production provenance. Never print or save these environment-variable values.

Before requesting upload approval, list the Cloudflare project and its production deployments using the pinned Wrangler executable:

```powershell
node node_modules/wrangler/bin/wrangler.js pages project list --json
node node_modules/wrangler/bin/wrangler.js pages deployment list `
  --project-name indianrestaurantlondon `
  --environment production `
  --json
```

Confirm that the project is Direct Upload, its production branch is `main`, and the first successful production deployment is an eligible rollback target. Preview deployments are never valid rollback targets.

Request explicit approval naming all of the following:

- Full `main` commit SHA.
- Artifact aggregate SHA-256.
- Cloudflare project and production URL.
- Current production deployment ID to use as rollback target.
- Permission to upload once.
- Whether immediate rollback is pre-authorized for the critical failures in section 5.

In PowerShell, set the target for the current terminal and run the guarded publisher:

```powershell
$env:CLOUDFLARE_PROJECT_NAME = "indianrestaurantlondon"
$env:CLOUDFLARE_PRODUCTION_BRANCH = "main"
$env:NEXT_PUBLIC_SITE_URL = "https://indianrestaurantlondon.co.uk"
$commit = git rev-parse HEAD

npm run publish:cloudflare -- `
  --confirm-production `
  --confirm-project=indianrestaurantlondon `
  --confirm-branch=main `
  --confirm-commit=$commit `
  --confirm-previous-deployment=<CURRENT_PRODUCTION_DEPLOYMENT_ID>
```

The command:

1. Requires explicit confirmation of production, project, branch, full commit, and rollback target.
2. Refuses a dirty worktree, feature branch, stale local `main`, or commit that differs from `origin/main`.
3. Requires both protected GitHub checks to have succeeded for the exact commit.
4. Verifies the Direct Upload project, Cloudflare production branch, and current successful production deployment.
5. Runs the complete release gates and creates deterministic artifact evidence.
6. Deploys with the exact commit hash, message, and clean-worktree metadata.
7. Fetches deployment history and verifies environment, project, branch, commit, status, ID, and URL.
8. Never retries an indeterminate production upload automatically.

Never paste Cloudflare API tokens into a command, source file, commit, screenshot, or audit log. Use Wrangler authentication or a private environment variable outside the repository.

### Interrupted Or Indeterminate Uploads

If Wrangler times out, exits unexpectedly, or loses its final output, do not rerun it. Query production deployment history and reconcile by the confirmed commit, project, branch, timestamp, and clean-commit metadata. If Cloudflare contains the successful deployment, record its ID and continue verification. If no matching deployment can be proven, stop and request approval before any retry.

## Cache And Security Rules Included In The Artifact

`public/_headers` is copied into the export. Keep the specific asset rules before the general document rule:

```txt
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/vendor/leaflet/*
  Cache-Control: public, max-age=31536000, immutable

/*
  Cache-Control: public, max-age=0, must-revalidate
```

The same file also carries the production Content Security Policy and related browser security headers. `public/_redirects` carries legacy and renamed-listing redirects. Both files are required by `check:cloudflare`.

## 4. Verify The Live Release

Check these live paths:

- `/`
- One `/restaurants/.../` detail page
- `/_next/static/css/...`
- `/_next/static/chunks/...`
- `/vendor/leaflet/leaflet.css`
- `/vendor/leaflet/directory-map.css`
- `/vendor/leaflet/images/marker-icon.png`
- `/sitemap.xml`
- `/robots.txt`

Expected results:

- `/_next/static/*` and `/vendor/leaflet/*` return `Cache-Control: public, max-age=31536000, immutable`.
- HTML, `sitemap.xml`, and `robots.txt` remain short-cache or revalidated.
- The shared CSP, `X-Content-Type-Options`, frame protection, referrer policy, and permissions policy are present.
- The homepage and restaurant detail page work at desktop and mobile widths.
- Search/filtering and the map view hydrate without console errors.
- A legacy `/listings/.../` URL redirects once to its canonical `/restaurants/.../` URL.
- The sitemap and robots file reference the production domain.

Also verify that production does not receive `X-Robots-Tag: noindex`, no unapproved analytics beacon is injected, and Cloudflare reports the intended production environment, branch, commit and artifact deployment.

Record the deployment time, Git commit, artifact hash, prior production deployment, new deployment URL and ID, and verification result under:

```text
.codex-local/evidence/production-release-YYYY-MM-DD-HHMM/
```

The record contains `preflight.json`, `artifact-manifest.sha256`, `deployment.json`, a live-verification report, and `rollback.json` if rollback occurs. Copy a credential-free summary to the release pull request so the evidence is not limited to one laptop. Never include Cloudflare tokens or account identifiers.

## 5. Roll Back A Bad Production Deployment

Cloudflare Pages retains successful production deployments as rollback targets. Preview deployments cannot be selected as rollback targets.

Critical rollback triggers are: the wrong commit or project, production `noindex`, broken primary routing, missing essential assets, a severe search/filter regression, or missing/materially weakened security headers. A non-critical visual issue requires a separate decision rather than an automatic rollback.

1. Stop further production publishing and record the failing deployment URL or identifier.
2. In the Cloudflare dashboard, open **Workers & Pages**, select the Pages project, and open **Deployments**.
3. In **All deployments**, locate the last known-good successful production deployment.
4. Open its actions menu, choose **Rollback to this deployment**, and confirm the exact target.
5. Repeat the live verification checks above against the production domain.
6. Record the restored deployment identifier, the incident time, the affected Git commit, and the verification outcome.
7. Use a cache-busting request to verify the custom domain points to the restored deployment; request separate approval before purging cache.
8. Write `rollback.json` with the failing deployment, restored target, reason, operator, timestamps, and verification result.
9. Fix the source on a new commit. Do not treat the dashboard rollback as a replacement for reverting or correcting the repository state.

If API rollback fails, try the dashboard with the same pre-recorded target. If Cloudflare is unavailable, stop making changes, preserve evidence, and monitor the existing production response. Do not choose a different rollback target or change DNS as an improvised recovery step.

Cloudflare documents the current dashboard process at:

- https://developers.cloudflare.com/pages/configuration/rollbacks/

For automation, Cloudflare also exposes a Pages deployment rollback API. Do not add API rollback automation until account identifiers, token storage, confirmation controls, and an incident owner are explicitly approved:

- https://developers.cloudflare.com/api/resources/pages/subresources/projects/subresources/deployments/methods/rollback/

## Why The Guardrails Matter

The guarded workflow prevents deploying stale ignored output, uncommitted work, a feature-branch build labelled as `main`, an unintended project, an unverified rollback target, or shell-interpreted target values. Long-lived caching for content-hashed assets improves repeat-load performance while revalidation keeps HTML and search-engine control files fresh.
