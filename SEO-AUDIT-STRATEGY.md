# SEO Audit Strategy Record

## Goal

Track the next SEO checks after the H-tag and page-title work. This file is the working record for each SEO area we review, what we find, what we change, and before/after examples.

Related records:

- `HEADING-STRATEGY.md`
- `PAGE-TITLE-STRATEGY.md`

## Audit Order

Recommended order:

```text
1. Meta descriptions
2. Restaurant descriptions
3. Restaurant detail content quality
4. Internal linking
5. Structured data and schema
6. Indexation strategy
7. URLs and slugs
8. Image SEO
```

## 1. Meta Descriptions

Status:

```text
Implemented
```

Pages to check:

```text
/
/restaurants
/areas
/categories
/restaurants/[slug]
/areas/[area]
/neighborhoods/[neighborhood]
/categories/[category]
/areas/[area]/categories/[category]
/best/[slug]
/services/[service]
/dietary/[dietary]
/offerings/[offering]
/types/[type]
/guides
/guides/[slug]
/about
/contact
/privacy-policy
/terms
/methodology
/suggest-update
/compare
```

What to check:

- Whether each page has a unique metadata description.
- Whether the description includes the page's main search intent naturally.
- Whether the description is useful as a Google search snippet.
- Whether descriptions are duplicated, too generic, too short, or too long.
- Whether route-level descriptions avoid unnecessary keyword stuffing.

Google Search Central guidance applied:

- Google may use the meta description when it gives users a more accurate page summary than page text.
- Descriptions should be unique for individual pages where possible.
- Descriptions should accurately summarize the specific page.
- Descriptions should be descriptive and useful, not a keyword list.
- Google can truncate or rewrite snippets, so the goal is useful snippet copy rather than a fixed character count.

Source:

```text
https://developers.google.com/search/docs/appearance/snippet
```

Files changed:

```text
src/app/restaurants/page.tsx
src/app/areas/page.tsx
src/app/categories/page.tsx
src/app/guides/page.tsx
src/lib/seo-pages.ts
scripts/metadata-description.test.ts
```

Decision:

- Keep the homepage meta description as the broad site-level description.
- Give `/restaurants` its own search-focused meta description.
- Make `/areas`, `/categories`, and `/guides` descriptions more specific to Indian restaurants in London.
- Keep visible SEO landing page hero descriptions data-rich.
- Use shorter, snippet-focused metadata descriptions for dynamic SEO landing pages.
- Leave restaurant detail meta descriptions unchanged in this pass because sampled restaurant descriptions are already unique, local, and useful.
- Leave trust/support descriptions unchanged in this pass because they are acceptable and lower organic priority.

Before and after examples:

```text
Before:
/: A searchable directory of Indian restaurants in London with filters for areas, cuisines, ratings, services, transport, and dining options.
/restaurants: A searchable directory of Indian restaurants in London with filters for areas, cuisines, ratings, services, transport, and dining options.

After:
/: A searchable directory of Indian restaurants in London with filters for areas, cuisines, ratings, services, transport, and dining options.
/restaurants: Search Indian restaurants in London by area, cuisine, rating, service options, dietary needs, transport links, and dining style.
```

```text
Before:
/areas: Browse restaurants by London area, then narrow by cuisine, rating, price, service options, and opening status.

After:
/areas: Browse Indian restaurants in London by area, then narrow by cuisine, rating, price, service options, and opening status.
```

```text
Before:
/categories: Browse cuisines and restaurant styles in London, then compare matching restaurants by area, rating, price, and service options.

After:
/categories: Browse Indian restaurant cuisines and styles in London, then compare matching restaurants by area, rating, price, and service options.
```

```text
Before:
/guides: Guides for understanding Indian restaurants in London in London before comparing local listings.

After:
/guides: Indian food and restaurant guides for understanding dishes, cuisines, takeaway, dietary options, and local restaurant choices in London.
```

```text
Before:
/areas/barnet: Barnet has 117 Indian restaurant listings, including Indian, Middle Eastern, Vegetarian, and Takeaway. 115 have Google reviews, 48 show price data, 108 offer takeaway, and 103 offer delivery. Several are close to Edgware Underground Station and Golders Green Underground Station.

After:
/areas/barnet: Compare 117 Indian restaurants in Barnet, London by rating, reviews, cuisine, takeaway, delivery, price data, and nearby transport.
```

```text
Before:
/best/best-rated: Best rated restaurants in London include 3,187 matching restaurant listings across London, including Indian, Middle Eastern, South Asian, and Pakistani. 3,119 have Google reviews, 1,289 show price data, 2,969 offer takeaway, and 2,714 offer delivery.

After:
/best/best-rated: Compare best rated Indian restaurants in London by rating, reviews, cuisine, area, takeaway, delivery, and price data.
```

```text
Before:
/services/takeaway: Takeaway restaurants in London include 2,969 matching restaurant listings across London, including Indian, Middle Eastern, Pakistani, and South Asian. 2,926 have Google reviews, 1,228 show price data, 2,969 offer takeaway, and 2,674 offer delivery.

After:
/services/takeaway: Compare Indian restaurants with Takeaway in London by rating, reviews, area, cuisine, delivery options, and price data.
```

Verification:

```text
node .\node_modules\tsx\dist\cli.mjs scripts\metadata-description.test.ts
metadata description tests passed
```

## 2. Restaurant Descriptions

Status:

```text
Implemented
```

Pages to check:

```text
/restaurants/[slug]
```

Sample restaurant pages to start with:

```text
/restaurants/the-curry-club-london
/restaurants/hyderabad-darbar
/restaurants/saravanaa-bhavan
```

What to check:

- Whether each restaurant has a unique description.
- Whether descriptions mention the restaurant name naturally.
- Whether descriptions mention area, London, cuisine, services, dietary options, or dining style where available.
- Whether descriptions are useful to visitors before they click through.
- Whether descriptions are thin, duplicated, imported from weak source data, or too generic.
- Whether descriptions can use reusable wording rules for future directory copies.

Investigation findings:

```text
Total listings: 3,187
Missing visible descriptions before: 0
Missing meta descriptions before: 0
Duplicate meta descriptions before: 0
Average visible description length before: 196 characters
Average meta description length before: 154 characters
```

Weak generated-copy patterns found before implementation:

```text
"Restaurant food": 570 listings
"a Indian": 486 listings
"area restaurant covering...": 242 listings
"is listed for...": 425 listings
"is listed in...": 402 listings
"appears as...": 429 listings
```

Decision:

- Do not manually edit individual restaurant descriptions.
- Improve the shared generator in `src/lib/listing-description.ts`.
- Regenerate listing data from the source CSV so `data/listings.json` and `data/listing-search-records.json` stay consistent.
- Keep descriptions data-led: restaurant name, cuisine/category, location, service options, reviews, price, dietary options, and transport/nearby signals where available.
- Remove mechanical wording patterns and fix article grammar such as `a Indian`.

Files changed:

```text
src/lib/listing-description.ts
scripts/import-directory.test.ts
scripts/listing-description-quality.test.ts
data/listings.json
data/listing-search-records.json
data/import-report.md
```

Import command used:

```text
npm.cmd run import:directory -- "data/Indian Restaurants - Outscraper - Test.csv"
```

After implementation:

```text
Total listings: 3,187
Missing visible descriptions after: 0
Missing meta descriptions after: 0
Average visible description length after: 176 characters
Average meta description length after: 154 characters
"a Indian": 0
"Restaurant food": 0
"restaurant covering": 0
"Restaurant restaurant": 0
"appears as": 0
"is listed for": 0
"is listed in": 0
```

Before and after examples:

```text
Before:
Royal Nawaab is a Indian option in Ilford, Redbridge near Redbridge Central Library. The listing includes highlights such as great coffee and great dessert, takeaway, delivery, and dine-in, and nearby Shirdi Sai Temple.

After:
Royal Nawaab is an Indian restaurant in Ilford, Redbridge near Redbridge Central Library. The listing includes highlights such as great coffee and great dessert, takeaway, delivery, and dine-in, and nearby Shirdi Sai Temple.
```

```text
Before:
Kera Restaurant serves Restaurant food in Finsbury Park, Islington. The listing includes takeaway and dine-in, 27 Google reviews, and nearby Finsbury Park Picturehouse.

After:
Kera Restaurant is a restaurant in Finsbury Park, Islington. The listing includes takeaway and dine-in, 27 Google reviews, and nearby Finsbury Park Picturehouse.
```

```text
Before:
Royal Thali Restaurant is a Ilford, Redbridge restaurant covering South Indian food. The listing includes takeaway, delivery, and dine-in, access near Barkingside Underground Station, and 480 Google reviews.

After:
Royal Thali Restaurant is a South Indian restaurant in Ilford, Redbridge. The listing includes takeaway, delivery, and dine-in, access near Barkingside Underground Station, and 480 Google reviews.
```

