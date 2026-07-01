import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getAllArticles, getPublicGuideArticles } from "../src/lib/articles";
import { siteConfig } from "../src/config/site";

const homepageSource = fs.readFileSync("src/components/DirectoryListingsView.tsx", "utf8");
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
  const discoveryImages = [
    "/images/homepage/discovery-area.webp",
    "/images/homepage/discovery-cuisines.webp",
    "/images/homepage/discovery-takeaway.webp",
    "/images/homepage/discovery-halal.webp",
    "/images/homepage/discovery-vegetarian.webp",
    "/images/homepage/discovery-best-rated.webp"
  ];

  discoveryImages.forEach((src) => {
    assert.ok(homepageSource.includes(src), `homepage discovery cards should reference ${src}`);
    assert.ok(fs.existsSync(publicPath(src)), `${src} should exist`);
    assert.ok(fileSize(publicPath(src)) < 250_000, `${src} should stay below 250 KB`);
    const dimensions = webpDimensions(publicPath(src));
    assert.ok(dimensions.width > dimensions.height, `${src} should use a landscape crop`);
  });

  [
    "London street with Indian restaurants for browsing by area",
    "Indian dishes showing different cuisines and restaurant styles",
    "Indian takeaway containers ready for collection",
    "Halal-friendly Indian restaurant table with shared dishes",
    "Vegetarian Indian thali with colourful vegetable dishes",
    "Highly rated Indian restaurant table with polished dishes"
  ].forEach((alt) => {
    assert.ok(homepageSource.includes(alt), `homepage discovery image alt text should include "${alt}"`);
  });
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
articleImagesUseMeaningfulAltText();
publishedArticleLocalImagesExist();
localImageAssetsStayPerformanceFriendly();

console.log("image SEO tests passed");
