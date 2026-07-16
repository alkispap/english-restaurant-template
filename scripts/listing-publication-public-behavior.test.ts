import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

process.env.NEXT_STATIC_EXPORT = "1";

import { filterListings } from "../src/lib/directory";
import {
  getListingPublicationState,
  pendingReviewListings,
  publishedListings,
  publiclyRoutableListings
} from "../src/data/listing-publication";
import { generateMetadata, generateStaticParams } from "../src/app/restaurants/[slug]/page";

const pendingSlugs = [
  "biriyani-junction",
  "bazaar-london-s-indian-takeaway-aldgate",
  "bazaar-london-s-indian-takeaway-hackney",
  "calm-indiana-cow",
  "chakra-indian-cuisine",
  "chef-tazzy",
  "chotiwala",
  "contemporary-indian-cuisine",
  "dancing-elephant",
  "delhiacacies-deliveroo",
  "faizan-ahmad",
  "ghani-food-and-spices",
  "golis-south-norwood",
  "home-kitchen",
  "indian-food-camden",
  "modern-indian",
  "real-taste-of-india",
  "republic-restaurant-verney-road",
  "spice-garden",
  "spikky-pepperdem-food",
  "staffordshire",
  "sucess-worker",
  "taj",
  "thanjavur-food-lounge-ltd",
  "the-palm-indian-restaurant-limited"
];
const excludedSlugs = ["bombay-kitchen-brixton", "borough-market"];

main();

async function main() {
  assert.equal(publishedListings.length, 3159);
  assert.equal(pendingReviewListings.length, 25);
  assert.deepEqual(pendingReviewListings.map((listing) => listing.slug).sort(), [...pendingSlugs].sort());
  assert.equal(publiclyRoutableListings.length, 3184, "pending review pages should retain their exact URL while excluded routes are omitted");
  assert.ok(pendingSlugs.every((slug) => getListingPublicationState(slug).status === "pending-review"));
  assert.ok(excludedSlugs.every((slug) => getListingPublicationState(slug).status === "excluded"));

  const publicResults = new Set(filterListings({}).map((listing) => listing.slug));
  for (const slug of [...pendingSlugs, ...excludedSlugs]) assert.ok(!publicResults.has(slug), `public filters should omit ${slug}`);

  const staticSlugs = new Set(generateStaticParams().map((item) => item.slug));
  for (const slug of pendingSlugs) assert.ok(staticSlugs.has(slug), `pending review route should remain generated: ${slug}`);
  for (const slug of excludedSlugs) assert.ok(!staticSlugs.has(slug), `excluded route should not be generated: ${slug}`);

  const metadata = await generateMetadata({ params: Promise.resolve({ slug: "biriyani-junction" }) });
  assert.equal(metadata.robots && typeof metadata.robots === "object" ? metadata.robots.index : undefined, false);
  assert.equal(metadata.alternates, undefined, "pending pages should not emit canonical metadata");
  assert.match(String(metadata.title), /under editorial review/i);

  const pageSource = fs.readFileSync(path.join(process.cwd(), "src", "app", "restaurants", "[slug]", "page.tsx"), "utf8");
  assert.match(pageSource, /publication\.status === "pending-review"[\s\S]*ListingUnderReview/, "pending routes should branch before public listing detail rendering");
  const reviewSource = fs.readFileSync(path.join(process.cwd(), "src", "components", "ListingUnderReview.tsx"), "utf8");
  assert.ok(!/address|phone|rating|workingHours|JsonLd/.test(reviewSource), "pending review page must not expose operational listing fields or structured data");

  const clientFiles = walk(path.join(process.cwd(), "src")).filter((file) => /\.(ts|tsx)$/.test(file));
  for (const file of clientFiles) {
    const source = fs.readFileSync(file, "utf8");
    if (source.startsWith('"use client"')) assert.ok(!source.includes("data/listing-publication"), `client file must not bundle editorial registry: ${file}`);
  }

  console.log("listing publication public behavior tests passed");
}

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}
