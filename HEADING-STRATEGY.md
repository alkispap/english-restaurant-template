# H-Tag Strategy Record

## Goal

Build a strong, reusable heading strategy for the directory template so each page type has clear, SEO-focused H1, H2, and supporting heading structure.

This record will track the heading checks and changes as we review each page family.

## Homepage Review

Page checked:

- `/`
- Source: `src/app/page.tsx`
- Main rendered component: `src/components/DirectoryListingsView.tsx`
- Heading helper: `src/lib/homepage-headings.ts`

## Homepage H1

Current H1:

```text
Indian Restaurants in London
```

Decision:

- The H1 was checked and kept.
- It is clear, keyword-focused, and matches the main directory topic.
- It uses the primary keyword and location together.

## Homepage H2 Changes

Current homepage H2 strategy after review:

```text
Find Indian Restaurants in London by Area, Cuisine, Service, and Dietary Need
How Our Indian Restaurants in London Directory Works
Best Rated Indian Restaurants in London
Affordable Indian Restaurants in London
```

Change made in this review:

```text
How This Restaurant Directory Works
```

was changed to:

```text
How Our Indian Restaurants in London Directory Works
```

Reason:

- The new heading is more keyword-focused.
- It reinforces the phrase `Indian Restaurants in London`.
- It keeps the wording readable while also supporting the homepage SEO theme.
- The helper remains reusable for future directory copies, for example `Mexican Restaurants in London`.

## Homepage H3 Notes

The homepage also has supporting H3 headings under the SEO shortcut and directory explanation sections.

Current homepage H3 examples:

```text
Indian Restaurants in London by London Area
Cuisine Types in London
Strong Restaurant Area Pages
Indian Restaurants in London by Service
Indian Restaurants in London by Dietary Need
Indian Restaurants in London by Dining Style
What data does this directory cover?
How are listing details kept fresh?
How should visitors choose a restaurant?
```

Decision:

- These H3s were identified but not fully optimized yet.
- They should be reviewed in the next pass after the H2 strategy is confirmed.
- The aim is to make them support the H2s without creating awkward keyword stuffing.

## Restaurant Detail Page Review

Page family checked:

- `/restaurants/[slug]`
- Source: `src/app/restaurants/[slug]/page.tsx`
- Supporting heading helper: `src/lib/listing-detail-headings.ts`

Sample pages checked:

- `/restaurants/the-curry-club-london`
- `/restaurants/hyderabad-darbar`
- `/restaurants/saravanaa-bhavan`

### Restaurant Detail H1

Chosen H1 pattern:

```text
[Restaurant Name] in [Area], London
```

Examples:

```text
The Curry Club London in Redbridge, London
HYDERABAD DARBAR in Redbridge, London
Saravanaa Bhavan in Redbridge, London
```

Fallback:

```text
[Restaurant Name] in London
```

Reason:

- The H1 keeps the restaurant name as the main entity.
- It adds the area and London for stronger local SEO.
- Repeating London is accepted when London is part of the restaurant name because the second London is location context.

### Restaurant Detail H2 Changes

Chosen restaurant detail H2 pattern:

```text
Quick Facts About [Restaurant Name]
[Restaurant Name] Services, Dining Options, and Features
Guest Information for [Restaurant Name]
Transport and Directions to [Restaurant Name]
Nearby Places Around [Restaurant Name]
Comments About [Restaurant Name]
[Restaurant Name] Location and Contact Details
[Restaurant Name] Opening Hours
[Restaurant Name] Reviews and Ratings
Explore More Indian Restaurants Near [Restaurant Name]
Similar Indian Restaurants in London
```

These replaced generic H2s such as:

```text
Services and features
Guest information
Transport
Nearby places
Comments
Location and contact
Opening hours
Reviews
Explore contextually
Similar listings
```

Reason:

- The new H2s reinforce the restaurant entity.
- They add local and niche relevance without changing the page layout.
- The helper keeps the wording reusable for another directory niche.

