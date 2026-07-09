import assert from "node:assert/strict";
import { siteConfig } from "../src/config/site";
import { generateMetadata as homepageMetadata } from "../src/app/page";
import { generateMetadata as restaurantIndexMetadata } from "../src/app/restaurants/page";
import { metadata as areasIndexMetadata } from "../src/app/areas/page";
import { metadata as categoriesIndexMetadata } from "../src/app/categories/page";
import { generateMetadata as guidesIndexMetadata } from "../src/app/guides/page";
import { metadata as aboutMetadata } from "../src/app/about/page";
import { metadata as contactMetadata } from "../src/app/contact/page";
import { metadata as privacyMetadata } from "../src/app/privacy-policy/page";
import { metadata as termsMetadata } from "../src/app/terms/page";
import { metadata as methodologyMetadata } from "../src/app/methodology/page";
import { metadata as suggestUpdateMetadata } from "../src/app/suggest-update/page";
import { generateMetadata as listingDetailMetadata } from "../src/app/restaurants/[slug]/page";
import { generateMetadata as areaMetadata } from "../src/app/areas/[area]/page";
import { generateMetadata as neighborhoodMetadata } from "../src/app/neighborhoods/[neighborhood]/page";
import { generateMetadata as categoryMetadata } from "../src/app/categories/[category]/page";
import { generateMetadata as areaCategoryMetadata } from "../src/app/areas/[area]/categories/[category]/page";
import { generateMetadata as popularSearchMetadata } from "../src/app/best/[slug]/page";
import { generateMetadata as serviceMetadata } from "../src/app/services/[service]/page";
import { generateMetadata as dietaryMetadata } from "../src/app/dietary/[dietary]/page";
import { generateMetadata as offeringMetadata } from "../src/app/offerings/[offering]/page";
import { generateMetadata as typeMetadata } from "../src/app/types/[type]/page";
import {
  getAllArticles,
  getArticleRouteMetadata,
  getDraftPreviewRouteMetadata,
  getPreviewArticleBySlug,
  getPublishedArticleBySlug
} from "../src/lib/articles";

async function homepageMetadataUsesApprovedDirectoryTitle() {
  const metadata = await homepageMetadata();

  assert.equal(metadata.title, "Indian Restaurants in London Directory");
  assert.ok(
    !(metadata.title as string).includes(`| ${siteConfig.siteName}`),
    "homepage metadata title should let the root title template append the site name"
  );
}

async function directoryIndexMetadataUsesApprovedTitles() {
  const restaurantMetadata = restaurantIndexMetadata();
  const routeMetadata = [
    { path: "/restaurants", title: restaurantMetadata.title, expected: "Search Indian Restaurants in London" },
    { path: "/areas", title: areasIndexMetadata.title, expected: "Indian Restaurants in London by Area" },
    { path: "/categories", title: categoriesIndexMetadata.title, expected: "Indian Restaurants in London by Cuisine" }
  ];

  routeMetadata.forEach((entry) => {
    assert.equal(entry.title, entry.expected, `${entry.path} should use the approved raw title`);
    assert.ok(
      !(entry.title as string).includes(`| ${siteConfig.siteName}`),
      `${entry.path} metadata title should let the root title template append the site name`
    );
  });
}

async function restaurantDetailMetadataUsesGeneratedLocalTitles() {
  const samples = [
    { slug: "the-curry-club-london", expected: "The Curry Club London in Redbridge, London - Reviews & Details" },
    { slug: "hyderabad-darbar", expected: "HYDERABAD DARBAR in Redbridge, London - Reviews & Details" },
    { slug: "saravanaa-bhavan", expected: "Saravanaa Bhavan in Redbridge, London - Reviews & Details" }
  ];

  for (const sample of samples) {
    const metadata = await listingDetailMetadata({ params: Promise.resolve({ slug: sample.slug }) });
    assert.equal(metadata.title, sample.expected, `${sample.slug} should use the generated local detail title`);
    assert.equal(metadata.openGraph?.title, sample.expected, `${sample.slug} Open Graph title should match`);
    assert.equal(metadata.twitter?.title, sample.expected, `${sample.slug} Twitter title should match`);
    assert.ok(
      !(metadata.title as string).includes(`| ${siteConfig.siteName}`),
      `${sample.slug} metadata title should let the root title template append the site name`
    );
    assert.ok(
      !(metadata.title as string).includes("| Barkingside"),
      `${sample.slug} metadata title should not use imported separator-heavy metaTitle values`
    );
    assert.ok(
      !(metadata.title as string).includes("| Cranbrook"),
      `${sample.slug} metadata title should not use imported separator-heavy metaTitle values`
    );
  }
}

async function pageMetadataDoesNotRepeatRootTitleTemplate() {
  const metadata = await Promise.all([
    categoryMetadata({ params: Promise.resolve({ category: "indian" }) }),
    areaCategoryMetadata({
      params: Promise.resolve({ area: "redbridge", category: "indian" })
    }),
    popularSearchMetadata({ params: Promise.resolve({ slug: "best-rated" }) })
  ]);

  metadata.forEach((entry) => {
    assert.equal(typeof entry.title, "string");
    assert.ok(
      !(entry.title as string).includes(`| ${siteConfig.siteName}`),
      "page metadata title should let the root title template append the site name"
    );
  });
}

