import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getAllArticles, getPublicGuideArticles } from "../src/lib/articles";
import { getDirectoryLandingModel } from "../src/lib/directory-landing";
import { siteConfig } from "../src/config/site";

const homepageSource = fs.readFileSync("src/components/DirectoryLandingPage.tsx", "utf8");
const homepageModelSource = fs.readFileSync("src/lib/directory-landing.ts", "utf8");
const globalStylesSource = fs.readFileSync("src/app/globals.css", "utf8");
const genericAltPattern = /\b(visual guide|visual summary|image|photo|picture)\b/i;

function homepageHeroUsesSeoVisibleImage() {
  assert.ok(siteConfig.heroImage.startsWith("/images/homepage/"), "homepage hero should use a local image asset");
  assert.ok(siteConfig.heroImageMobile.startsWith("/images/homepage/"), "homepage hero should use a local mobile image asset");
  assert.ok(siteConfig.heroImage.endsWith(".webp"), "homepage desktop hero should use an optimized WebP asset");
  assert.ok(siteConfig.heroImageMobile.endsWith(".webp"), "homepage mobile hero should use an optimized WebP asset");
  assert.ok(fs.existsSync(publicPath(siteConfig.heroImage)), "homepage hero image file should exist");
  assert.ok(fs.existsSync(publicPath(siteConfig.heroImageMobile)), "homepage mobile hero image file should exist");
  assert.ok(fileSize(publicPath(siteConfig.heroImage)) < 700_000, "homepage desktop hero should stay below 700 KB");
  assert.ok(fileSize(publicPath(siteConfig.heroImageMobile)) < 400_000, "homepage mobile hero should stay below 400 KB");
  const mobileDimensions = webpDimensions(publicPath(siteConfig.heroImageMobile));
  assert.ok(
    mobileDimensions.height > mobileDimensions.width,
    "homepage mobile hero image should use a portrait crop"
  );
  assert.ok(homepageSource.includes("<picture"), "homepage hero should use a responsive picture element");
  assert.ok(
    homepageSource.includes('media="(max-width: 639px)"'),
    "homepage hero should select the mobile image with a media query"
  );
  assert.ok(homepageSource.includes("alt={siteConfig.heroImageAlt}"), "homepage hero image should use configured alt text");
  assert.ok(homepageSource.includes("srcSet={siteConfig.heroImageMobile}"), "homepage should expose the mobile hero image source");
  assert.ok(homepageSource.includes("src={siteConfig.heroImage}"), "homepage should expose the desktop hero image fallback");
  assert.ok(homepageSource.includes('fetchPriority="high"'), "homepage hero should keep high fetch priority for the selected image");
  assert.ok(!homepageSource.includes("priority"), "homepage hero should not use two Next Image priority preloads");
  assert.ok(!homepageSource.includes("backgroundImage:"), "homepage hero should not hide the main image as CSS background only");
}

function homepageDiscoveryCardsUseLocalGeneratedImages() {
  assert.ok(homepageSource.includes("<LandingCardSection section={model.primaryNeeds}"), "homepage should render primary dietary cards");
  assert.ok(homepageSource.includes("<LandingCardSection section={model.diningHubs}"), "homepage should render dining hub cards");
  assert.ok(homepageSource.includes("<LandingCardSection section={model.serviceNeeds}"), "homepage should render service cards");
  assert.ok(homepageModelSource.includes("imageAlt:"), "homepage card model should provide meaningful image alt text");
  assert.ok(homepageSource.includes("alt={item.imageAlt}"), "homepage image cards should render their model alt text");
}

function diningHubImagesUseOptimizedLocalAssets() {
  const hubCards = getDirectoryLandingModel().diningHubs.items;

  assert.equal(hubCards.length, 5, "homepage should render five London dining hub cards");
  hubCards.forEach((card) => {
    const image = card.image;
    assert.ok(image, `${card.title} should have an image`);
    assert.ok(image.startsWith("/images/homepage/dining-hubs/"), `${card.title} should use a local dining hub image`);
    assert.ok(image.endsWith(".webp"), `${card.title} dining hub image should be WebP`);
    assert.ok(card.imageAlt.length >= 30, `${card.title} should have meaningful image alt text`);
    assert.ok(card.imageCredit?.sourceUrl, `${card.title} should include a source URL`);
    assert.ok(card.imageCredit?.licenseUrl, `${card.title} should include a license URL`);

    const imagePath = publicPath(image);
    assert.ok(fs.existsSync(imagePath), `${image} should exist`);
    assert.ok(fileSize(imagePath) < 250_000, `${image} should stay below 250 KB`);
    const dimensions = webpDimensions(imagePath);
    assert.equal(dimensions.width, 800, `${image} should use the shared card width`);
    assert.equal(dimensions.height, 450, `${image} should use the shared card height`);
  });
}