### Restaurant Detail H3 Notes

Restaurant detail H3s were not changed in this pass.

Examples still include:

```text
Service options
Highlights
Popular for
Local area
Similar cuisine
Features & dietary
Similar restaurant card names
```

Decision:

- H3s should be reviewed later after the H1 and H2 strategy is stable.
- Similar listing card names remain H3s for now.

## Area Index Page Review

Page checked:

- `/areas`
- Source: `src/app/areas/page.tsx`
- Supporting heading helper: `src/lib/areas-index-headings.ts`

### Area Index H1

Chosen H1:

```text
Indian Restaurants in London by Area
```

This replaced:

```text
Browse restaurants by area in London
```

Reason:

- It keeps the primary keyword phrase `Indian Restaurants in London`.
- It clearly describes the page purpose as an area-based directory page.
- It remains reusable for future directory copies, for example `Mexican Restaurants in London by Area`.

### Area Index H2 Changes

Chosen H2 pattern:

```text
Browse Indian Restaurants by London Area
Popular Indian Restaurant Searches in London
```

These replaced or expanded generic structure such as:

```text
Popular restaurant searches
```

Reason:

- The first H2 gives the searchable area grid a keyword-focused section heading.
- The second H2 improves the popular-search section with the niche and location.
- Individual area card names remain non-heading text, so the page does not create a long list of low-value H3s.

### Area Index H3 Notes

The area index page has no H3s after this pass.

Decision:

- Do not promote area card names to H3s.
- Keep the page outline simple: one H1 and two useful H2 sections.

## Categories Index Page Review

Page checked:

- `/categories`
- Source: `src/app/categories/page.tsx`
- Supporting heading helper: `src/lib/categories-index-headings.ts`

### Categories Index H1

Chosen H1:

```text
Indian Restaurants in London by Cuisine
```

This replaced:

```text
Browse cuisines in London
```

Reason:

- It keeps the primary keyword phrase `Indian Restaurants in London`.
- It uses `Cuisine` because that is the restaurant-specific category label in the directory config.
- It remains reusable for future directory copies, for example `Mexican Restaurants in London by Cuisine`.

### Categories Index H2 Changes

Chosen H2 pattern:

```text
Browse Indian Restaurants by Cuisine
Popular Indian Restaurant Searches in London
```

These replaced or expanded generic structure such as:

```text
Popular restaurant searches
```

Reason:

- The first H2 gives the cuisine/category grid a keyword-focused section heading.
- The second H2 aligns with the `/areas` page popular-search pattern.
- Individual cuisine card names remain non-heading text, so the page does not create a long list of low-value H3s.

### Categories Index H3 Notes

The categories index page has no H3s after this pass.

Decision:

- Do not promote cuisine card names to H3s.
- Keep the page outline simple: one H1 and two useful H2 sections.

## Area Dynamic Page Investigation

Page family being checked:

- `/areas/[area]`
- Source: `src/app/areas/[area]/page.tsx`
- Shared rendered component: `src/components/SeoLandingPage.tsx`
- Heading helper: `src/lib/seo-landing-headings.ts`

Sample pages checked:

- `/areas/barking-and-dagenham`
- `/areas/barnet`
- `/areas/bexley`

Current sample H1 pattern:

```text
Restaurants in [Area]
```

Examples:

```text
Restaurants in Barking & Dagenham
Restaurants in Barnet
Restaurants in Bexley
```

Current sample H2 patterns:

```text
Choose a neighborhood or cuisine in [Area]
[count] restaurants found
Compare Restaurants in [Area]
Restaurant Decision Signals
Popular Cuisines in [Area]
More London Restaurant Areas
Useful Restaurant Searches in London
Restaurant Questions People Ask
```

Current sample H3 patterns include:

```text
Best Restaurant Searches
Recently Added Restaurants
Useful Restaurant Filters
Top areas
Cuisine hubs
Neighborhoods in [Area]
Cuisine types in [Area]
Price and review signals
Best-fit guidance
Practical visit notes
```

