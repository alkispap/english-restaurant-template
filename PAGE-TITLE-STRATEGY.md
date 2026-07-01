# Page Title Strategy Record

## Goal

Build a strong, reusable page title strategy for the directory template so each page type has clear, SEO-focused metadata titles.

Page titles are the metadata `<title>` values. Google often uses them as the blue title in search results, but it can rewrite them. Page titles are separate from H1, H2, and H3 headings.

## Current Title Template

The root layout applies this title template:

```text
%s | Indian Restaurants London
```

Source:

- `src/app/layout.tsx`
- `src/config/site.ts`

Working rule:

- Route-level titles should usually provide the useful search phrase only.
- Route-level titles should not manually include `| Indian Restaurants London`, because the root layout appends it.
- Use absolute titles only later if a page title becomes too long or awkward with the template suffix.

## Current Progress Summary

Page title families already checked:

```text
/                                  Homepage
/restaurants                       Restaurant index
/areas                             Area index
/categories                        Categories index
/restaurants/[slug]                Restaurant detail pages
/areas/[area]                      Area SEO landing pages
/neighborhoods/[neighborhood]      Neighborhood SEO landing pages
/categories/[category]             Category/cuisine SEO landing pages
/areas/[area]/categories/[category] Area + category SEO landing pages
/best/[slug]                       Best/search intent SEO landing pages
/services/[service]                Service facet SEO landing pages
/dietary/[dietary]                 Dietary facet SEO landing pages
/offerings/[offering]              Offering facet SEO landing pages
/types/[type]                      Type facet SEO landing pages
/guides                            Guides index
/guides/[slug]                     Published guide articles
/guides/preview/[slug]             Draft guide previews
/about                             About page
/contact                           Contact page
/privacy-policy                    Privacy policy page
/terms                             Terms page
/methodology                       Methodology page
/suggest-update                    Suggest update page
```

Main title decisions made:

- The root template remains `%s | Indian Restaurants London`.
- Route-level titles avoid manually adding `| Indian Restaurants London`.
- Homepage, index pages, restaurant detail pages, guide pages, and trust/support pages now have clearer SEO-facing titles.
- Dynamic SEO landing page titles were reviewed and kept because they already matched the approved H1/page intent strategy.
- Short trust/support labels remain available for navigation and footer links, while `metadataTitle` controls SEO-facing page titles.

Remaining page title family to check:

```text
/compare                           Compare saved restaurants utility page
```

## Homepage Review

Page checked:

- `/`
- Page metadata source: `src/app/page.tsx`
- Root title template source: `src/app/layout.tsx`
- Site config source: `src/config/site.ts`

### Homepage Title Before

Raw route title:

```text
Indian restaurants in London
```

Likely rendered browser/search title:

```text
Indian restaurants in London | Indian Restaurants London
```

### Homepage Title After

Raw route title:

```text
Indian Restaurants in London Directory
```

Likely rendered browser/search title:

```text
Indian Restaurants in London Directory | Indian Restaurants London
```

Reason:

- Keeps the main keyword phrase `Indian Restaurants in London`.
- Adds `Directory`, which better describes the site and search intent.
- Avoids manually repeating the site name in the route metadata.
- Stays reusable for future directory copies, for example `Mexican Restaurants in London Directory`.

## Directory Index Page Review

Pages checked:

- Restaurant index: `/restaurants`
- Area index: `/areas`
- Categories index: `/categories`

Sources:

- `src/app/restaurants/page.tsx`
- `src/app/areas/page.tsx`
- `src/app/categories/page.tsx`

### Directory Index Titles Before

Raw route titles:

```text
/restaurants: Search restaurants in London
/areas: Restaurant areas in London
/categories: Cuisines in London
```

Likely rendered browser/search titles:

```text
Search restaurants in London | Indian Restaurants London
Restaurant areas in London | Indian Restaurants London
Cuisines in London | Indian Restaurants London
```

### Directory Index Titles After

Raw route titles:

```text
/restaurants: Search Indian Restaurants in London
/areas: Indian Restaurants in London by Area
/categories: Indian Restaurants in London by Cuisine
```

Likely rendered browser/search titles:

```text
Search Indian Restaurants in London | Indian Restaurants London
Indian Restaurants in London by Area | Indian Restaurants London
Indian Restaurants in London by Cuisine | Indian Restaurants London
```

Reason:

- Keeps `Indian Restaurants in London` close to the start of each title.
- Aligns the index page titles with the approved H1 strategy.
- Makes `/areas` and `/categories` clearer for Google than generic `Restaurant areas` or `Cuisines`.
- Avoids manually repeating the site name in route metadata.

## Restaurant Detail Page Review

