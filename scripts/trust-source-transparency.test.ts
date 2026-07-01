import assert from "node:assert/strict";
import { getTrustPage } from "../src/lib/trust-pages";
import { organizationJsonLd, websiteJsonLd } from "../src/lib/structured-data";

function pageText(key: Parameters<typeof getTrustPage>[0]) {
  const page = getTrustPage(key);
  return [
    page.title,
    page.metadataTitle,
    page.heading,
    page.description,
    ...page.sections.flatMap((section) => [section.heading, section.body])
  ]
    .filter(Boolean)
    .join(" ");
}

function trustPagesExplainDataSources() {
  const about = pageText("about");
  const methodology = pageText("methodology");

  for (const phrase of [
    "imported local business data",
    "Google rating",
    "Google review count",
    "Google review links",
    "opening hours",
    "service options"
  ]) {
    assert.ok(about.includes(phrase), `/about should explain source transparency phrase: ${phrase}`);
  }

  for (const phrase of [
    "Data Sources and Review Signals",
    "Review and Rating Limits",
    "Google review signals",
    "star-by-star review distribution is not currently imported",
    "check the restaurant profile and Google listing"
  ]) {
    assert.ok(methodology.includes(phrase), `/methodology should explain methodology phrase: ${phrase}`);
  }
}

function updateRequestsCoverReviewCorrections() {
  const suggestUpdate = pageText("suggest-update");

  assert.ok(suggestUpdate.includes("Google rating"), "update page should mention Google rating corrections");
  assert.ok(suggestUpdate.includes("Google review count"), "update page should mention Google review count corrections");
  assert.ok(suggestUpdate.includes("Google review link"), "update page should mention Google review link corrections");
}

function siteSchemaDescribesDirectoryTrustContext() {
  const organization = organizationJsonLd();
  const website = websiteJsonLd();

  assert.equal(typeof organization.description, "string");
  assert.equal(typeof website.description, "string");
  assert.ok(
    organization.description.includes("Indian restaurants in London"),
    "Organization schema should describe the directory topic"
  );
  assert.ok(
    website.description.includes("imported local business data"),
    "WebSite schema should mention the directory data basis"
  );
}

trustPagesExplainDataSources();
updateRequestsCoverReviewCorrections();
siteSchemaDescribesDirectoryTrustContext();

console.log("trust source transparency tests passed");