Initial finding:

- The page structure is useful and already has one H1 plus several H2/H3 sections.
- The current wording is too generic for the directory target because it often says `Restaurants` instead of `Indian Restaurants`.
- This page family should be improved through the shared SEO landing heading helpers, not by editing each route separately.

Implemented area-page heading direction:

```text
H1: Indian Restaurants in [Area], London
H2: Explore Indian Restaurants in [Area] by Neighborhood and Cuisine
H2: [count] Indian Restaurants in [Area] Found
H2: Compare Indian Restaurants in [Area]
H2: Indian Restaurant Decision Signals
H2: Popular Indian Restaurant Cuisines in [Area]
H2: More London Areas for Indian Restaurants
H2: Useful Indian Restaurant Searches in London
H2: Indian Restaurant Questions People Ask
```

Before and after examples for `/areas/barnet`:

```text
H1 before: Restaurants in Barnet
H1 after: Indian Restaurants in Barnet, London

H2 before: Choose a neighborhood or cuisine in Barnet
H2 after: Explore Indian Restaurants in Barnet by Neighborhood and Cuisine

H2 before: 117 restaurants found
H2 after: 117 Indian Restaurants in Barnet Found

H2 before: Compare Restaurants in Barnet
H2 after: Compare Indian Restaurants in Barnet

H2 before: Restaurant Decision Signals
H2 after: Indian Restaurant Decision Signals

H2 before: Popular Cuisines in Barnet
H2 after: Popular Indian Restaurant Cuisines in Barnet

H2 before: More London Restaurant Areas
H2 after: More London Areas for Indian Restaurants

H2 before: Useful Restaurant Searches in London
H2 after: Useful Indian Restaurant Searches in London

H2 before: Restaurant Questions People Ask
H2 after: Indian Restaurant Questions People Ask
```

## Shared SEO Landing Page Investigation

Shared page families checked:

- Area pages: `/areas/[area]`
- Neighborhood pages: `/neighborhoods/[neighborhood]`
- Category/cuisine pages: `/categories/[category]`
- Area + category pages: `/areas/[area]/categories/[category]`
- Best/search intent pages: `/best/[slug]`
- Facet pages: `/services/[service]`, `/dietary/[dietary]`, `/offerings/[offering]`, `/types/[type]`

Shared sources:

- Main heading helper: `src/lib/seo-landing-headings.ts`
- Page model builder: `src/lib/seo-pages.ts`
- Shared rendered component: `src/components/SeoLandingPage.tsx`

Representative current H1 examples:

```text
Restaurants in Barnet
Restaurants in Abbey Wood
Afghan Restaurants in London
Indian Restaurants in Harrow
Best rated restaurants in London
Caterer Restaurants in London
```

Representative current H2 examples:

```text
[count] restaurants found
Compare Restaurants in [Area]
Restaurant Decision Signals
Popular Cuisines in [Area]
More London Restaurant Areas
Useful Restaurant Searches in London
Restaurant Questions People Ask
How This Restaurant Shortlist Is Assembled
When [Facet] Matters
```

Shared finding:

- These pages use one shared heading model, so improving one family can affect several other SEO landing page types.
- Area and neighborhood pages are the weakest for keyword focus because the H1 currently starts with generic `Restaurants in...`.
- Best pages also need stronger niche wording, for example `Best rated Indian restaurants in London`.
- Facet pages need special care because a simple keyword replacement can create awkward headings such as `Caterer Indian Restaurants in London`.
- Category and area + category pages are already closer to good SEO intent, but many supporting H2s still use generic `Restaurant`.

### Completed Task 1: Area Page Implementation

This has now been implemented for area pages.

Proposed first area-page direction:

```text
H1: Indian Restaurants in [Area], London
H2: Explore Indian Restaurants in [Area] by Neighborhood and Cuisine
H2: [count] Indian Restaurants in [Area] Found
H2: Compare Indian Restaurants in [Area]
H2: Indian Restaurant Decision Signals
H2: Popular Indian Restaurant Cuisines in [Area]
H2: More London Areas for Indian Restaurants
H2: Useful Indian Restaurant Searches in London
H2: Indian Restaurant Questions People Ask
```