```text
Before:
HYDERABAD DARBAR is listed for Indian, Middle Eastern, and Pakistani food in Ilford, Redbridge, with a 5 Google rating from 266 reviews. The listing includes halal and vegetarian options, takeaway, delivery, and dine-in, 266 Google reviews, and access near Barkingside Underground Station.

After:
HYDERABAD DARBAR serves Indian, Middle Eastern, and Pakistani food in Ilford, Redbridge. The listing includes halal and vegetarian options, takeaway, delivery, and dine-in, 266 Google reviews, and access near Barkingside Underground Station.
```

Verification:

```text
node .\node_modules\tsx\dist\cli.mjs scripts\import-directory.test.ts
import-directory behavior tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\listing-description-quality.test.ts
listing description quality tests passed
```

## 3. Restaurant Detail Content Quality

Status:

```text
Implemented
```

Pages to check:

```text
/restaurants/[slug]
```

Sections to check:

```text
Quick facts
Services, dining options, and features
Guest information
Transport and directions
Nearby places
Comments
Location and contact
Opening hours
Reviews and ratings
Similar Indian restaurants
```

What to check:

- Whether each section has useful, readable content.
- Whether the content helps visitors compare restaurants.
- Whether local SEO signals are present without keyword stuffing.
- Whether missing data creates thin or awkward sections.
- Whether restaurant detail pages have enough unique content to deserve indexing.
- Whether content patterns are reusable for another directory niche.

Investigation findings:

```text
The Quick facts section was generated from structured restaurant data.
The generator always returned 7 fact blocks, even when some blocks had no useful data.
Unavailable blocks were rendered publicly with fallback text such as "No public transport information is currently listed...".
Some generated fact answers had awkward SEO copy, including repeated London location wording and "a Indian" grammar.
Restaurant detail explore-link descriptions were useful structurally, but the visible descriptions were generic and did not mention the directory niche.
Comments are user/community content, so they should not be treated as the main SEO text for restaurant pages.
```

Decision:

```text
Keep the 7-block EAV summary helper for internal consistency and testing.
On public restaurant pages, show only available Quick facts blocks so thin fallback text is not visible as main page content.
Improve location Quick facts so the address does not repeat London awkwardly.
Fix category grammar so Indian restaurant categories use "an Indian..." when appropriate.
Improve restaurant detail explore-link descriptions so they mention "Indian restaurants in London" naturally.
Keep comments as engagement/community content, not as the core SEO strategy.
```

Files changed:

```text
src/lib/listing-eav-summary.ts
src/lib/directory-growth.ts
src/app/restaurants/[slug]/page.tsx
scripts/listing-eav-summary.test.ts
scripts/listing-contextual-bridges.test.ts
scripts/listing-detail-content-quality.test.ts
SEO-AUDIT-STRATEGY.md
```

Before and after examples:

```text
Before Quick fact location:
Test Spice House is located at 10 High St, Ilford, IG6 2AD, London in Ilford, London.

After Quick fact location:
Test Spice House is located at 10 High St, Ilford, IG6 2AD, London, in Ilford, Redbridge.
```

```text
Before Quick fact category:
Test Spice House is categorised as a Indian and Punjabi restaurant.

After Quick fact category:
Test Spice House is categorised as an Indian and Punjabi restaurant.
```

```text
Before missing-data Quick facts:
No service or dining options are currently listed in our directory for [Restaurant Name].
No public transport information is currently listed in our directory for [Restaurant Name].
No rating or review-count data is listed for [Restaurant Name].

After missing-data Quick facts:
Unavailable Quick facts are not rendered on the public restaurant page.
The internal helper still keeps availability flags so the page can decide what to show.
```

```text
Before explore-link description:
These category hubs help compare restaurants with similar cuisine signals.

After explore-link description:
Compare Indian restaurants in London with similar cuisine styles and dining options.
```

Verification:

```text
node .\node_modules\tsx\dist\cli.mjs scripts\listing-eav-summary.test.ts
listing-eav-summary: structural checks passed
listing-eav-summary: rich fixture content checks passed
listing-eav-summary: sparse fixture fallback checks passed

node .\node_modules\tsx\dist\cli.mjs scripts\listing-contextual-bridges.test.ts
contextual bridges logic tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\listing-detail-content-quality.test.ts
listing detail content quality tests passed
```

## 4. Internal Linking

Status:

```text
Implemented
```

Page families to check:

```text
Homepage
Restaurant index
Area index
Category index
Area pages
Neighborhood pages
Category pages
Area + category pages
Best/search intent pages
Facet pages
Restaurant detail pages
Guide pages
Trust/support pages
Compare page
```

What to check:

- Whether important pages are linked from the homepage or major hub pages.
- Whether area/category/facet pages link to useful restaurant detail pages.
- Whether restaurant detail pages link to related restaurants, nearby areas, and relevant category pages.
- Whether guide articles link back to directory pages.
- Whether crawl paths are clear and not overly dependent on search/filter UI.
- Whether anchor text is descriptive and keyword-relevant.

Investigation findings:

```text
Restaurant detail pages already had strong internal links to area, neighborhood, category, area+category, service, dietary, and type pages.
The existing internal-link audit checked 3,187 restaurant pages and 26,581 links with 0 blockers before this pass.
Homepage, SEO landing page, footer, and guide links were not covered by that audit before this pass.
Some visible anchor text was too generic, such as "Harrow", "Indian", "Areas", "Cuisines", and "More restaurants in Redbridge".
One restaurant detail bridge description repeated location wording: "Indian restaurants in London in Redbridge".
Footer links included query URLs such as /restaurants?sort=rating, which are useful UX shortcuts but not clean indexable SEO targets.
Some SEO landing related links pointed to thin area/category combinations that are intentionally noindex.
The published guide article linked only to broad pages and did not pass enough relevance to commercial directory pages.
```

Decision:

```text
Keep useful user-facing filter links in search/sidebar contexts, but avoid using query URLs as footer SEO links.
Use stronger keyword-focused anchors for homepage SEO links, footer links, restaurant detail explore links, SEO landing related links, and guide internal links.
Filter SEO landing related area/category links so they only point to combinations strong enough for indexation.
Expand the internal-link audit so it also checks homepage SEO groups, footer groups, sampled SEO landing pages, guide links, and clean index pages.
Keep non-blocking audit warnings visible for future semantic-flow cleanup.
```

Files changed:

```text
src/config/directory-presets.ts
src/lib/directory-growth.ts
src/lib/directory-ux.ts
src/lib/seo-pages.ts
src/lib/directory-semantic-map.ts
src/lib/internal-link-audit.ts
scripts/check-internal-link-governance.ts
scripts/directory-growth.test.ts
scripts/seo-pages.test.ts
scripts/articles.test.ts
scripts/internal-link-audit.test.ts
content/articles/what-is-indian-food.json
SEO-AUDIT-STRATEGY.md
```

Before and after examples:

```text
Before homepage/footer anchor:
Areas

After:
Restaurant areas
```

```text
Before category/area anchor:
Harrow

After:
Indian restaurants in Harrow
```

```text
Before restaurant detail local anchor:
More restaurants in Redbridge

After:
More Indian restaurants in Redbridge
```

```text
Before restaurant detail bridge description:
Explore more Indian restaurants in London in Redbridge and nearby London areas.

After:
Explore more Indian restaurants in Redbridge and nearby London areas.
```

```text
Before guide internal links:
Indian restaurants in London -> /
Restaurant categories -> /categories

After:
Search Indian restaurants in London -> /restaurants
Indian restaurant cuisines in London -> /categories
Takeaway Indian restaurants in London -> /services/takeaway
```

```text
Before footer SEO shortcut:
Best rated -> /restaurants?sort=rating

After:
Best rated restaurants -> /best/best-rated
```

Verification:

```text
node .\node_modules\tsx\dist\cli.mjs scripts\directory-growth.test.ts
directory growth behavior tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-pages.test.ts
SEO page behavior tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\articles.test.ts
article behavior tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\internal-link-audit.test.ts
internal link audit tests passed

npm.cmd run audit:links
Sources: 3262
Links: 28110
Blockers: 0
```

## 5. Structured Data And Schema

Status:

```text
Implemented
```

Schema types to check:

```text
Restaurant
LocalBusiness
BreadcrumbList
Article
FAQPage
ItemList
WebSite
Organization
```

What to check:

- Whether restaurant pages output valid restaurant/local business structured data.
- Whether article pages output valid article schema.
- Whether FAQ schema is used only where real FAQs exist.
- Whether breadcrumb schema exists for important page families.
- Whether list pages use appropriate list/item structured data where useful.
- Whether schema values match visible page content.
- Whether schema is reusable for future directory copies.

