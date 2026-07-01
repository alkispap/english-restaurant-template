# Cloudflare Upload Checklist

Use this checklist before uploading a new static version of the site to Cloudflare.

## Latest Prepared Upload

Status on 2026-06-27:

- Upload-ready folder: `out/`
- Production domain used for the export: `https://indianrestaurantlondon.co.uk`
- Cloudflare export check: passed
- Files ready: `13,746`
- Oversized assets: none over `25 MiB`
- Typecheck: passed

If no files are changed after this point, upload the current `out/` folder to Cloudflare.

## Before Upload

- Run the upload preparation workflow:
  - `npm run prepare:cloudflare`
- This command stops this project’s local dev server if it is running, rebuilds the static export with the live domain, and runs the Cloudflare export checks.
- Confirm the upload folder is the latest `out/` folder.
- Confirm `out/sitemap.xml` and `out/robots.txt` use:
  - `https://indianrestaurantlondon.co.uk`
- Confirm the homepage is from the latest build, not an older export.
- Confirm new public assets are included, especially:
  - `/vendor/leaflet/leaflet.css`
  - `/vendor/leaflet/directory-map.css`
  - `/vendor/leaflet/images/*`

## Upload Rule

- If `npm run prepare:cloudflare` has already passed and no files changed after it, do not run the full publish workflow again.
- Use direct Cloudflare upload only:

```txt
npx wrangler pages deploy out --project-name indianrestaurantlondon
```

- Reason:
  - `prepare:cloudflare` already rebuilds and checks the upload-ready `out/` folder.
  - Running the full publish workflow again repeats typecheck, tests, static export, and Cloudflare checks before upload.
  - The current static export contains `13,746` files, so direct upload can still take a long time by itself.
- Use the full publish workflow only when we intentionally want one command to run all checks and deploy from scratch.

## Cache Header Rules To Include

If using Cloudflare Pages Direct Upload, add these rules through the Cloudflare `_headers` file or equivalent Cloudflare header settings.

Long cache for hashed Next assets:

```txt
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
```

Long cache for map vendor assets:

```txt
/vendor/leaflet/*
  Cache-Control: public, max-age=31536000, immutable
```

Short cache or revalidation for documents:

```txt
/*
  Cache-Control: public, max-age=0, must-revalidate
```

Important:

- The long-cache rules must be more specific than the general `/*` rule.
- Keep HTML pages, `sitemap.xml`, and `robots.txt` easy to refresh.
- Third-party Googleusercontent images and Cloudflare Insights script headers are not controlled by this repo.

## After Upload Verification

Check the live response headers:

- `/`
- `/_next/static/css/...`
- `/_next/static/chunks/...`
- `/vendor/leaflet/leaflet.css`
- `/vendor/leaflet/directory-map.css`
- `/vendor/leaflet/images/marker-icon.png`
- `/sitemap.xml`
- `/robots.txt`

Expected results:

- `/_next/static/*` should return:
  - `Cache-Control: public, max-age=31536000, immutable`
- `/vendor/leaflet/*` should return:
  - `Cache-Control: public, max-age=31536000, immutable`
- `/`, HTML pages, `sitemap.xml`, and `robots.txt` should stay short-cache or revalidated.

## Why This Matters

The live site previously returned this for hashed Next files:

```txt
Cache-Control: public, max-age=14400, must-revalidate
```

That is only `4 hours`. Because `/_next/static/*` filenames are content-hashed, browsers can safely cache them for much longer. This helps repeat visitors and can reduce PageSpeed caching warnings.