Reason:

- Area pages are high-value local SEO pages.
- This gives the area pages a stronger `Indian Restaurants in [Area], London` target before wider shared-helper changes.
- The change should be backed by a focused render test for `/areas/barnet` or a similar representative area.

### Later Task 2: Wider Shared SEO Landing Implementation

This should happen after the area-page wording is approved.

Page families to handle later:

```text
/neighborhoods/[neighborhood]
/categories/[category]
/areas/[area]/categories/[category]
/best/[slug]
/services/[service]
/dietary/[dietary]
/offerings/[offering]
/types/[type]
```

Reason:

- These families share `seo-landing-headings.ts` and `SeoLandingPage`.
- They should be updated with page-family-specific wording, not a single global replacement.
- Facet headings need separate wording rules to avoid unnatural keyword stuffing.

Recommended later test coverage:

```text
scripts/seo-landing-headings.test.ts
scripts/seo-landing-page-render.test.ts
scripts/seo-pages.test.ts
scripts/page-family-heading-snapshot.test.ts
```

## Neighborhood Dynamic Page Review

Page family checked:

- `/neighborhoods/[neighborhood]`
- Source: `src/app/neighborhoods/[neighborhood]/page.tsx`
- Shared rendered component: `src/components/SeoLandingPage.tsx`
- Heading helper: `src/lib/seo-landing-headings.ts`

Sample pages checked:

- `/neighborhoods/abbey-wood`
- `/neighborhoods/acton`
- `/neighborhoods/addiscombe`

Implemented neighborhood heading direction:

```text
H1: Indian Restaurants in [Neighborhood], London
H2: [count] Indian Restaurants in [Neighborhood] Found
H2: Compare Indian Restaurants in [Neighborhood]
H2: Indian Restaurant Decision Signals
H2: Related London Areas for Indian Restaurants
H2: Related Indian Restaurant Cuisine Pages
H2: Useful Indian Restaurant Searches in London
H2: Indian Restaurant Questions People Ask
```

Before and after examples for `/neighborhoods/abbey-wood`:

```text
H1 before: Restaurants in Abbey Wood
H1 after: Indian Restaurants in Abbey Wood, London

H2 before: 3 restaurants found
H2 after: 3 Indian Restaurants in Abbey Wood Found

H2 before: Compare Restaurants in Abbey Wood
H2 after: Compare Indian Restaurants in Abbey Wood

H2 before: Indian Restaurant Decision Signals
H2 after: Indian Restaurant Decision Signals

H2 before: Related London Restaurant Areas
H2 after: Related London Areas for Indian Restaurants

H2 before: Related Cuisine Pages
H2 after: Related Indian Restaurant Cuisine Pages

H2 before: Useful Indian Restaurant Searches in London
H2 after: Useful Indian Restaurant Searches in London

H2 before: Indian Restaurant Questions People Ask
H2 after: Indian Restaurant Questions People Ask
```

Decision:

- Neighborhood pages now follow the same local SEO pattern as area pages.
- H3s were not changed in this pass.
- Category, area + category, best, and facet pages still need their own shared-landing review.

## Category Dynamic Page Review

Page family checked:

- `/categories/[category]`
- Source: `src/app/categories/[category]/page.tsx`
- Shared rendered component: `src/components/SeoLandingPage.tsx`
- Heading helper: `src/lib/seo-landing-headings.ts`

Sample page checked:

- `/categories/afghan`

Implemented category-page heading direction:

```text
H1: [Cuisine] Restaurants in London
H2: [count] [Cuisine] Restaurants in London Found
H2: How to Compare [Cuisine] Restaurants in London
H2: Indian Restaurant Decision Signals
H2: Popular London Areas for [Cuisine] Restaurants
H2: Related Indian Restaurant Cuisine Pages
H2: Useful Indian Restaurant Searches in London
H2: Indian Restaurant Questions People Ask
```