async function dynamicSeoLandingMetadataUsesApprovedTitles() {
  const entries = [
    {
      path: "/areas/barnet",
      metadata: await areaMetadata({ params: Promise.resolve({ area: "barnet" }) }),
      expected: "Indian Restaurants in Barnet, London"
    },
    {
      path: "/neighborhoods/abbey-wood",
      metadata: await neighborhoodMetadata({ params: Promise.resolve({ neighborhood: "abbey-wood" }) }),
      expected: "Indian Restaurants in Abbey Wood, London"
    },
    {
      path: "/categories/afghan",
      metadata: await categoryMetadata({ params: Promise.resolve({ category: "afghan" }) }),
      expected: "Afghan Restaurants in London"
    },
    {
      path: "/areas/harrow/categories/indian",
      metadata: await areaCategoryMetadata({ params: Promise.resolve({ area: "harrow", category: "indian" }) }),
      expected: "Indian Restaurants in Harrow, London"
    },
    {
      path: "/best/best-rated",
      metadata: await popularSearchMetadata({ params: Promise.resolve({ slug: "best-rated" }) }),
      expected: "Best rated Indian restaurants in London"
    },
    {
      path: "/services/takeaway",
      metadata: await serviceMetadata({ params: Promise.resolve({ service: "takeaway" }) }),
      expected: "Indian Restaurants with Takeaway in London"
    },
    {
      path: "/dietary/halal",
      metadata: await dietaryMetadata({ params: Promise.resolve({ dietary: "halal" }) }),
      expected: "Halal Indian Restaurants in London"
    },
    {
      path: "/offerings/alcohol",
      metadata: await offeringMetadata({ params: Promise.resolve({ offering: "alcohol" }) }),
      expected: "Indian Restaurants with Alcohol in London"
    },
    {
      path: "/types/casual-dining",
      metadata: await typeMetadata({ params: Promise.resolve({ type: "casual-dining" }) }),
      expected: "Casual Dining Indian Restaurants in London"
    }
  ];

  entries.forEach((entry) => {
    assert.equal(entry.metadata.title, entry.expected, `${entry.path} should use the approved dynamic landing title`);
    assert.ok(
      !(entry.metadata.title as string).includes(`| ${siteConfig.siteName}`),
      `${entry.path} metadata title should let the root title template append the site name`
    );
  });
}

async function guideAndArticleMetadataUsesApprovedTitles() {
  const guidesMetadata = guidesIndexMetadata();

  assert.equal(guidesMetadata.title, "Indian Food and Restaurant Guides in London");
  assert.ok(
    !(guidesMetadata.title as string).includes(`| ${siteConfig.siteName}`),
    "/guides metadata title should let the root title template append the site name"
  );

  const articles = getAllArticles();
  const publishedArticle = getPublishedArticleBySlug("what-is-indian-food", articles);
  const draftArticle = getPreviewArticleBySlug("how-to-choose-indian-restaurant-london", articles);

  assert.ok(publishedArticle, "published guide article fixture should exist");
  assert.ok(draftArticle, "draft guide article fixture should exist");

  const publishedMetadata = getArticleRouteMetadata(publishedArticle);
  const draftMetadata = getDraftPreviewRouteMetadata(draftArticle);

  assert.equal(publishedMetadata.title, "What Is Indian Food? A Beginner's Guide");
  assert.equal(draftMetadata.title, "How to Choose an Indian Restaurant in London");
  assert.ok(
    !(publishedMetadata.title as string).includes(`| ${siteConfig.siteName}`),
    "published guide metadata title should let the root title template append the site name"
  );
  assert.ok(
    !(draftMetadata.title as string).includes("| Guide"),
    "draft guide metadata title should remove the trailing Guide suffix"
  );
}

async function trustAndSupportMetadataUsesApprovedTitles() {
  const entries = [
    { path: "/about", metadata: aboutMetadata, expected: "About This Indian Restaurant Directory" },
    { path: "/contact", metadata: contactMetadata, expected: "Contact the Indian Restaurants in London Directory" },
    { path: "/privacy-policy", metadata: privacyMetadata, expected: "Privacy Policy for This Restaurant Directory" },
    { path: "/terms", metadata: termsMetadata, expected: "Terms for Using This Restaurant Directory" },
    { path: "/methodology", metadata: methodologyMetadata, expected: "How We Rank Indian Restaurants in London" },
    { path: "/suggest-update", metadata: suggestUpdateMetadata, expected: "Suggest an Indian Restaurant Update" }
  ];

  entries.forEach((entry) => {
    assert.equal(entry.metadata.title, entry.expected, `${entry.path} should use the approved trust/support title`);
    assert.ok(
      !(entry.metadata.title as string).includes(`| ${siteConfig.siteName}`),
      `${entry.path} metadata title should let the root title template append the site name`
    );
  });
}

Promise.all([
  homepageMetadataUsesApprovedDirectoryTitle(),
  directoryIndexMetadataUsesApprovedTitles(),
  restaurantDetailMetadataUsesGeneratedLocalTitles(),
  dynamicSeoLandingMetadataUsesApprovedTitles(),
  guideAndArticleMetadataUsesApprovedTitles(),
  trustAndSupportMetadataUsesApprovedTitles(),
  pageMetadataDoesNotRepeatRootTitleTemplate()
]).then(() => {
  console.log("metadata title tests passed");
});