function dietaryCardImagesUseOptimizedLocalAssets() {
  const dietaryCards = getDirectoryLandingModel().primaryNeeds.items;

  assert.equal(dietaryCards.length, 4, "homepage should render four primary dietary cards");
  dietaryCards.forEach((card) => {
    const image = card.image;
    assert.ok(image, `${card.title} should have an image`);
    assert.ok(image.startsWith("/images/homepage/dietary/"), `${card.title} should use a local dietary illustration`);
    assert.ok(image.endsWith(".webp"), `${card.title} dietary image should be WebP`);
    assert.ok(card.imageAlt.length >= 40, `${card.title} should have meaningful image alt text`);
    assert.equal(card.imageCredit, undefined, `${card.title} generated illustration should not require a photo credit`);

    const imagePath = publicPath(image);
    assert.ok(fs.existsSync(imagePath), `${image} should exist`);
    assert.ok(fileSize(imagePath) < 250_000, `${image} should stay below 250 KB`);
    const dimensions = webpDimensions(imagePath);
    assert.equal(dimensions.width, 800, `${image} should use the shared card width`);
    assert.equal(dimensions.height, 450, `${image} should use the shared card height`);
  });
}

function homepageOrnamentUsesOptimizedDecorativeAsset() {
  const ornament = "/images/homepage/decorative/indian-editorial-ornament.webp";
  const ornamentPath = publicPath(ornament);

  assert.ok(fs.existsSync(ornamentPath), "homepage decorative ornament should exist");
  assert.ok(fileSize(ornamentPath) < 200_000, "homepage decorative ornament should stay below 200 KB");
  assert.deepEqual(webpDimensions(ornamentPath), { width: 1600, height: 800 });
  assert.ok(globalStylesSource.includes(`url("${ornament}")`), "homepage CSS should reference the local ornament");
  assert.ok(
    globalStylesSource.includes(".directory-home .home-band--ornament::before"),
    "homepage ornament should be rendered through a homepage-scoped pseudo-element"
  );
  assert.ok(!homepageSource.includes(ornament), "decorative ornament should not be rendered as announced image content");
}

function articleImagesUseMeaningfulAltText() {
  const weakAlts = getAllArticles()
    .flatMap((article) => articleImages(article).map((image) => ({ article: article.slug, alt: image.alt })))
    .filter((image) => !image.alt || image.alt.length < 35 || genericAltPattern.test(image.alt));

  assert.deepEqual(weakAlts, [], "article images should have descriptive, non-generic alt text");
}

function publishedArticleLocalImagesExist() {
  const missingImages = getPublicGuideArticles()
    .flatMap((article) => articleImages(article).map((image) => ({ article: article.slug, src: image.src })))
    .filter((image) => image.src.startsWith("/") && !fs.existsSync(publicPath(image.src)));

  assert.deepEqual(missingImages, [], "published article images should exist in public/images");
}

function localImageAssetsStayPerformanceFriendly() {
  const unusedHomepagePngs = [
    "/images/homepage/indian-restaurants-london-hero.png",
    "/images/homepage/indian-restaurants-london-hero-mobile.png"
  ].filter((src) => fs.existsSync(publicPath(src)));

  assert.deepEqual(unusedHomepagePngs, [], "unused large homepage PNG source images should not be exported");

  const heavyPublishedArticleImages = getPublicGuideArticles()
    .flatMap((article) => articleImages(article).map((image) => ({ article: article.slug, src: image.src })))
    .filter((image) => image.src.startsWith("/") && !image.src.endsWith(".svg"))
    .filter((image) => !image.src.endsWith(".webp") || fileSize(publicPath(image.src)) > 450_000);

  assert.deepEqual(
    heavyPublishedArticleImages,
    [],
    "published article raster images should use optimized WebP files under 450 KB"
  );
}

function publicPath(src: string) {
  return path.join(process.cwd(), "public", src.replace(/^\//, ""));
}

function fileSize(filePath: string) {
  return fs.statSync(filePath).size;
}

function webpDimensions(filePath: string) {
  const buffer = fs.readFileSync(filePath);
  assert.equal(buffer.toString("ascii", 0, 4), "RIFF", "expected a RIFF WebP file");
  assert.equal(buffer.toString("ascii", 8, 12), "WEBP", "expected a WebP file");
  const chunk = buffer.toString("ascii", 12, 16);

  if (chunk === "VP8X") {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3)
    };
  }

  if (chunk === "VP8 ") {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff
    };
  }

  if (chunk === "VP8L") {
    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1
    };
  }

  return {
    width: 0,
    height: 0
  };
}

function articleImages(article: ReturnType<typeof getAllArticles>[number]) {
  return [
    ...(article.heroImage ? [article.heroImage] : []),
    ...(article.visualBlocks ?? []).map((block) => block.image)
  ];
}

homepageHeroUsesSeoVisibleImage();
homepageDiscoveryCardsUseLocalGeneratedImages();
dietaryCardImagesUseOptimizedLocalAssets();
diningHubImagesUseOptimizedLocalAssets();
homepageOrnamentUsesOptimizedDecorativeAsset();
articleImagesUseMeaningfulAltText();
publishedArticleLocalImagesExist();
localImageAssetsStayPerformanceFriendly();

console.log("image SEO tests passed");