Before and after examples for `/categories/afghan`:

```text
H1 before: Afghan Restaurants in London
H1 after: Afghan Restaurants in London

H2 before: 33 restaurants found
H2 after: 33 Afghan Restaurants in London Found

H2 before: How to Compare Afghan Restaurants
H2 after: How to Compare Afghan Restaurants in London

H2 before: Indian Restaurant Decision Signals
H2 after: Indian Restaurant Decision Signals

H2 before: Popular Areas for Afghan Restaurants
H2 after: Popular London Areas for Afghan Restaurants

H2 before: Related Cuisine Pages
H2 after: Related Indian Restaurant Cuisine Pages

H2 before: Useful Indian Restaurant Searches in London
H2 after: Useful Indian Restaurant Searches in London

H2 before: Indian Restaurant Questions People Ask
H2 after: Indian Restaurant Questions People Ask
```

Decision:

- The H1 was already good and was kept.
- Category page H2s now add cuisine-specific and London-specific wording.
- H3s were not changed in this pass.
- Area + category, best, and facet pages still need their own shared-landing review.

## Area + Category Dynamic Page Review

Page family checked:

- `/areas/[area]/categories/[category]`
- Source: `src/app/areas/[area]/categories/[category]/page.tsx`
- Shared rendered component: `src/components/SeoLandingPage.tsx`
- Heading helper: `src/lib/seo-landing-headings.ts`

Sample pages checked:

- `/areas/harrow/categories/indian`
- `/areas/brent/categories/indian`
- `/areas/westminster/categories/indian`

Implemented area + category heading direction:

```text
H1: [Cuisine] Restaurants in [Area], London
H2: [count] [Cuisine] Restaurants in [Area] Found
H2: Compare [Cuisine] Restaurants in [Area]
H2: Indian Restaurant Decision Signals
H2: More Indian Restaurant Cuisines in [Area]
H2: More London Areas for [Cuisine] Restaurants
H2: Useful Indian Restaurant Searches in London
H2: Indian Restaurant Questions People Ask
```

Before and after examples for `/areas/harrow/categories/indian`:

```text
H1 before: Indian Restaurants in Harrow
H1 after: Indian Restaurants in Harrow, London

H2 before: 116 restaurants found
H2 after: 116 Indian Restaurants in Harrow Found

H2 before: Compare Indian Restaurants in Harrow
H2 after: Compare Indian Restaurants in Harrow

H2 before: Indian Restaurant Decision Signals
H2 after: Indian Restaurant Decision Signals

H2 before: More Cuisines in Harrow
H2 after: More Indian Restaurant Cuisines in Harrow

H2 before: More Indian Areas
H2 after: More London Areas for Indian Restaurants

H2 before: Useful Indian Restaurant Searches in London
H2 after: Useful Indian Restaurant Searches in London

H2 before: Indian Restaurant Questions People Ask
H2 after: Indian Restaurant Questions People Ask
```

Decision:

- The H1 was already strong, but now includes `London` for local SEO consistency.
- The result-count and related-link H2s are more specific.
- H3s were not changed in this pass.
- Best/search-intent pages and facet pages still need their own shared-landing review.

## Best/Search Intent Page Review

Page family checked:

- `/best/[slug]`
- Source: `src/app/best/[slug]/page.tsx`
- Shared rendered component: `src/components/SeoLandingPage.tsx`
- Heading helper: `src/lib/seo-landing-headings.ts`

Sample page checked:

- `/best/best-rated`

Implemented best/search-intent heading direction:

```text
H1: [Search Intent] Indian restaurants in London
H2: [count] Indian Restaurants in London Found
H2: How This Indian Restaurant Shortlist Is Assembled
H2: Indian Restaurant Decision Signals
H2: Compare Indian Restaurants in London by Area
H2: Related Indian Restaurant Cuisine Pages
H2: Useful Indian Restaurant Area and Cuisine Combinations
H2: Indian Restaurant Questions People Ask
```