Page family checked:

- Restaurant detail: `/restaurants/[slug]`

Sources:

- `src/app/restaurants/[slug]/page.tsx`
- `src/lib/listing-detail-headings.ts`

### Restaurant Detail Titles Before

Raw route title pattern:

```text
listing.metaTitle || listing.name
```

Example raw route titles:

```text
/restaurants/the-curry-club-london: The Curry Club London | Barkingside, Ilford - London
/restaurants/hyderabad-darbar: HYDERABAD DARBAR | Barkingside, Ilford - London
/restaurants/saravanaa-bhavan: Saravanaa Bhavan | Cranbrook, Ilford - London
```

Likely rendered browser/search titles:

```text
The Curry Club London | Barkingside, Ilford - London | Indian Restaurants London
HYDERABAD DARBAR | Barkingside, Ilford - London | Indian Restaurants London
Saravanaa Bhavan | Cranbrook, Ilford - London | Indian Restaurants London
```

### Restaurant Detail Titles After

Raw route title pattern:

```text
[Restaurant Name] in [Area], London
```

Fallback when area is missing:

```text
[Restaurant Name] in London
```

Example raw route titles:

```text
/restaurants/the-curry-club-london: The Curry Club London in Redbridge, London
/restaurants/hyderabad-darbar: HYDERABAD DARBAR in Redbridge, London
/restaurants/saravanaa-bhavan: Saravanaa Bhavan in Redbridge, London
```

Likely rendered browser/search titles:

```text
The Curry Club London in Redbridge, London | Indian Restaurants London
HYDERABAD DARBAR in Redbridge, London | Indian Restaurants London
Saravanaa Bhavan in Redbridge, London | Indian Restaurants London
```

Reason:

- Matches the approved restaurant detail H1 pattern.
- Avoids imported `metaTitle` values that already contain separators and location fragments.
- Prevents messy rendered titles with multiple `|` separators.
- Keeps the restaurant entity first, then area and London for local SEO.
- Uses the root title template for the broader site context.

## Dynamic SEO Landing Page Review

- Area pages: `/areas/[area]`
- Neighborhood pages: `/neighborhoods/[neighborhood]`
- Category/cuisine pages: `/categories/[category]`
- Area + category pages: `/areas/[area]/categories/[category]`
- Best/search intent pages: `/best/[slug]`
- Service pages: `/services/[service]`
- Dietary pages: `/dietary/[dietary]`
- Offering pages: `/offerings/[offering]`
- Type pages: `/types/[type]`

Sources:

- `src/lib/seo-pages.ts`
- `src/lib/seo-landing-headings.ts`
- Route files that call `toSeoMetadata(page)`

Decision:

- These titles were reviewed and kept.
- They already match the approved H1/page-intent strategy.
- No separate dynamic page-title helper is needed yet.

Approved raw route title examples:

```text
/areas/barnet: Indian Restaurants in Barnet, London
/neighborhoods/abbey-wood: Indian Restaurants in Abbey Wood, London
/categories/afghan: Afghan Restaurants in London
/areas/harrow/categories/indian: Indian Restaurants in Harrow, London
/best/best-rated: Best rated Indian restaurants in London
/services/takeaway: Indian Restaurants with Takeaway in London
/dietary/halal: Halal Indian Restaurants in London
/offerings/alcohol: Indian Restaurants with Alcohol in London
/types/casual-dining: Casual Dining Indian Restaurants in London
```

Likely rendered browser/search title examples:

```text
Indian Restaurants in Barnet, London | Indian Restaurants London
Indian Restaurants in Abbey Wood, London | Indian Restaurants London
Afghan Restaurants in London | Indian Restaurants London
Indian Restaurants in Harrow, London | Indian Restaurants London
Best rated Indian restaurants in London | Indian Restaurants London
Indian Restaurants with Takeaway in London | Indian Restaurants London
Halal Indian Restaurants in London | Indian Restaurants London
Indian Restaurants with Alcohol in London | Indian Restaurants London
Casual Dining Indian Restaurants in London | Indian Restaurants London
```

Reason:

- The titles include the local keyword, page-specific modifier, and London where relevant.
- The root template already adds the site name.
- The same title source powers the visible H1, keeping metadata and page content aligned.

## Guide And Article Page Review

- Guides index: `/guides`
- Published guide articles: `/guides/[slug]`
- Draft guide preview pages: `/guides/preview/[slug]`

Sources:

- `src/app/guides/page.tsx`
- `src/app/guides/[slug]/page.tsx`
- `src/app/guides/preview/[slug]/page.tsx`
- `src/lib/articles.ts`

### Guide And Article Titles Before

Raw route title examples:

```text
/guides: Indian Food and Restaurant Guides in London
/guides/what-is-indian-food: What Is Indian Food? A Beginner's Guide
/guides/preview/how-to-choose-indian-restaurant-london: How to Choose an Indian Restaurant in London | Guide
```

Likely rendered browser/search title examples:

```text
Indian Food and Restaurant Guides in London | Indian Restaurants London
What Is Indian Food? A Beginner's Guide | Indian Restaurants London
How to Choose an Indian Restaurant in London | Guide | Indian Restaurants London
```

### Guide And Article Titles After

Raw route title examples:

```text
/guides: Indian Food and Restaurant Guides in London
/guides/what-is-indian-food: What Is Indian Food? A Beginner's Guide
/guides/preview/how-to-choose-indian-restaurant-london: How to Choose an Indian Restaurant in London
```

Likely rendered browser/search title examples:

```text
Indian Food and Restaurant Guides in London | Indian Restaurants London
What Is Indian Food? A Beginner's Guide | Indian Restaurants London
How to Choose an Indian Restaurant in London | Indian Restaurants London
```

Decision:

- The `/guides` index title was reviewed and kept.
- Published article titles were reviewed and kept where they already read naturally.
- Article metadata now removes a trailing `| Guide` suffix before the root title template appends the site name.

Reason:

- Keeps guide/article titles readable as Google result titles.
- Avoids stacked suffixes such as `| Guide | Indian Restaurants London`.
- Keeps article search intent first while using the root title template for site context.

## Trust And Support Page Review

- About: `/about`
- Contact: `/contact`
- Privacy policy: `/privacy-policy`
- Terms: `/terms`
- Methodology: `/methodology`
- Suggest update: `/suggest-update`

Sources:

- `src/lib/trust-pages.ts`
- `src/app/about/page.tsx`
- `src/app/contact/page.tsx`
- `src/app/privacy-policy/page.tsx`
- `src/app/terms/page.tsx`
- `src/app/methodology/page.tsx`
- `src/app/suggest-update/page.tsx`

### Trust And Support Titles Before

Raw route titles:

```text
/about: About
/contact: Contact
/privacy-policy: Privacy Policy
/terms: Terms
/methodology: How We Rank
/suggest-update: Suggest an Update
```

Likely rendered browser/search titles:

```text
About | Indian Restaurants London
Contact | Indian Restaurants London
Privacy Policy | Indian Restaurants London
Terms | Indian Restaurants London
How We Rank | Indian Restaurants London
Suggest an Update | Indian Restaurants London
```

### Trust And Support Titles After

Raw route titles:

```text
/about: About This Indian Restaurant Directory
/contact: Contact the Indian Restaurants in London Directory
/privacy-policy: Privacy Policy for This Restaurant Directory
/terms: Terms for Using This Restaurant Directory
/methodology: How We Rank Indian Restaurants in London
/suggest-update: Suggest an Indian Restaurant Update
```

Likely rendered browser/search titles:

```text
About This Indian Restaurant Directory | Indian Restaurants London
Contact the Indian Restaurants in London Directory | Indian Restaurants London
Privacy Policy for This Restaurant Directory | Indian Restaurants London
Terms for Using This Restaurant Directory | Indian Restaurants London
How We Rank Indian Restaurants in London | Indian Restaurants London
Suggest an Indian Restaurant Update | Indian Restaurants London
```

Decision:

- Short trust page titles such as `About`, `Contact`, and `Terms` remain available for navigation and footer labels.
- A separate `metadataTitle` field now controls SEO-facing page titles.
- Route metadata uses `page.metadataTitle` while visible pages still use the focused H1 headings.

Reason:

- Makes generic support titles clearer in Google results.
- Keeps the stronger H1 strategy aligned with metadata titles.
- Avoids changing menu/footer labels just to improve SEO metadata.

## Next Page Titles To Check

### Utility Page

- Compare saved restaurants: `/compare`

## Verification

Focused title tests run during this page-title strategy work:

```text
node .\node_modules\tsx\dist\cli.mjs scripts\metadata-title.test.ts
metadata title tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\articles.test.ts
article behavior tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\trust-pages.test.ts
trust pages tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\trust-page-headings.test.ts
trust page heading tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\listing-detail-headings.test.ts
listing detail heading tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-pages.test.ts
SEO page behavior tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-landing-headings.test.ts
SEO landing heading helper tests passed

npm.cmd run typecheck
tsc --noEmit
```

## Working Rule

Each page title should:

- Put the primary keyword or page-specific search intent near the beginning.
- Be readable as a Google result title.
- Avoid unnecessary brand repetition when the root title template already appends the site name.
- Stay natural and reusable for future directory copies.