Investigation findings:

```text
Restaurant detail pages emitted LocalBusiness and BreadcrumbList JSON-LD.
SEO landing pages emitted BreadcrumbList and ItemList JSON-LD.
Guide article pages emitted Article JSON-LD and FAQPage JSON-LD when visible FAQs exist.
Draft guide previews correctly did not emit Article or FAQPage schema.
Homepage did not emit Organization or WebSite schema.
Thin/noindex SEO landing pages still emitted ItemList schema.
Restaurant schema did not use the more specific Restaurant type or restaurant-specific fields such as servesCuisine, menu, acceptsReservations, or hasMap.
```

Decision:

```text
Use Restaurant schema for restaurant detail pages instead of generic LocalBusiness.
Add restaurant-specific structured data only when the matching source data exists.
Keep BreadcrumbList schema on SEO landing pages, including noindex pages.
Emit ItemList schema only on indexable SEO landing pages.
Add Organization and WebSite schema to the homepage.
Keep Article and FAQPage schema on published guide articles because the FAQ content is visible on the page.
Keep draft preview schema disabled.
```

Files changed:

```text
src/lib/structured-data.ts
src/lib/seo-pages.ts
src/app/page.tsx
scripts/structured-data.test.ts
scripts/seo-pages.test.ts
scripts/homepage-structured-data.test.ts
SEO-AUDIT-STRATEGY.md
```

Before and after examples:

```text
Before restaurant detail schema:
"@type": "LocalBusiness"

After restaurant detail schema:
"@type": "Restaurant"
"servesCuisine": ["Indian", "Punjabi"]
```

```text
Before restaurant action fields:
No menu, reservation, or map fields in the restaurant schema.

After restaurant action fields:
"menu": "https://restaurant.example.com/menu"
"acceptsReservations": "https://restaurant.example.com/book"
"hasMap": "https://maps.google.com/?cid=123"
```

```text
Before thin/noindex SEO page schema:
BreadcrumbList
ItemList

After thin/noindex SEO page schema:
BreadcrumbList only
```

```text
Before homepage schema:
No Organization or WebSite JSON-LD.

After homepage schema:
Organization JSON-LD
WebSite JSON-LD
```

Verification:

```text
node .\node_modules\tsx\dist\cli.mjs scripts\structured-data.test.ts
structured-data behavior tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-pages.test.ts
SEO page behavior tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\homepage-structured-data.test.ts
homepage structured data tests passed
```

## 6. Indexation Strategy

Status:

```text
Implemented
```

Page types to check:

```text
Homepage
Index pages
Restaurant detail pages
Dynamic SEO landing pages
Guide pages
Draft guide preview pages
Trust/support pages
Compare page
Legacy redirect pages
Sitemap
Robots
```

What to check:

- Which pages should be indexable.
- Which pages should be noindex.
- Whether thin pages are blocked from search when needed.
- Whether draft preview pages are noindex.
- Whether sitemap output includes only the right URLs.
- Whether robots rules match the intended crawl strategy.
- Whether duplicate or low-value facet pages are handled safely.

Before and after examples:

```text
Before:
The sitemap included the homepage, /areas, /categories, indexable restaurant pages,
indexable SEO landing pages, and published guide articles.

It did not include the main canonical restaurant directory/search page:
/restaurants

The SEO audit counted 3 base indexable pages:
/, /areas, /categories

After:
The sitemap now includes the main canonical restaurant directory/search page:
/restaurants

The base indexable pages are now counted as 4:
/, /restaurants, /areas, /categories

Query URLs remain excluded from the sitemap.
Legacy /listings URLs remain excluded from the sitemap and redirect to canonical
/restaurants URLs.
```

Investigation findings:

```text
The indexation strategy already quality-gates restaurant detail pages.
Current audit count before this change showed:
3059 indexable restaurant detail pages / 128 noindex restaurant detail pages.

Dynamic SEO landing pages are controlled by count thresholds, so thinner pages are
not pushed into the sitemap.

Query URLs are handled with noindex/canonical rules and are not present in the sitemap.

Draft guide preview pages are noindex and are not present in the sitemap.

Robots.txt allows crawling and points to the sitemap. This is correct because noindex
pages should be crawlable so Google can see the noindex instruction.
```

Files changed:

```text
src/app/sitemap.ts
scripts/sitemap.test.ts
scripts/check-seo-policy.ts
SEO-AUDIT-STRATEGY.md
```

Verification:

```text
node .\node_modules\tsx\dist\cli.mjs scripts\sitemap.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\seo-policy.test.ts
npm.cmd run audit:seo
npm.cmd run typecheck
```

## 7. URLs And Slugs

Status:

```text
Implemented
```

URL families to check:

```text
Restaurant URLs
Area URLs
Neighborhood URLs
Category URLs
Area + category URLs
Best/search intent URLs
Service URLs
Dietary URLs
Offering URLs
Type URLs
Guide URLs
Trust/support URLs
Legacy redirect URLs
```

What to check:

- Whether URLs are clean, readable, and keyword-friendly.
- Whether slugs avoid unnecessary words, punctuation, or duplication.
- Whether restaurant slugs are unique and stable.
- Whether area/category/facet slugs match user search language.
- Whether old URL patterns redirect cleanly.
- Whether URL patterns are reusable for future directory copies.

Before and after examples:

```text
Before:
Current imported duplicate-name restaurant slugs used numeric suffixes:
/restaurants/hyderabad-darbar-2
/restaurants/chaiiwala-3
/restaurants/saffron-kitchen-2

Some restaurant UI filter links pointed to homepage query URLs:
/?area=redbridge
/?q=halal
/?tube=aldgate

After:
Future imported duplicate-name restaurant slugs now prefer local SEO context before
numbers:
/restaurants/curry-house
/restaurants/curry-house-camden
/restaurants/curry-house-kentish-town

Existing duplicate-style restaurant slugs were migrated to local SEO slugs:
/restaurants/hyderabad-darbar-2 -> /restaurants/hyderabad-darbar-redbridge
/restaurants/chaiiwala-3 -> /restaurants/chaiiwala-camden
/restaurants/saffron-kitchen-2 -> /restaurants/saffron-kitchen-barnet

148 old restaurant slugs now have redirect mappings to their new URLs.

Restaurant UI filter links now point to the canonical restaurant search page:
/restaurants?area=redbridge
/restaurants?q=halal
/restaurants?tube=aldgate
```

Investigation findings:

```text
Current restaurant, area, neighborhood, category, and guide/article slugs are clean,
lowercase, hyphenated, and unique.

The main listing base path is configurable through siteConfig.listingBasePath, which
keeps the URL structure reusable for future directories.

Legacy /listings URLs redirect to canonical /restaurants URLs.

The sitemap excludes query URLs, so filtered search states are not pushed as separate
indexable URLs.

The current listings data has no remaining duplicate-name numeric suffix slugs,
and every old slug redirect target exists as a current restaurant slug.
```

Files changed:

```text
src/lib/directory-import.ts
src/lib/listing-detail-filter-links.ts
src/app/restaurants/[slug]/page.tsx
src/components/ListingCard.tsx
src/data/listing-slug-redirects.ts
data/listings.json
data/listing-search-records.json
scripts/import-directory.test.ts
scripts/url-slug-strategy.test.ts
scripts/dynamic-routes.test.ts
SEO-AUDIT-STRATEGY.md
```

Verification:

```text
node .\node_modules\tsx\dist\cli.mjs scripts\import-directory.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\url-slug-strategy.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\dynamic-routes.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\listing-indexation.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\query-url-governance.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\search-url.test.ts
npm.cmd run typecheck
```

## 8. Image SEO

Status:

```text
Implemented
```

Image families checked:

```text
Homepage hero image
Homepage mobile hero image
Restaurant listing card images
Restaurant listing row images
Restaurant detail hero and gallery images
Guide/article hero images
Guide/article visual block images
Image fallback behavior
Published article image files
```

What was checked:

- Whether important images have descriptive alt text.
- Whether the homepage hero image is visible as an actual image element.
- Whether the homepage hero uses an art-directed mobile crop instead of forcing the
  desktop crop onto narrow screens.
- Whether the homepage hero avoids loading both desktop and mobile images at the
  same time.
- Whether homepage hero images use compressed WebP files.
- Whether restaurant images use reusable, keyword-aware alt text.
- Whether article image alt text avoids generic wording.
- Whether published article local image files exist.
- Whether remote Google-hosted restaurant images have fallback handling.

Investigation findings:

```text
Restaurant images already used a dedicated alt-text helper.

Current restaurant image coverage:
3187 total restaurant listings.
50 listings have at least one image.
3137 listings do not currently have imported images.
235 total restaurant images are present.

Most restaurant images are remote Google-hosted images, so fallback handling and
optimization bypass behavior are important.

Published article image files exist. Draft article image files are allowed to be
missing until the drafts are prepared for publication.
```

Before and after examples:

```text
Before:
The homepage hero image was only a CSS background image with an aria-label.

After:
The homepage hero image now renders as an image with configured alt text:
Indian family sharing curry and naan in a London restaurant with Big Ben outside

Mobile follow-up:
The homepage now uses a dedicated portrait mobile crop:
/images/homepage/indian-restaurants-london-hero-mobile.webp

This avoids forcing the wide 16:9 desktop image into a tall phone layout.

Performance follow-up:
The homepage now uses a responsive picture element so mobile downloads the mobile
WebP and desktop downloads the desktop WebP.

Before:
/images/homepage/indian-restaurants-london-hero.png
1,938,474 bytes

/images/homepage/indian-restaurants-london-hero-mobile.png
2,119,663 bytes

After:
/images/homepage/indian-restaurants-london-hero.webp
53,206 bytes

/images/homepage/indian-restaurants-london-hero-mobile.webp
46,512 bytes

Before:
Indian Food in London: A Beginner's Guide visual guide

After:
Indian dishes in London showing curries, rice, naan, chutneys, and shared dining

Before:
Indian Food in London: A Beginner's Guide visual summary

After:
Diagram comparing Indian restaurant styles, London areas, dietary options, and service choices
```

Files changed:

```text
src/components/DirectoryListingsView.tsx
src/config/site.ts
public/images/homepage/indian-restaurants-london-hero-mobile.png
public/images/homepage/indian-restaurants-london-hero.webp
public/images/homepage/indian-restaurants-london-hero-mobile.webp
content/articles/indian-food-in-london-guide.json
scripts/image-seo.test.ts
SEO-AUDIT-STRATEGY.md
```

Verification:

```text
node .\node_modules\tsx\dist\cli.mjs scripts\image-seo.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\listing-image-alt.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\directory-image.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\article-rendering.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\homepage-performance-regression.test.ts
npm.cmd run typecheck

Manual browser check:
Mobile viewport uses indian-restaurants-london-hero-mobile.webp.
Desktop viewport uses indian-restaurants-london-hero.webp.
The rendered homepage HTML no longer includes duplicate hero image preloads.
```

## 9. Freshness And Update Signals

Status:

```text
Implemented
```

Page families checked:

```text
Homepage
SEO landing pages: areas, categories, area-category, services, dietary, types, offerings, best pages
Restaurant detail pages
Guide/article pages
Trust pages including methodology and suggest-update
Sitemap lastModified dates
Freshness audit output
```

Investigation findings:

```text
The directory already had an internal freshness audit.

Directory last updated: 2026-05-18
Days since directory update on 2026-06-28: 41
Listings checked: 3,187
OK: 36
Medium risk: 3,023
High risk: 128
Missing hours: 129
Missing images: 3,137
Missing reviews: 68
Missing contact actions: 31

Because many listings are missing images and some lack hours/reviews/contact actions,
the site should not claim that every restaurant is verified today.
The safer SEO/trust signal is a dataset-level update date.
```

Decision:

```text
Use one honest reusable freshness label:
Directory data last updated: 18 May 2026

Keep the date connected to SEO_POLICY.directoryLastModified so sitemap dates,
page labels, and future freshness checks can stay aligned.
```

Before and after examples:

```text
Before:
Updated restaurant details

After:
Directory data last updated: 18 May 2026

Before:
Restaurant detail pages had no visible directory update signal.

After:
Restaurant detail pages show:
Directory data last updated: 18 May 2026

Before:
Guide pages had datePublished/dateModified in structured data, but no visible
published/updated dates in the article header.

After:
Guide article headers show:
Published: 13 June 2026
Updated: 13 June 2026
```

Files changed:

```text
src/lib/seo-policy.ts
src/components/DirectoryFreshnessLabel.tsx
src/components/DirectoryListingsView.tsx
src/components/SeoLandingPage.tsx
src/app/restaurants/[slug]/page.tsx
src/components/TrustPage.tsx
src/components/GuideArticleContent.tsx
scripts/freshness-signals.test.ts
SEO-AUDIT-STRATEGY.md
```

Verification:

```text
node .\node_modules\tsx\dist\cli.mjs scripts\freshness-signals.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\metadata-description.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\sitemap.test.ts
npm.cmd run audit:freshness
npm.cmd run typecheck
```

## 10. Generated Page Content Uniqueness

Status:

```text
Implemented
```

Page families checked:

```text
Area pages
Category pages
Area-category pages
Service pages
Dietary pages
Type pages
Best/search-intent pages
```

Investigation findings:

```text
The generated SEO landing pages already had data-led hero descriptions,
information-gain blocks, related links, FAQs, and noindex rules for thin pages.

The remaining duplication risk was mainly in the guide body text. Pages in the
same family used very similar paragraphs with only the area/category/facet label
changed.

Highest sampled similarity before implementation:
service:takeaway <> type:casual-dining: 0.90
area:harrow <> area:redbridge: 0.88
service:takeaway <> dietary:halal: 0.88
area-category:harrow-indian <> area-category:redbridge-indian: 0.87
area:harrow <> area:barnet: 0.85
category:indian <> category:pakistani: 0.83
```

Decision:

```text
Keep the existing page titles, H1s, metadata, indexation rules, internal links,
and information-gain blocks.

Replace the repeated guide-body copy with data-led guide copy generated from
the actual matching listings for each page.
```

Before and after examples:

```text
Before:
Harrow indian restaurants can be compared by cuisine, review strength, budget,
and practical details such as takeaway, delivery, and opening hours.

After:
Indian Restaurants in Harrow currently covers 181 listings, and 181 include
Google review data. Use the page to compare local clusters in Harrow, cuisine
overlaps such as Indian, Middle Eastern, and Pakistani, and transport signals
around Harrow & Wealdstone Station and Rayners Lane Underground Station.

Before:
This feature-led list focuses on indian restaurants where takeaway is available.

After:
Indian Restaurants with Takeaway in London covers 2,969 listings for the
takeaway service intent, and 2,903 include Google review data. Compare ordering
practicalities such as 2,969 takeaway matches, 2,714 delivery matches, and
strong areas like Harrow, Hounslow, and Westminster.

Before:
This page narrows the directory to one area and one cuisine or category.

After:
Indian Restaurants in Redbridge has 71 matching listings, and 71 include Google
review data. This combined page is useful for neighborhood coverage in Ilford,
71 takeaway matches, 67 delivery matches, and priced listings where available.
```

Files changed:

```text
src/lib/seo-pages.ts
scripts/content-uniqueness.test.ts
SEO-AUDIT-STRATEGY.md
```

Verification:

```text
node .\node_modules\tsx\dist\cli.mjs scripts\content-uniqueness.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\seo-pages.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\seo-landing-page-render.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\information-gain.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\metadata-description.test.ts
```

## 11. Trust, Source Transparency, And E-E-A-T

Status:

```text
Implemented
```

Page families checked:

```text
/about
/methodology
/suggest-update
Homepage Organization schema
Homepage WebSite schema
```

Investigation findings:

```text
The site already had useful trust pages: About, Contact, Privacy Policy, Terms,
Methodology, and Suggest an Update.

The footer already linked to the trust pages.

The main gap was source transparency. The About and Methodology pages did not
clearly explain that the directory is built from imported local business data,
or that Google rating, Google review count, and Google review links are used
where available.

The site has real rating and review-count fields, but it does not currently
store a star-by-star review distribution in the imported listing dataset.
```

Decision:

```text
Strengthen trust-page copy instead of changing page layouts.

Explain the data basis clearly: imported local business data, restaurant names,
areas, categories, addresses, opening hours, service options, Google rating,
Google review count, and Google review links where available.

Add a clear review limit: the directory stores total Google rating and Google
review count, but star-by-star review distribution is not currently imported.

Tell visitors to check the restaurant profile and Google listing before relying
on current ratings, hours, menus, prices, services, or availability.

Add descriptions to Organization and WebSite schema so search engines get a
clearer site-level trust/context signal.
```

Before and after examples:

```text
Before About page:
Indian Restaurants London helps visitors compare Indian restaurants in London
by area, cuisine, service options, ratings, review counts, transport links,
and dining details.

After About page:
Indian Restaurants London helps visitors compare Indian restaurants in London
by area, cuisine, service options, Google rating, Google review count,
transport links, opening hours, and dining details.

New About H2:
Restaurant Data Sources
```