Before and after examples for `/best/best-rated`:

```text
H1 before: Best rated restaurants in London
H1 after: Best rated Indian restaurants in London

H2 before: 3,187 restaurants found
H2 after: 3,187 Indian Restaurants in London Found

H2 before: How This Restaurant Shortlist Is Assembled
H2 after: How This Indian Restaurant Shortlist Is Assembled

H2 before: Indian Restaurant Decision Signals
H2 after: Indian Restaurant Decision Signals

H2 before: Compare Indian Restaurants in London by Area
H2 after: Compare Indian Restaurants in London by Area

H2 before: Related Cuisine Pages
H2 after: Related Indian Restaurant Cuisine Pages

H2 before: Useful Cuisine and Area Combinations
H2 after: Useful Indian Restaurant Area and Cuisine Combinations

H2 before: Indian Restaurant Questions People Ask
H2 after: Indian Restaurant Questions People Ask
```

Decision:

- Best/search intent pages now convert generic restaurant intent into niche-aware `Indian restaurants in London` wording.
- H3s were not changed in this pass.
- Facet pages still need their own shared-landing review because some facet labels need special wording to avoid awkward H1s.

## Facet Page Review

Page families checked:

- `/services/[service]`
- `/dietary/[dietary]`
- `/offerings/[offering]`
- `/types/[type]`

Shared sources:

- Route files: `src/app/services/[service]/page.tsx`, `src/app/dietary/[dietary]/page.tsx`, `src/app/offerings/[offering]/page.tsx`, `src/app/types/[type]/page.tsx`
- Shared rendered component: `src/components/SeoLandingPage.tsx`
- Heading helper: `src/lib/seo-landing-headings.ts`

Sample pages checked:

- `/services/takeaway`
- `/services/delivery`
- `/dietary/halal`
- `/dietary/vegan`
- `/offerings/alcohol`
- `/offerings/small-plates`
- `/types/casual-dining`
- `/types/fine-dining`

Implemented facet heading direction:

```text
Service H1: Indian Restaurants with [Service] in London
Dietary H1: [Dietary] Indian Restaurants in London
Offering H1: Indian Restaurants with [Offering] in London
Type H1: [Type] Indian Restaurants in London

H2: [count] [Facet H1 Phrase] Found
H2: When [Facet] Matters for Indian Restaurants
H2: Indian Restaurant Decision Signals
H2: Compare Indian Restaurants in London by Area
H2: Related Indian Restaurant Cuisine Pages
H2: Useful Indian Restaurant Searches in London
H2: Indian Restaurant Questions People Ask
```

Before and after examples:

```text
H1 before: Takeaway Restaurants in London
H1 after: Indian Restaurants with Takeaway in London

H1 before: Delivery Restaurants in London
H1 after: Indian Restaurants with Delivery in London

H1 before: Halal Restaurants in London
H1 after: Halal Indian Restaurants in London

H1 before: Vegan Restaurants in London
H1 after: Vegan Indian Restaurants in London

H1 before: Alcohol Restaurants in London
H1 after: Indian Restaurants with Alcohol in London

H1 before: Small plates Restaurants in London
H1 after: Indian Restaurants with Small plates in London

H1 before: Casual Dining Restaurants in London
H1 after: Casual Dining Indian Restaurants in London

H1 before: Fine Dining Restaurants in London
H1 after: Fine Dining Indian Restaurants in London
```

Before and after H2 examples for `/services/takeaway`:

```text
H2 before: 2,969 restaurants found
H2 after: 2,969 Indian Restaurants with Takeaway in London Found

H2 before: When Takeaway Matters
H2 after: When Takeaway Matters for Indian Restaurants

H2 before: Related Cuisine Pages
H2 after: Related Indian Restaurant Cuisine Pages
```

Decision:

