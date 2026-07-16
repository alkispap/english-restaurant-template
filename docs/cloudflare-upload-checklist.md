# Cloudflare Production Release Checklist

This is the authoritative commit-to-production workflow. Do not upload `out/` with a raw Wrangler command: the folder is ignored by Git and may be stale even when the source tree is clean.

## 1. Finish And Commit A Release Checkpoint

- Review `git status --short` and confirm every change belongs in the release.
- Run the normal verification appropriate to the change.
- Commit the intended source changes on the release branch.
- Confirm `git status --short` is empty.
- Record the branch and commit shown by `git branch --show-current` and `git rev-parse --short HEAD`.

The publish command refuses tracked or untracked changes. Ignored build output such as `.next/` and `out/` does not make the worktree dirty.

## 2. Prepare Without Publishing

Run:

```powershell
npm run check:release
```

This uses the pinned project-local Wrangler installation, runs type-checking and the complete test suite, stops this project's local development server, rebuilds `out/` with the production URL from the selected directory pack, runs the client-payload audit, validates the Cloudflare artifact, and checks that generation left the Git worktree clean. It does not upload anything.

Use `npm run prepare:cloudflare` only when you need to rebuild and inspect `out/` without repeating the full type-check and test gate.

Confirm the final output reports:

- The upload-ready folder is `out/`.
- `out/sitemap.xml` and `out/robots.txt` use `https://indianrestaurantlondon.co.uk`.
- `out/_headers` and `out/_redirects` are present.
- No file exceeds `25 MiB` and the export stays below Cloudflare's file-count limit.

If source files change after preparation, treat the output as stale and prepare it again.

## 3. Publish The Exact Committed Source

Run `npm ci` before release checks so the exact Wrangler version pinned in `package-lock.json` is available under this project. The publisher refuses cached or global Wrangler installations. Wrangler must also be authenticated with the intended Cloudflare account.

In PowerShell, set the target for the current terminal and run the guarded publisher:

```powershell
$env:CLOUDFLARE_PROJECT_NAME = "indianrestaurantlondon"
$env:CLOUDFLARE_PRODUCTION_BRANCH = "main"
npm run publish:cloudflare -- --confirm-project=indianrestaurantlondon
```

The command:

1. Requires the confirmation value to exactly match `CLOUDFLARE_PROJECT_NAME`.
2. Refuses a dirty Git worktree.
3. Reports the source branch, commit, target project, target production branch, and Wrangler version.
4. Runs type-checking, all tests, a fresh static export, payload checks, and Cloudflare artifact validation.
5. Checks the worktree again in case generation changed a tracked file.
6. Deploys the freshly generated `out/` directory.

Never paste Cloudflare API tokens into a command, source file, commit, screenshot, or audit log. Use Wrangler authentication or a private environment variable outside the repository.

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

Record the deployment time, Git commit, Cloudflare deployment URL or identifier, and verification result in the release log or pull request.

## 5. Roll Back A Bad Production Deployment

Cloudflare Pages retains successful production deployments as rollback targets. Preview deployments cannot be selected as rollback targets.

1. Stop further production publishing and record the failing deployment URL or identifier.
2. In the Cloudflare dashboard, open **Workers & Pages**, select the Pages project, and open **Deployments**.
3. In **All deployments**, locate the last known-good successful production deployment.
4. Open its actions menu, choose **Rollback to this deployment**, and confirm the exact target.
5. Repeat the live verification checks above against the production domain.
6. Record the restored deployment identifier, the incident time, the affected Git commit, and the verification outcome.
7. Fix the source on a new commit. Do not treat the dashboard rollback as a replacement for reverting or correcting the repository state.

Cloudflare documents the current dashboard process at:

- https://developers.cloudflare.com/pages/configuration/rollbacks/

For automation, Cloudflare also exposes a Pages deployment rollback API. Do not add API rollback automation until account identifiers, token storage, confirmation controls, and an incident owner are explicitly approved:

- https://developers.cloudflare.com/api/resources/pages/subresources/projects/subresources/deployments/methods/rollback/

## Why The Guardrails Matter

The guarded workflow prevents deploying stale ignored output, uncommitted work, an unintended project, or shell-interpreted target values. Long-lived caching for content-hashed assets improves repeat-load performance while revalidation keeps HTML and search-engine control files fresh.