```text
Before Methodology page:
Pages are built from the current directory dataset and focus on restaurants
with enough useful information to help visitors compare options.

After Methodology page:
The directory uses imported local business data and Google review signals where
available, including Google rating, Google review count, and Google review links
for comparing restaurants.

New Methodology H2s:
Data Sources and Review Signals
Review and Rating Limits
```

```text
Before schema:
Organization and WebSite schema included name and URL.

After schema:
Organization and WebSite schema include a description explaining that this is
an Indian restaurants in London directory using imported local business data,
ratings, review counts, areas, services, and contact links where available.
```

Files changed:

```text
src/lib/trust-pages.ts
src/lib/structured-data.ts
scripts/trust-source-transparency.test.ts
scripts/trust-page-headings.test.ts
scripts/structured-data.test.ts
SEO-AUDIT-STRATEGY.md
```

Verification:

```text
node .\node_modules\tsx\dist\cli.mjs scripts\trust-source-transparency.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\trust-page-headings.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\trust-pages.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\structured-data.test.ts
npm.cmd run typecheck
```

## 12. Canonical Tags And Duplicate URL Control

Status:

```text
Implemented
```

Page families checked:

```text
Homepage
/restaurants
/areas
/categories
/guides
Trust/support pages
Restaurant detail pages
Generated SEO landing pages
Guide article pages
Draft guide preview pages
/compare
Sitemap
Legacy /listings redirects
Query URLs
```

Investigation findings:

```text
The main SEO pages already had canonical metadata.

The sitemap already excluded query URLs and legacy /listings URLs.

Old /listings routes redirect to canonical /restaurants routes.

Old restaurant slugs redirect to the new canonical restaurant detail URLs.

Generated SEO landing pages already canonicalize to the clean route and noindex
query-modified states.

The gap was /compare. It is a saved-listing utility page, but it did not declare
a canonical URL or noindex rule.
```

Decision:

```text
Keep /compare accessible to users.

Add canonical /compare so the page has a clear self-reference.

Add noindex, follow because /compare is a utility page, not a strong Google
landing page.

Add a dedicated canonical-governance test so duplicate URL rules are protected
in one place.
```

Before and after examples:

```text
Before /compare metadata:
title
description

After /compare metadata:
title
description
canonical: /compare
robots: noindex, follow
```

```text
Before test coverage:
Canonical behavior was covered across several separate tests, but /compare was
not checked.

After test coverage:
scripts/canonical-governance.test.ts checks core canonicals, restaurant detail
canonicals, generated SEO noindex behavior, guide preview noindex behavior,
/compare noindex behavior, and sitemap duplicate URL exclusions.
```

Files changed:

```text
src/app/compare/page.tsx
scripts/canonical-governance.test.ts
SEO-AUDIT-STRATEGY.md
```

Verification:

```text
node .\node_modules\tsx\dist\cli.mjs scripts\canonical-governance.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\query-url-governance.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\sitemap.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\metadata-title.test.ts
npm.cmd run typecheck
```

## 13. Open Graph And Social Sharing Metadata

Status:

```text
Implemented
```

Page families checked:

```text
Homepage
/restaurants
/areas
/categories
/guides
Generated SEO landing pages
Guide article pages
Draft guide preview pages
Trust/support pages
/compare
Restaurant detail pages
```

Investigation findings:

```text
Restaurant detail pages already had Open Graph and Twitter metadata.

Most other page families only had title, description, and canonical metadata.

Guide articles had strong visible hero images and Article schema, but their page
metadata did not expose those images as Open Graph or Twitter card images.

Most restaurant listings do not currently have imported images, so restaurant
sharing needed a default image fallback.
```

Decision:

```text
Create a reusable social metadata helper.

Use the homepage hero WebP as the default site-wide social image.

Use each page's existing SEO title, description, and canonical path for Open
Graph and Twitter metadata.

Use article hero images for guide article social cards when available.

Use the site-wide hero image as the fallback restaurant share image when a
restaurant has no imported image.
```

Before and after examples:

```text
Before homepage metadata:
title
description
canonical

After homepage metadata:
title
description
canonical
Open Graph title, description, URL, site name, and image
Twitter summary_large_image card, title, description, and image
```

```text
Before guide article metadata:
What Is Indian Food? used its title, description, and canonical URL only.

After guide article metadata:
What Is Indian Food? also shares with:
/images/articles/what-is-indian-food/hero.png
```

```text
Before restaurant with no image:
Shared with no image.

After restaurant with no image:
Shares with the default site image:
/images/homepage/indian-restaurants-london-hero.webp
```

Files changed:

```text
src/lib/share-metadata.ts
src/app/page.tsx
src/app/restaurants/page.tsx
src/app/areas/page.tsx
src/app/categories/page.tsx
src/app/guides/page.tsx
src/app/compare/page.tsx
src/lib/trust-pages.ts
src/app/about/page.tsx
src/app/contact/page.tsx
src/app/privacy-policy/page.tsx
src/app/terms/page.tsx
src/app/methodology/page.tsx
src/app/suggest-update/page.tsx
src/lib/seo-pages.ts
src/lib/articles.ts
scripts/social-metadata.test.ts
scripts/share-metadata.test.ts
SEO-AUDIT-STRATEGY.md
```

Verification:

```text
node .\node_modules\tsx\dist\cli.mjs scripts\social-metadata.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\share-metadata.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\articles.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\seo-pages.test.ts
npm.cmd run typecheck
```

## 14. Core Web Vitals And Performance Image Cleanup

Status:

```text
Implemented
```

Page families checked:

```text
Homepage
Guide article pages
Social share images
Static export image assets
Homepage performance guardrails
```

Investigation findings:

```text
The homepage performance guardrail already passed.

The homepage and /restaurants first-load JavaScript stayed around 138 kB in the
normal production build.

/compare is heavy at about 857 kB first-load JavaScript because it loads the
shortlist/search-record data chunk, but /compare is noindex and the homepage
does not prefetch that route.

The static export included old large PNG source images even though the homepage
uses optimized WebP hero files.

The published What Is Indian Food guide used a 2.64 MB PNG hero image.
```

Decision:

```text
Keep the existing homepage WebP hero images.

Remove unused homepage PNG source images from public/images so they are not
copied into the static export.

Convert the published guide article hero image from PNG to WebP and update the
article content/social metadata to use the optimized image.

Add image-performance assertions so large local PNG assets do not come back
accidentally.
```

Before and after examples:

```text
Before:
public/images/homepage/indian-restaurants-london-hero.png: 1.85 MB
public/images/homepage/indian-restaurants-london-hero-mobile.png: 2.02 MB
public/images/articles/what-is-indian-food/hero.png: 2.64 MB

After:
public/images/homepage/indian-restaurants-london-hero.webp: 52 KB
public/images/homepage/indian-restaurants-london-hero-mobile.webp: 45.4 KB
public/images/articles/what-is-indian-food/hero.webp: 115.6 KB
```

```text
Before article hero reference:
/images/articles/what-is-indian-food/hero.png

After article hero reference:
/images/articles/what-is-indian-food/hero.webp
```

Files changed:

```text
content/articles/what-is-indian-food.json
public/images/articles/what-is-indian-food/hero.webp
public/images/articles/what-is-indian-food/hero.png
public/images/homepage/indian-restaurants-london-hero.png
public/images/homepage/indian-restaurants-london-hero-mobile.png
scripts/image-seo.test.ts
scripts/social-metadata.test.ts
SEO-AUDIT-STRATEGY.md
```

Verification:

```text
node .\node_modules\tsx\dist\cli.mjs scripts\image-seo.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\article-rendering.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\articles.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\social-metadata.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\homepage-performance-regression.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\static-route-params-performance.test.ts
npm.cmd run typecheck
```

## 15. Local Business Data Completeness

Status:

```text
Implemented
```

Page families checked:

```text
Restaurant detail pages
Restaurant schema
Listing contact/action rendering
Listing indexation scoring
Source import report
```

Investigation findings:

```text
Strong fields:
Full address: 3,187 / 3,187
Latitude/longitude: 3,187 / 3,187
Opening hours: 3,058 / 3,187
Phone: 3,007 / 3,187
Google reviews link: 3,112 / 3,187
Rating/review count: 3,119 / 3,187
Service options: 3,152 / 3,187

Weak fields:
Google Maps URL: 0 / 3,187
Menu link: 2 / 3,187
Price range: 1,289 / 3,187
Reserve link: 1,270 / 3,187
Order online link: 1,279 / 3,187
Website: 2,526 / 3,187
Images: 50 / 3,187
```

Decision:

```text
Do not invent missing menu, price, booking, order, website, or image data.

Use the existing map URL helper for restaurant schema so `hasMap` can be present
when an explicit Google Maps URL is missing but the listing has enough address
or location detail to build a Google Maps search URL.

Keep restaurant detail UI behavior unchanged because it already hides missing
actions and sections.
```

Before and after examples:

```text
Before:
Restaurant schema emitted hasMap only when listing.location.googleMapsUrl existed.

Because imported Google Maps URL coverage is 0%, restaurant schema had no hasMap
for the directory dataset.

After:
Restaurant schema uses the same map URL helper as the UI.

If an explicit maps URL exists, it is used.
If not, the schema gets a Google Maps search URL built from restaurant name and
address details.
```

Files changed:

```text
src/lib/structured-data.ts
scripts/structured-data.test.ts
SEO-AUDIT-STRATEGY.md
```

Verification:

```text
node .\node_modules\tsx\dist\cli.mjs scripts\structured-data.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\listing-links.test.ts
node .\node_modules\tsx\dist\cli.mjs scripts\seo-pages.test.ts
npm.cmd run typecheck
```

## 16. Guide Content Hygiene And Publishing Records

Status:

```text
Implemented
```

Page families checked:

```text
/guides
/guides/[slug]
/guides/preview/[slug]
Guide article content JSON
Guide article planning JSON
```

Investigation findings:

```text
Only one guide is currently published:
/guides/what-is-indian-food

Draft guide previews are noindex, nofollow and excluded from the public guide
index and sitemap.

The published What Is Indian Food guide has:
6 content sections
4 FAQs
3 internal links
5 research sources
An optimized WebP hero image
A local visual-summary SVG

Issue found:
content/articles/what-is-indian-food.json was published, but
content/article-plan.json still marked the same guide as drafted.
```

Decision:

```text
Correct the article planning record so the published guide is also marked
published in content/article-plan.json.

Add a guide-content hygiene regression test so published guides must have:
- matching published status in the article plan
- at least 4 sections
- at least 3 research sources
- at least 2 internal links
- SEO meta descriptions between 90 and 160 characters
- no placeholder copy
- existing local images
- optimized WebP raster images under 450 KB

Keep draft guide image assets allowed to be missing because draft preview pages
are not public SEO pages yet.
```

Before and after examples:

```text
Before:
content/articles/what-is-indian-food.json
status: published

content/article-plan.json
status: drafted

After:
content/articles/what-is-indian-food.json
status: published

content/article-plan.json
status: published
```

Files changed:

```text
content/article-plan.json
scripts/guide-content-hygiene.test.ts
SEO-AUDIT-STRATEGY.md
```

Verification:

```text
npx.cmd tsx scripts/guide-content-hygiene.test.ts
npm.cmd run typecheck
npm.cmd test
```

## 17. Restaurant Review Source Trust

Status:

```text
Implemented
```

Page families checked:

```text
/restaurants/[slug]
Restaurant review section
Restaurant image fallback section
Restaurant structured data
Imported listing dataset
```

Investigation findings:

```text
3,119 / 3,187 listings have rating and review count.
3,112 / 3,187 listings have Google review links.
2,878 / 3,187 listings are marked Google verified.
50 / 3,187 listings have restaurant images.
0 / 3,187 listings currently have star-by-star reviewDistribution data.

The restaurant page passed listing.reviewDistribution into ReviewSummary, but
ReviewSummary calculated a fake fallback star distribution when the value was
missing.
```

Decision:

```text
Do not invent star-by-star review distribution from total review count.

Keep showing the real imported Google rating and Google review count.

Only show distribution bars when reviewDistribution exists in the listing data.

When distribution is missing, show a trust note explaining that rating and
review count are imported from Google Business/Profile data where available,
and that star-by-star distribution is not currently stored for that listing.
```

Before and after examples:

```text
Before:
A listing with 254 Google reviews and no reviewDistribution showed estimated
bar counts such as 80% excellent, 10% good, 5% average, 3% poor, and 2%
terrible.

After:
The listing still shows its real rating and total Google review count, but no
estimated bar chart is shown.

Instead the page explains:
Rating and review count are imported from Google Business/Profile data where
available. Star-by-star distribution is not currently stored for this listing.
```

Files changed:

```text
src/components/ReviewSummary.tsx
scripts/review-summary-trust.test.ts
SEO-AUDIT-STRATEGY.md
```

Verification:

```text
npx.cmd tsx scripts/review-summary-trust.test.ts
npm.cmd run typecheck
npm.cmd test
```

## 18. Restaurant Description Wording

Status:

```text
Implemented
```

Page families checked:

```text
/restaurants/[slug]
Restaurant visible descriptions
Restaurant meta descriptions
Directory import description generator
Imported listing dataset
```

Investigation findings:

```text
The generated restaurant descriptions were factual, but many sounded too
database-like because they used "The listing includes".

The old generator also placed exact Google review counts into many descriptions.
Those counts are useful on the restaurant page, but repeated review numbers made
the descriptions feel mechanical.

Other wording issues found:
1 Google reviews
Hackney, Hackney style repeated locations
Indian and Indian cuisine wording
Restaurant . punctuation in imported names
Awkward "and nearby" / "access near" phrases
Unclear "You can compare" wording in individual restaurant descriptions
```

Decision:

```text
Update the shared listing-description generator rather than manually editing
individual restaurant records.

Remove "The listing includes" from visible descriptions and meta descriptions.

Stop adding exact Google review counts to generated descriptions by default.

Remove unclear "compare" wording from restaurant visible descriptions and meta
descriptions. Keep comparison language for list/facet pages where visitors are
actually comparing multiple restaurants.

Make the first sentence answer the user query directly:
[Restaurant Name] is an [Cuisine] restaurant in [Area] serving [Cuisine] food.

Keep descriptions factual and page-specific by using cuisine, area, service
options, dietary options, price level, transport, and nearby landmark signals.

Regenerate data/listings.json and data/listing-search-records.json from the
Outscraper CSV so every restaurant receives the improved wording.
```

Before and after examples:

```text
Before:
The Curry Club London serves Indian and Punjabi food in Ilford, Redbridge. The
listing includes vegan options, takeaway, delivery, and dine-in, and 254 Google
reviews.

After:
The Curry Club London is an Indian restaurant in Ilford, Redbridge serving
Indian and Punjabi food. Details include vegan options.

Before:
Mital's Kitchen serves Indian food in Ilford, Redbridge. The listing includes 1
Google reviews, dine-in, and access near Barkingside Underground Station.

After:
Mital's Kitchen is an Indian restaurant in Ilford, Redbridge serving Indian food.
Details include dine-in service and transport access near Barkingside Underground
Station.

Before:
Great Indian Food is an Indian restaurant in Hackney, Hackney near Hackney
Central / Mare Street.

After:
Great Indian Food is an Indian restaurant in Hackney, London serving Indian food.
Details include takeaway, delivery, and dine-in service.
```

Files changed:

```text
src/lib/listing-description.ts
scripts/listing-description-quality.test.ts
scripts/import-directory.test.ts
scripts/metadata-description.test.ts
data/listings.json
data/listing-search-records.json
data/import-report.md
SEO-AUDIT-STRATEGY.md
```

Verification:

```text
npx.cmd tsx scripts/import-directory.test.ts
npx.cmd tsx scripts/listing-description-quality.test.ts
npx.cmd tsx scripts/metadata-description.test.ts
npm.cmd run typecheck
npm.cmd test
```

## 19. Restaurant Detail Internal Links

Status:

```text
Implemented
```

Page families checked:

```text
/restaurants/[slug]
Restaurant breadcrumb links
Restaurant tag pills
Restaurant area info card
Restaurant contextual explore links
Restaurant similar listing links
Internal link governance audit
```

Investigation findings:

```text
Restaurant detail pages already had several useful internal-link surfaces:
breadcrumb links, tag pills, info cards, detail pills, nearby filters, contextual
Explore groups, and similar restaurant cards.

The contextual Explore section already used clean SEO URLs such as:
/areas/redbridge
/categories/indian
/areas/redbridge/categories/indian
/services/takeaway
/dietary/halal

Issues found:
The prominent Area info card linked to a query URL:
/restaurants?area=redbridge

Some top tag pills fell back to query URLs even when a clean SEO page existed.

The Similar cuisine Explore group still used vague "Compare" wording.
```

Decision:

```text
Prefer clean, indexable SEO routes from restaurant detail pages whenever the
tag has a known page family.

Use clean area URLs for the area info card.

Use clean category, dietary, and type URLs for matching tag pills.

Keep query URLs only as fallback for tags that do not have a clean SEO page.

Replace vague "Compare" wording in restaurant contextual bridge copy with direct
browse/explore wording.
```

Before and after examples:

```text
Before:
Area card:
/restaurants?area=redbridge

After:
Area card:
/areas/redbridge

Before:
Category tag:
/restaurants?q=Indian

After:
Category tag:
/categories/indian

Before:
Similar cuisine description:
Compare Indian restaurants in London with similar cuisine styles and dining
options.

After:
Similar cuisine description:
Browse Indian restaurants in London by related cuisine styles and dining
options.
```

Files changed:

```text
src/app/restaurants/[slug]/page.tsx
src/lib/directory-growth.ts
scripts/listing-detail-internal-links.test.ts
scripts/listing-contextual-bridges.test.ts
SEO-AUDIT-STRATEGY.md
```

Verification:

```text
npx.cmd tsx scripts/listing-detail-internal-links.test.ts
npx.cmd tsx scripts/listing-contextual-bridges.test.ts
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

## 20. Restaurants Index SEO Headings

Page family checked:

```text
/restaurants
```

Source files checked:

```text
src/app/restaurants/page.tsx
src/components/DirectoryListingsPage.tsx
src/lib/directory-listings-model.ts
src/lib/listing-search.ts
```

Current behavior before changes:

The page metadata was already keyword-focused:

```text
Title:
Search Indian Restaurants in London

Meta description:
Search Indian restaurants in London by area, cuisine, rating, service options,
dietary needs, transport links, and dining style.
```

The visible page headings were weaker than the metadata:

```text
H1:
Find restaurants in London

H2:
3,187 restaurants found
Best Restaurant Searches
Recently Added Restaurants
Useful Restaurant Filters
Top areas
Cuisine hubs
```

SEO issue found:

The `/restaurants` page is an important indexable directory page, but its visible
H1 and several H2s did not clearly include the primary keyword family:

```text
Indian restaurants in London
Indian restaurant searches
Indian restaurant cuisine hubs
```

Decision made:

Give `/restaurants` keyword-focused visible headings while keeping the wording
natural and reusable for future copied directories.

Before and after examples:

```text
Before:
Find restaurants in London

After:
Find Indian Restaurants in London

Before:
3,187 restaurants found

After:
3,187 Indian Restaurants in London Found

Before:
Best Restaurant Searches

After:
Popular Indian Restaurant Searches

Before:
Top areas

After:
Top London Areas for Indian Restaurants
```

Implementation notes:

The visible `/restaurants` copy now uses a reusable helper:

```text
src/lib/directory-index-headings.ts
```

This keeps the current Indian restaurant output strong while allowing future
directory copies, such as Mexican restaurants in London, to generate equivalent
wording from configuration.

Files changed:

```text
src/app/restaurants/page.tsx
src/components/DirectoryListingsPage.tsx
src/lib/directory-index-headings.ts
src/lib/directory-listings-model.ts
src/lib/listing-search.ts
scripts/restaurants-index-seo.test.ts
SEO-AUDIT-STRATEGY.md
```

Verification:

```text
npx.cmd tsx scripts/restaurants-index-seo.test.ts
```

## 21. H3 Cleanup For Restaurant Detail And SEO Landing Pages

Page families checked:

```text
/restaurants/[slug]
/areas/[area]
/categories/[category]
/areas/[area]/categories/[category]
/best/[slug]
/services/[service]
/dietary/[dietary]
/offerings/[offering]
/types/[type]
```

Source files checked:

```text
src/app/restaurants/[slug]/page.tsx
src/lib/directory-growth.ts
src/lib/seo-pages.ts
src/components/SeoLandingPage.tsx
src/components/GuideArticleContent.tsx
```

Current behavior before changes:

Restaurant detail H3s included several weak or utility-style labels:

```text
Local area
Similar cuisine
Features & dietary
Social links
```

SEO landing information-gain cards used generic H3s:

```text
Price and review signals
Best-fit guidance
Practical visit notes
```

Guide article H3s were reviewed and left unchanged because they already describe
article-specific data blocks and comparison tables without creating heading
noise.

SEO issue found:

The H3 layer had useful structure, but some headings were either too generic or
visual-only labels. On restaurant detail pages, contextual H3s should support
the page's local Indian restaurant topic. Visual labels such as social links do
not need heading semantics.

Decision made:

Make restaurant detail contextual H3s keyword-focused, convert `Social links`
from an H3 to styled paragraph text, and make reusable SEO landing information
H3s mention Indian restaurants naturally.

Before and after examples:

```text
Before:
Local area

After:
Indian Restaurants Near Redbridge

Before:
Similar cuisine

After:
Similar Indian Cuisine in London

Before:
Features & dietary

After:
Indian Restaurants by Features and Dietary Needs

Before:
Social links as an H3

After:
Social links as styled paragraph text

Before:
Price and review signals
Best-fit guidance
Practical visit notes

After:
Indian Restaurant Price and Review Signals
How to Choose the Right Indian Restaurant
Practical Visit Notes for Indian Restaurants
```

Files changed:

```text
src/app/restaurants/[slug]/page.tsx
src/lib/directory-growth.ts
src/lib/seo-pages.ts
scripts/listing-detail-headings.test.ts
scripts/listing-contextual-bridges.test.ts
scripts/seo-landing-page-render.test.ts
SEO-AUDIT-STRATEGY.md
```

Verification:

```text
npx.cmd tsx scripts/listing-detail-headings.test.ts
npx.cmd tsx scripts/listing-contextual-bridges.test.ts
npx.cmd tsx scripts/seo-landing-page-render.test.ts
```

## 22. Missing Restaurant Category Data

Page/data family checked:

```text
Restaurant category data from the imported Outscraper CSV
Category hubs and area/category hub inputs
Restaurant detail descriptions and schema cuisine values
```

Source files checked:

```text
data/Indian Restaurants - Outscraper - Test.csv
data/listings.json
data/listing-search-records.json
data/import-report.md
src/lib/directory-import.ts
```

Current behavior before changes:

The source CSV had many blank `Cuisine Type` rows:

```text
Source rows: 3,188
Blank Cuisine Type rows: 758
Imported listings: 3,187
Imported listings with empty categories: 757
```

The issue was not an importer mapping failure. The `Cuisine Type` column was
blank in the source data for these rows.

SEO issue found:

Missing restaurant categories reduce:

- category hub coverage
- area/category hub coverage
- restaurant detail description specificity
- `servesCuisine` schema completeness
- internal links from category tags

However, not every blank category should become `Indian`. Some high-review
blank-category listings are broad venues or potentially out-of-scope for an
Indian restaurant directory, such as food halls, pubs, hotels, and non-Indian
restaurants.

Decision made:

Add conservative import-time category inference for obvious cases only. The
inference uses stable cuisine wording from the restaurant name, not unreliable
generated meta descriptions. Unclear rows remain uncategorized and are written
to a manual review file.

Before and after examples:

```text
Before:
Moj Spice Indian Takeaway
categories: []

After:
Moj Spice Indian Takeaway
categories: [Indian]

Before:
Chennai Dosa Surbiton
categories: []

After:
Chennai Dosa Surbiton
categories: [South Indian, Indian]

Before:
Bang Bang Oriental Foodhall
categories: []

After:
Bang Bang Oriental Foodhall
categories: []
manual_review in data/category-inference-review.md

Before:
Restaurant Gordon Ramsay
categories: []

After:
Restaurant Gordon Ramsay
categories: []
manual_review in data/category-inference-review.md
```

Post-change category review result:

```text
Rows with blank source category: 757
Categories inferred: 265
Manual review required: 492
Imported listings with empty categories after inference: 492
```

Files changed:

```text
src/lib/directory-import.ts
scripts/import-directory.ts
scripts/import-directory.test.ts
src/data/listings.ts
data/listings.json
data/listing-search-records.json
data/import-report.md
data/category-inference-review.md
SEO-AUDIT-STRATEGY.md
```

Verification:

```text
npx.cmd tsx scripts/import-directory.test.ts
npm.cmd run import:directory -- "data/Indian Restaurants - Outscraper - Test.csv"
```

## 23. Local Business Data Quality Guard

Status:

```text
Implemented
```

Page/data family checked:

```text
Restaurant listing dataset
Restaurant detail local business fields
Template readiness audit
```

Source files checked:

```text
data/listings.json
src/data/listings.ts
src/lib/template-readiness-audit.ts
src/lib/structured-data.ts
src/lib/listing-links.ts
```

Current data profile:

```text
Total listings: 3,187
Categories: 2,695 / 3,187
Coordinates: 3,187 / 3,187
Core location fields: 3,186 / 3,187
Phone: 3,007 / 3,187
Website: 2,526 / 3,187
Working hours: 3,058 / 3,187
Rating and review count: 3,119 / 3,187
```

SEO/data quality issues found:

```text
Yummy Dosa Catering has a London address but coordinates outside London:
47.73855, 12.5088275