- Facet pages use facet-type-specific wording instead of a single global replacement.
- H3s were not changed in this pass.
- This completes the shared SEO landing H1/H2 pass for dynamic SEO landing pages.

## Guide And Article Page Review

Page families checked:

- Guides index: `/guides`
- Published guide articles: `/guides/[slug]`
- Draft guide preview pages: `/guides/preview/[slug]`

Sources:

- Guides index: `src/app/guides/page.tsx`
- Article template: `src/components/GuideArticleContent.tsx`
- Article content: `content/articles/*.json`

Sample article pages checked:

- `/guides/what-is-indian-food`
- `/guides/how-to-choose-indian-restaurant-london`
- `/guides/indian-takeaway-london`

Implemented guide index heading direction:

```text
H1: Indian Food and Restaurant Guides in London
H2: Browse Indian Food and Restaurant Guides
H3: [Article Title]
```

Before and after examples for `/guides`:

```text
H1 before: Local food guides
H1 after: Indian Food and Restaurant Guides in London

H2 before: [Article Title]
H2 after: Browse Indian Food and Restaurant Guides

H3 before: none for article cards
H3 after: What Is Indian Food?
```

Implemented guide article template direction:

```text
H1: [Article Title]
H2: [Article Section Heading]
H2: Related Indian Restaurant Directory Pages
H2: Indian Food and Restaurant FAQs
H2: Sources for This Indian Restaurant Guide
H3: [Data block or comparison table title]
```

Before and after examples for `/guides/what-is-indian-food`:

```text
H1 before: What Is Indian Food?
H1 after: What Is Indian Food?

H2 before: Related directory pages
H2 after: Related Indian Restaurant Directory Pages

H2 before: FAQs
H2 after: Indian Food and Restaurant FAQs

H2 before: Sources and review notes
H2 after: Sources for This Indian Restaurant Guide

H2 before: Ready to compare restaurants?
H2 after: removed from the H2 outline and kept as styled CTA text
```

Decision:

- Article H1s stay natural and article-specific.
- The guide index now has a clearer SEO target for Indian food and restaurant guides in London.
- Article support sections now use more descriptive H2s.
- CTA blocks no longer compete with article section H2s.
- Draft preview pages use the same heading template but remain noindex.

## Trust And Support Page Review

Page families checked:

- About: `/about`
- Contact: `/contact`
- Privacy policy: `/privacy-policy`
- Terms: `/terms`
- Methodology: `/methodology`
- Suggest update: `/suggest-update`

Sources:

- Shared content model: `src/lib/trust-pages.ts`
- Shared rendered component: `src/components/TrustPage.tsx`

Implemented trust/support heading direction:

```text
H1: [Focused trust/support page heading]
H2: [Focused trust/support section heading]
H3: none
```

The short `title` values were kept for navigation, footer links, and metadata labels. A separate `heading` field now controls the H1 where the visible page heading should be more descriptive.

Before and after H1 examples:

```text
H1 before: About
H1 after: About This Indian Restaurant Directory

H1 before: Contact
H1 after: Contact the Indian Restaurants in London Directory

H1 before: Privacy Policy
H1 after: Privacy Policy for This Restaurant Directory

H1 before: Terms
H1 after: Terms for Using This Restaurant Directory

H1 before: How We Rank
H1 after: How We Rank Indian Restaurants in London

H1 before: Suggest an Update
H1 after: Suggest an Indian Restaurant Update
```

Before and after H2 examples:

```text
H2 before: What this directory does
H2 after: What This Indian Restaurant Directory Does

H2 before: Restaurant updates
H2 after: Indian Restaurant Listing Updates

H2 before: Information this site may use
H2 after: Information This Restaurant Directory May Use

H2 before: Directory information
H2 after: Indian Restaurant Directory Information

H2 before: Listing selection
H2 after: How Indian Restaurant Listings Are Selected

H2 before: What to report
H2 after: What Restaurant Details to Report
```

Decision:

