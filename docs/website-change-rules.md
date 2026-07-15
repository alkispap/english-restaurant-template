# Website Change Rules

Use this before changing the website. The goal is to keep Google/PageSpeed, SEO, static export, Cloudflare upload, accessibility, and template reuse from breaking during future edits.

For full history, see `docs/pagespeed-performance-report-2026-06-19.md`.  
For upload steps, see `docs/cloudflare-upload-checklist.md`.

## Golden Rules

Do:

- Keep SEO at `100`.
- Keep the homepage fast and server-rendered.
- Keep static Cloudflare export working.
- Keep first-party static assets on long immutable cache.
- Keep the template reusable for future directories.

Do not:

- Reintroduce homepage client-rendering bailout.
- Load the large listing dataset on the default `/` homepage.
- Reintroduce the old footer CLS problem.
- Reintroduce dark mode.
- Hard-code the current niche in reusable template code unless it comes from config/data.

Check:

- Homepage CLS should stay `0` or near `0`.
- Google should detect homepage LCP.
- Homepage should not fetch the large `153-` dataset chunk on first load.

## Homepage Performance Rules

Do:

- Keep `DirectoryListingsPage` server-rendered.
- Keep default `/` rendering real `<main>` HTML before `<footer>`.
- Lazy-load browser directory filtering only for real directory query keys such as `q`, `area`, `category`, `sort`, `open`, `view`, and `page`.
- Keep the Saved/Compare link with `prefetch={false}`.

Do not:

- Add `useSearchParams` or client-only state to the first-render homepage path.
- Wrap the homepage directory in a client shell.
- Bring back `BAILOUT_TO_CLIENT_SIDE_RENDERING`.
- Add sticky positioning to the header.
- Let tracking/cache-busting query strings load the browser dataset.

Check:

- `out/index.html` contains `<main` before `<footer`.
- `out/index.html` does not contain `BAILOUT_TO_CLIENT_SIDE_RENDERING`.
- `.next/app-build-manifest.json` homepage `/page` does not include `153-`.
- Default `/` does not request `/compare/` or the large dataset chunk before user action.

## Cloudflare And Cache Rules

Do:

- Commit the intended release and confirm `git status --short` is empty.
- Use `npm run prepare:cloudflare` for a local, non-publishing artifact check.
- Publish only through the guarded production workflow:

```powershell
$env:CLOUDFLARE_PROJECT_NAME = "indianrestaurantlondon"
$env:CLOUDFLARE_PRODUCTION_BRANCH = "main"
npm run publish:cloudflare -- --confirm-project=indianrestaurantlondon
```

- Do not deploy `out/` with a raw Wrangler command; ignored output can be stale.
- Follow `docs/cloudflare-upload-checklist.md` for the complete release and live-verification sequence.

- Keep `public/_headers` included in the export.
- Keep these long-cache rules:

```txt
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/vendor/leaflet/*
  Cache-Control: public, max-age=31536000, immutable
```

Do not:

- Long-cache HTML pages.
- Assume third-party cache warnings can be fixed from this repo.
- Upload if `out/_headers`, `out/sitemap.xml`, or `out/robots.txt` is missing.

Check:

- `/` should stay short-cache or revalidated.
- `/_next/static/*` should return `public, max-age=31536000, immutable`.
- `/vendor/leaflet/*` should return `public, max-age=31536000, immutable`.
- Third-party Googleusercontent images and Cloudflare Insights cache headers are limited-control items.

## SEO And URL Rules

Do:

- Keep homepage and SEO landing page hub links clean and crawlable.
- Keep area/category/best/facet pages statically generated when they have enough results.
- Keep SEO landing route files static; query/filter UX belongs in the SEO landing client enhancer, not server `searchParams`.
- Keep sitemap and robots using `https://indianrestaurantlondon.co.uk`.
- Keep one clear homepage H1.
- Keep internal links useful, count-backed, and relevant to the directory.

Do not:

- Use query-string URLs as primary SEO hub links.
- Break `/best/budget-friendly/`.
- Break price filtering for budget, mid-range, or premium price symbols.
- Leave stale "Indian" wording in reusable template logic when copying to another niche.

Check:

- `budget-friendly` continues matching budget-price listings.
- Sitemap includes the live production domain.
- Robots points to the production sitemap.
- SEO landing pages keep clean canonicals and noindex weak/query states where intended.
- Filter, sort, Open now, pagination, and map/list changes work on `/restaurants` and at least one SEO landing page.

## Accessibility Rules

Do:

- Keep link text and accessible labels aligned.
- Use `aria-current` only where it fits link navigation.
- Keep badge, button, and small-text contrast passing normal text contrast.
- Keep header logo badge contrast passing.
- Keep rating and open/closed badges passing.

Do not:

- Use `aria-pressed` on normal links.
- Use `Grid view` as the accessible label for a visible `List` link.
- Reduce contrast with opacity on small text badges.

Check:

- Result controls have no invalid ARIA on links.
- Header badge, rating pill, open badge, and closed badge still pass contrast.
- Accessibility should stay around `96` or better unless a known issue is intentionally left for later.

## Image Rules

Do:

- Treat Googleusercontent restaurant images as allowed for now.
- Keep the Royal Nawaab image warning documented as a known limitation.
- Decide on a full local-image strategy before replacing images widely.

Do not:

- Fix image strategy piecemeal without deciding whether images should become local assets.
- Assume Google image cache/compression can be controlled from this repo.

Check:

- If local images are introduced later, prefer optimized WebP/AVIF at display-appropriate sizes.
- Make sure images keep stable dimensions and do not create CLS.

## Testing Checklist

Before meaningful upload, run:

```txt
npm run typecheck
npm run test
npm run prepare:cloudflare
```

For homepage performance changes, also check:

- `out/index.html` has `<main>` before `<footer>`.
- `out/index.html` has no `BAILOUT_TO_CLIENT_SIDE_RENDERING`.
- homepage manifest does not include `153-`.
- live headers after upload show long cache for `/_next/static/*`.

For Cloudflare upload, check:

- `out/_headers` exists.
- `out/sitemap.xml` exists and uses the live domain.
- `out/robots.txt` exists and points to the live sitemap.
- Cloudflare upload output mentions `_headers` when headers change.

## Guardrail Tests

These tests enforce the most important rules:

- `scripts/homepage-performance-regression.test.ts`
- `scripts/account-hydration-boundary.test.ts`
- `scripts/source-hygiene.test.ts`
- `scripts/accessibility-static.test.ts`
- `scripts/dynamic-routes.test.ts`
- `scripts/check-cloudflare-export.ts`
- `scripts/query-url-governance.test.ts`
- `scripts/dark-mode-removal.test.ts`

If one of these fails, do not upload until the failure is understood and fixed.

## Current Known Limits

- Googleusercontent image caching and compression are third-party limitations.
- Cloudflare Insights script cache lifetime is controlled by Cloudflare.
- Render-blocking CSS is currently small and not worth risky critical-CSS work.
- Legacy JavaScript warning is small and mostly framework/tooling related.
- Favicon is still on hold until a favicon asset exists.
