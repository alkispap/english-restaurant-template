# Directory Template

This project is configured as the first real directory: Indian restaurants in London. The structure remains reusable for future local business directories.

## Configure a New Directory

For a new niche such as Mexican Restaurants in London, copy the whole project folder into a new project folder first, then edit the configuration files inside that copy.

The main reusable settings live in:

- `src/config/site.ts` for branding, city/region, niche, hero text, and SEO description.
- `src/config/directory.ts` for listing and category labels.

The main directory index is `/`. Individual listing detail pages stay under `/listings/[slug]`.

## Production URL

Do not hardcode a final public domain in the source files. Set the public site URL with an environment variable before building or deploying:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

If the variable is missing or invalid, the project falls back to `http://localhost:3001` for local development. Sitemap, robots, metadata, share URLs, breadcrumbs, and structured data all use this configured base URL.

Social share previews use each listing page's title, description, and first listing image. Real Facebook, X, WhatsApp, and other preview cards need a publicly reachable domain; localhost URLs can be copied and shared locally, but external platforms cannot crawl them.

## Optional Account Sync

The template supports optional account sync for saved listings and private notes with Supabase. The site still works without Supabase: visitors can save and compare listings in their browser only.

To enable account sync, set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Then follow `SUPABASE_AUTH_SETUP.md` and run `supabase-schema.sql` in your Supabase SQL editor. Enable Google, Microsoft/Azure, and email magic-link sign-in in Supabase Auth.

When copying this template for another directory, use a separate Supabase project unless you intentionally want shared user data across directories.

For an Indian restaurant project, use settings like:

```ts
siteName: "Indian Restaurants London"
name: "Indian Restaurants London"
listingLabel: "Restaurant"
listingPluralLabel: "Restaurants"
cityOrRegion: "London"
```

For a Mexican restaurant project, copy the folder and change the same settings, for example:

```ts
siteName: "Mexican Restaurants London"
name: "Mexican Restaurants London"
listingLabel: "Restaurant"
listingPluralLabel: "Restaurants"
cityOrRegion: "London"
```

After applying settings, import your CSV with the command workflow below.

## Copy Readiness Workflow

When creating a new directory copy, use this sequence:

1. Copy the project folder.
2. Update `src/config/site.ts` and `src/config/directory.ts`.
3. Import the new CSV.
4. Run `npm run audit:template`.
5. Run `npm run audit:seo`.
6. Run `npm run audit:links`.
7. Run `npm run audit:freshness`.
8. Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.

The template readiness audit is advisory. It checks for old niche wording, local production URLs, import report risks, weak listing quality, weak hub coverage, Supabase setup state, and SEO policy items that should be reviewed before launching a copied directory.

## Import CSV Data

The importer is flexible. Your CSV does not need to follow one strict format, but clearer column names produce better results. Good column names include:

- Name fields: `Business Name`, `Listing Name`, `Practice Name`, `Restaurant Name`, `Title`
- Category fields: `Category`, `Categories`, `Business Category`, `Service Type`, `Specialty Type`
- Filter fields: `Area`, `Neighborhood`, `Services`, `Amenities`, `Dietary Options`, `Parking`, `Delivery`, `Price`, `Rating`
- Listing fields: `Address`, `Phone`, `Email`, `Website`, `Images`, `Description`, `Reviews`

The browser admin pages are not included in this template. Imports are done from the command line so setup tools are not exposed as website routes.

### Command Import

Place your CSV at:

```txt
data/directory.csv
```

Then run:

```bash
npm run import:directory
```

You can also import a specific file:

```bash
npm run import:directory -- data/cafes.csv
```

To inspect how the CSV will be understood without changing website data, run:

```bash
npm run import:directory -- data/cafes.csv --dry-run
```

The importer auto-detects categories, filters, listing fields, contact fields, ratings, prices, services, and images. A normal import updates `src/data/listings.ts` and writes `data/import-report.md`.

Contact links are normalized during import. Google redirect URLs are unwrapped, comma-separated URL lists keep the first valid URL, and unsafe protocols are dropped.

Review `data/import-report.md` after every import. It shows:

- which CSV columns became site fields
- which category and filter values were detected
- which columns were ignored
- warnings for missing names, missing categories, missing images, duplicate slugs, and invalid ratings or prices

## Image SEO and Compression

The template is built for remote image URLs first, which matches CSV data from tools like Outscraper. The importer reads comma-separated image URLs from columns such as `Images`, `Image`, `Photo`, `Photos`, or `photo/images` and stores them on each listing.

The site automatically generates useful image alt text from each listing name, cuisine/category, neighborhood or area, and city. For example:

```txt
The Curry Club London Indian restaurant in Barkingside
```

For remote images that Next.js can optimize, the template allows modern compressed delivery with AVIF and WebP. Google-hosted restaurant photos may bypass Next optimization so they keep loading reliably; in that case Google controls the delivered file format, compression, and source filename.

Remote image URLs cannot have true SEO filenames inside your website. If you later want filenames such as:

```txt
the-curry-club-london-barkingside-london-01.webp
```

download the approved images into the project, convert them to WebP, and store them under a local image folder such as `public/images/restaurants/the-curry-club-london/`. Then replace the remote URLs in your listing data with those local paths.

## Verification Checklist

After changing a niche or importing new data, run:

```bash
npm run lint
npm run typecheck
npm test
npm run audit:template
npm run audit:seo
npm run audit:links
npm run audit:freshness
npm run build
```

Then open the site locally and spot-check `/`, `/listings` redirect behavior, `/areas`, `/categories`, `/compare`, a listing detail page, and a few natural searches such as `halal delivery ilford`. Confirm the visible copy, page titles, sitemap, link audit, and robots output match the new niche and configured public URL.