- Trust/support pages are now clearer and more directory-specific.
- These pages remain lighter than SEO landing pages, avoiding heavy keyword repetition.
- No H3s were introduced because the current trust/support content does not need sub-sections.
- Footer/navigation labels remain short and unchanged.

## Verification

Focused heading tests run after the homepage H2 update:

```text
node .\node_modules\tsx\dist\cli.mjs scripts\homepage-headings.test.ts
homepage heading helper tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\homepage-heading-structure.test.ts
homepage heading structure tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\listing-detail-headings.test.ts
listing detail heading tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\areas-index-headings.test.ts
areas index heading tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\categories-index-headings.test.ts
categories index heading tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-landing-headings.test.ts
SEO landing heading helper tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-landing-page-render.test.ts
SEO landing page render tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-pages.test.ts
SEO page behavior tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\page-family-heading-snapshot.test.ts
page family heading snapshot tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-landing-headings.test.ts
SEO landing heading helper tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-landing-page-render.test.ts
SEO landing page render tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-pages.test.ts
SEO page behavior tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-landing-headings.test.ts
SEO landing heading helper tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-landing-page-render.test.ts
SEO landing page render tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-pages.test.ts
SEO page behavior tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-landing-headings.test.ts
SEO landing heading helper tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-landing-page-render.test.ts
SEO landing page render tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-pages.test.ts
SEO page behavior tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-landing-headings.test.ts
SEO landing heading helper tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-landing-page-render.test.ts
SEO landing page render tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-pages.test.ts
SEO page behavior tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-landing-headings.test.ts
SEO landing heading helper tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-landing-page-render.test.ts
SEO landing page render tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\seo-pages.test.ts
SEO page behavior tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\guide-headings.test.ts
guide heading tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\article-rendering.test.ts
article rendering tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\articles.test.ts
article behavior tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\trust-page-headings.test.ts
trust page heading tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\trust-pages.test.ts
trust pages tests passed

node .\node_modules\tsx\dist\cli.mjs scripts\directory-trust-rendering.test.ts
directory trust rendering tests passed
```

## Next Pages To Check

### Already Checked

- Homepage: `/`
- Restaurant detail pages: `/restaurants/[slug]`
- Areas index: `/areas`
- Categories index: `/categories`
- Area pages: `/areas/[area]`
- Neighborhood pages: `/neighborhoods/[neighborhood]`
- Category/cuisine pages: `/categories/[category]`
- Area + category pages: `/areas/[area]/categories/[category]`
- Best/search intent pages: `/best/[slug]`
- Service pages: `/services/[service]`
- Dietary pages: `/dietary/[dietary]`
- Offering pages: `/offerings/[offering]`
- Type pages: `/types/[type]`
- Guides index: `/guides`
- Published guide articles: `/guides/[slug]`
- Draft guide preview pages: `/guides/preview/[slug]`
- About: `/about`
- Contact: `/contact`
- Privacy policy: `/privacy-policy`
- Terms: `/terms`
- Methodology: `/methodology`
- Suggest update: `/suggest-update`

### Directory Index Pages

These broad navigation pages still need H1, H2, and H3 review:

- Restaurants index: `/restaurants`

### Dynamic SEO Landing Pages

These pages are high-value SEO landing families and should be checked with real examples:


### Utility Page

Lower organic priority, but still worth checking for clean structure:

- Compare saved restaurants: `/compare`

### No H-Tag Audit Needed

These pages either redirect or are system SEO files:

- Legacy listings redirect: `/listings`
- Legacy listing detail redirect: `/listings/[slug]`
- Sitemap: `/sitemap.xml`
- Robots: `/robots.txt`

### Recommended Audit Order

1. Compare page
2. Restaurants index page
3. H3 cleanup for checked SEO landing pages and article content

## Working Rule

Each page should have:

- One clear H1.
- H2s that target important search intent and divide the page into useful sections.
- H3s that support the H2s with related subtopics.
- Natural wording first, with keywords added where they still read well.
- A reusable pattern that works when the directory is copied to another niche.