The Indian Dinner Box is missing address, postcode, area, neighborhood, and
borough. It only has city-level London location text plus coordinates.

81 duplicate phone-number groups exist. These are informational because shared
phone numbers can be valid for chains, market stalls, ghost kitchens, or related
brands, so they should be reviewed manually rather than auto-blocked.
```

Decision made:

```text
Add an automated local business data quality guard.

The guard flags:
- London listings with coordinates outside expected London bounds
- listings missing core location fields
- duplicate slugs
- duplicate Google place IDs
- invalid contact URLs
- duplicate phone-number groups as informational review items

Do not invent missing business data. The guard reports issues so they can be
fixed from source data or reviewed manually.
```

Before and after examples:

```text
Before:
npm run audit:template did not surface the Yummy Dosa Catering coordinate issue.

After:
npm run audit:template reports:
1 listings have coordinates outside expected London bounds.
Example: Yummy Dosa Catering (yummy-dosa-catering)

Before:
npm run audit:template did not surface listings missing location fields.

After:
npm run audit:template reports:
1 listings are missing core location fields.
Example: The Indian Dinner Box (the-indian-dinner-box)
```

Files changed:

```text
src/lib/local-business-data-quality.ts
src/lib/template-readiness-audit.ts
scripts/local-business-data-quality.test.ts
scripts/template-readiness-audit.test.ts
SEO-AUDIT-STRATEGY.md
```

Verification:

```text
npx.cmd tsx scripts/local-business-data-quality.test.ts
npx.cmd tsx scripts/template-readiness-audit.test.ts
npm.cmd run audit:template
npm.cmd run typecheck
```

## 24. Local Business Data Corrections

Status:

```text
Implemented
```

Records corrected:

```text
Yummy Dosa Catering / Yummy Dosa
The Indian Dinner Box
```

Issue:

```text
Yummy Dosa Catering had a London/Barking address but non-UK coordinates:
47.73855, 12.5088275

The Indian Dinner Box had coordinates and review data, but no address, postcode,
area, neighborhood, or borough.
```

Decision made:

```text
Add source-specific import overrides keyed by Google place ID. This keeps the
corrections stable when the directory data is regenerated from the Outscraper
CSV.

The Yummy Dosa correction uses the official restaurant website for address and
phone details, and geocoded coordinates for 68 Cranbrook Rd.

The Indian Dinner Box correction fills the missing location fields from public
business/address evidence and keeps the existing imported phone number because
the phone sources conflict.
```

Before and after examples:

```text
Before:
Yummy Dosa Catering
address: 5 Farr Ave, London, IG11 0NY
area: Barking & Dagenham
coordinates: 47.73855, 12.5088275

After:
Yummy Dosa
address: 68 Cranbrook Rd, Ilford, IG1 4NH, London
area: Redbridge
neighborhood: Ilford
coordinates: 51.5606646, 0.0697829
phone: +44 20 8637 3026
alternate phone: +44 7776 675146

Before:
The Indian Dinner Box
fullAddress: London
area: missing
neighborhood: missing
postcode: missing
coordinates: 51.4893323, -0.0881552

After:
The Indian Dinner Box
address: 6 Trinity Street
area: Southwark
neighborhood: The Borough
postcode: SE1 1DB
coordinates: 51.4996898, -0.0951699
```

Files changed:

```text
src/lib/directory-import.ts
scripts/import-directory.test.ts
src/data/listings.ts
data/listings.json
data/listing-search-records.json
data/import-report.md
data/category-inference-review.md
SEO-AUDIT-STRATEGY.md
```

Verification:

```text
npx.cmd tsx scripts/import-directory.test.ts
npm.cmd run import:directory -- "data/Indian Restaurants - Outscraper - Test.csv"
npx.cmd tsx scripts/local-business-data-quality.test.ts
npm.cmd run audit:template
```

Post-change audit result:

```text
The coordinate warning and missing-core-location warning no longer appear in
npm.cmd run audit:template.

Template readiness now reports:
Warnings: 4
Info: 3

Remaining warnings are the known held/non-data items:
- missing NEXT_PUBLIC_SITE_URL blocker
- duplicate/skipped import rows
- missing-category warnings
- missing-image warnings
```

## 25. Duplicate Source Row Merge

Status:

```text
Implemented
```

Record checked:

```text
Monty’s Nepalese Cuisine / MONTYS NEPALESE CUISINE
86 Northfield Ave, W13 9RR
```

Issue:

```text
The source CSV had two rows for the same real-world restaurant location:

Row 1735:
Monty’s Nepalese Cuisine
86 Northfield Ave
Website: http://www.kathmandunepalesecuisine.co.uk/
Categories: Indian, Nepalese
Rating/reviews: 5 / 255

Row 3164:
MONTYS NEPALESE CUISINE
86 Northfield Ave
Website: https://montysnepalesecuisine.com/
Type: Casual Dining
Rating/reviews: 5 / 239
Booking links present
```

SEO risk:

```text
Importing both rows would create near-duplicate restaurant pages for the same
address and phone number.

Skipping the second row entirely avoided duplicate pages, but lost useful newer
fields such as the current website, booking links, and listing type.
```

Decision made:

```text
Merge duplicate source rows into the first imported listing when the importer
matches the same normalized business name and address.

Keep one canonical listing URL, preserve the richer categories and review count,
and merge useful newer fields from the duplicate row.
```

Before and after examples:

```text
Before import report:
Skipped rows: 1
Duplicate rows skipped: 1

After import report:
Skipped rows: 0
Duplicate rows merged: 1

Before listing:
Monty’s Nepalese Cuisine
website: http://www.kathmandunepalesecuisine.co.uk/
listingTypes: []

After listing:
Monty’s Nepalese Cuisine
website: https://montysnepalesecuisine.com/
listingTypes: [Casual Dining]
reserveUrl: https://www.google.com/maps/reserve/v/dine/c/riKu7jbTA8g...
appointmentUrl: https://www.google.com/maps/reserve/v/dine/c/riKu7jbTA8g...
categories: [Indian, Nepalese]
reviewCount: 255
```

Files changed:

```text
src/lib/directory-import.ts
scripts/import-directory.test.ts
scripts/template-readiness-audit.test.ts
src/data/listings.ts
data/listings.json
data/listing-search-records.json
data/import-report.md
data/category-inference-review.md
SEO-AUDIT-STRATEGY.md
```

Verification:

```text
npx.cmd tsx scripts/import-directory.test.ts
npx.cmd tsx scripts/template-readiness-audit.test.ts
npm.cmd run import:directory -- "data/Indian Restaurants - Outscraper - Test.csv"
npm.cmd run audit:template
```

Post-change audit result:

```text
npm.cmd run audit:template no longer reports skipped-row or duplicate-row
warnings.

Template readiness now reports:
Warnings: 2
Info: 3

Remaining warnings are the held items:
- missing-category warnings
- missing-image warnings
```

## 26. Indexation, Sitemap, and Crawl Governance

Checked after the recent SEO/data updates:

```text
/sitemap.xml generation
canonical clean URL policy
indexable restaurant detail URLs
indexable SEO hub URLs
published guide URLs
query/filter URL exclusion
legacy /listings route exclusion
draft guide preview exclusion
duplicate sitemap URL prevention
```

Implemented a reusable audit command:

```text
npm run audit:indexation
```

Files changed:

```text
src/lib/indexation-crawl-audit.ts
scripts/check-indexation-crawl.ts
scripts/indexation-crawl-audit.test.ts
package.json
SEO-AUDIT-STRATEGY.md
```

Current result:

```text
Status: pass
Sitemap URLs: 3520
Expected indexable URLs: 3520
Indexable restaurant URLs: 3069
Indexable SEO hub URLs: 446
Public guide URLs: 1
Blockers: 0
Warnings: 0
```

What the audit now blocks:

```text
duplicate sitemap URLs
query-string or hash URLs in the sitemap
invalid or external sitemap URLs
stale routes such as /listings
draft/noindex/legacy paths that are not approved indexable routes
```

Why this matters:

```text
Google should only receive clean, canonical, indexable URLs in the sitemap.
This reduces crawl waste and prevents old route names, filtered states, or
draft pages from being submitted for indexing.
```

Verification:

```text
npx.cmd tsx scripts/indexation-crawl-audit.test.ts
npm.cmd run audit:indexation
```

## Working Rule

For each SEO area, record:

- Page family checked.
- Source files checked.
- Current behavior.
- SEO issue found, if any.
- Decision made.
- Before and after examples.
- Tests or verification run.

## Next Step

Start with:

```text
1. Meta descriptions
```

Recommended first sample:

```text
/
/restaurants
/restaurants/the-curry-club-london
/areas/barnet
/categories/afghan
```
