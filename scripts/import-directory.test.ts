import assert from "node:assert/strict";
import {
  analyzeDirectoryRows,
  analyzeDirectoryBuffer,
  renderReportForListings,
  selectCuratedRestaurantSample,
  type Row
} from "../src/lib/directory-import";
import { getServiceOptions } from "../src/lib/directory";

function repeatedHeaderRowsAreSkipped() {
  const rows: Row[] = [
    {
      "Restaurant Name": "Restaurant Name",
      "Cuisine Type": "Cuisine Type",
      "Street Address": "Street Address",
      place_id: "place_id"
    },
    {
      "Restaurant Name": "Curry House",
      "Cuisine Type": "Indian, Punjabi",
      "Street Address": "1 High Street",
      place_id: "abc-123"
    }
  ];

  const result = analyzeDirectoryRows(rows, "test.csv", "dry run");

  assert.equal(result.listings.length, 1);
  assert.equal(result.listings[0].name, "Curry House");
  assert.equal(result.reportData.summary.sourceRows, 2);
  assert.equal(result.reportData.summary.skippedRows, 1);
}

function restaurantFeatureColumnsMapToDetails() {
  const rows: Row[] = [
    {
      "Restaurant Name": "Sample Kitchen",
      "Cuisine Type": "Thai, Asian",
      "Restaurant Type": "Casual Dining",
      "Dietary Options": "Vegan, Vegetarian",
      "Service options": "Delivery, Takeaway, Dine-in",
      Highlights: "Great tea selection",
      "Popular for": "Lunch, Dinner",
      Accessibility: "Wheelchair-accessible entrance",
      Offerings: "Small plates, Vegan options",
      "Dinning Options": "Lunch, Dinner, Seating",
      Amenities: "Toilet, Wi-Fi",
      Atmosphere: "Casual, Cosy",
      Crowd: "Groups",
      Planning: "Accepts reservations",
      Payments: "Credit cards",
      Children: "Good for kids",
      Parking: "Paid street parking",
      Pets: "Dogs allowed",
      "Order Online": "https://example.com/order",
      "Reserve a Table": "https://example.com/reserve",
      menu_link: "https://example.com/menu",
      Facebook: "/url?q=https://facebook.com/sample&sa=U&ved=test",
      Instagram: "not a url, https://instagram.com/sample",
      "Google Verified": "TRUE",
      place_id: "sample-place"
    }
  ];

  const result = analyzeDirectoryRows(rows, "test.csv", "dry run");
  const listing = result.listings[0];
  const socials = listing.contact?.socials as Record<string, string> | undefined;

  assert.deepEqual(listing.dietaryOptions, ["Vegan", "Vegetarian"]);
  assert.deepEqual(listing.details?.serviceOptions, ["Delivery", "Takeaway", "Dine-in"]);
  assert.deepEqual(listing.details?.highlights, ["Great tea selection"]);
  assert.deepEqual(listing.details?.popularFor, ["Lunch", "Dinner"]);
  assert.deepEqual(listing.details?.diningOptions, ["Lunch", "Dinner", "Seating"]);
  assert.deepEqual(listing.details?.payments, ["Credit cards"]);
  assert.deepEqual(listing.details?.parking, ["Paid street parking"]);
  assert.equal(listing.details?.googleVerified, true);
  assert.equal(listing.details?.placeId, "sample-place");
  assert.equal(listing.contact?.orderOnlineUrl, "https://example.com/order");
  assert.equal(listing.contact?.reserveUrl, "https://example.com/reserve");
  assert.equal(listing.contact?.menuUrl, "https://example.com/menu");
  assert.equal(socials?.facebook, "https://facebook.com/sample");
  assert.equal(socials?.instagram, "https://instagram.com/sample");
}

function actionLinksAreCleanedForSafeDisplay() {
  const rows: Row[] = [
    {
      "Restaurant Name": "Safe Links Kitchen",
      "Cuisine Type": "Indian",
      "Order Online": "/url?q=https://example.com/order%3Ftable%3D1&sa=U&ved=test",
      "Reserve a Table": "not a url, https://example.com/reserve, https://example.com/second",
      "Book Appointment": "javascript:alert(1)",
      menu_link: "https://example.com/menu, https://example.com/other-menu",
      place_id: "safe-links-place"
    }
  ];

  const result = analyzeDirectoryRows(rows, "test.csv", "dry run");
  const listing = result.listings[0];

  assert.equal(listing.contact?.orderOnlineUrl, "https://example.com/order?table=1");
  assert.equal(listing.contact?.reserveUrl, "https://example.com/reserve");
  assert.equal(listing.contact?.appointmentUrl, undefined);
  assert.equal(listing.contact?.menuUrl, "https://example.com/menu");
}

function csvBuffersParseQuotedCommasAndEscapedQuotes() {
  const csv = [
    "Restaurant Name,Cuisine Type,Description,Street Address,place_id",
    "\"Comma Kitchen\",\"Indian, Punjabi\",\"Known for \"\"quoted\"\" dishes, curries, and chai\",\"1 High Street\",csv-1"
  ].join("\n");

  const result = analyzeDirectoryBuffer(Buffer.from(csv, "utf8"), "test.csv", "dry run");
  const listing = result.listings[0];

  assert.equal(listing.name, "Comma Kitchen");
  assert.deepEqual(listing.categories, ["Indian", "Punjabi"]);
  assert.equal(listing.address, "1 High Street");
}

function nonCsvBuffersAreRejected() {
  assert.throws(
    () => analyzeDirectoryBuffer(Buffer.from("Restaurant Name\nBad Extension", "utf8"), "test.xlsx", "dry run"),
    /Only CSV files are supported/
  );
}

function ignoredColumnsAreReported() {
  const rows: Row[] = [
    {
      "Restaurant Name": "Sample Kitchen",
      "Cuisine Type": "Thai",
      "Street Address": "1 Test Street",
      "Owner Notes": "Do not publish",
      "Private Notes": "A"
    }
  ];

  const result = analyzeDirectoryRows(rows, "test.csv", "dry run");

  assert.ok(result.reportData.ignoredColumns.includes("Owner Notes"));
  assert.ok(result.reportData.ignoredColumns.includes("Private Notes"));
}

function sampledReportsUseSampledCounts() {
  const rows: Row[] = Array.from({ length: 3 }, (_, index) => ({
    "Restaurant Name": `Sample Kitchen ${index + 1}`,
    "Cuisine Type": "Thai",
    "Street Address": `${index + 1} Test Street`,
    "Google Rating": String(5 - index * 0.1),
    place_id: `sample-${index + 1}`
  }));

  const result = analyzeDirectoryRows(rows, "test.csv", "normal import");
  const sample = selectCuratedRestaurantSample(result.listings, { size: 2 });
  const report = renderReportForListings(result.reportData, sample, "curated sample");

  assert.equal(report.summary.importedListings, 2);
  assert.equal(report.summary.skippedRows, 1);
}

function serviceFilterExcludesAdvancedOnlyValues() {
  const serviceOptions = getServiceOptions();

  assert.ok(serviceOptions.includes("Delivery"));
  assert.ok(!serviceOptions.includes("Good for kids"));
  assert.ok(!serviceOptions.includes("Paid street parking"));
  assert.ok(!serviceOptions.includes("Casual"));
}

function listingDescriptionsUseDataRichCopy() {
  const rows: Row[] = [
    {
      "Restaurant Name": "Saravanaa Bhavan",
      "Cuisine Type": "South Indian, Indian",
      "Dietary Options": "Vegan, Vegetarian",
      "Service options": "Delivery, Takeaway, Dine-in",
      "Google Rating": "4.4",
      "Review Count": "5374",
      "Price Range": "£",
      Neighborhood: "Ilford",
      Borough: "Redbridge",
      "Tube Station": "Barkingside Underground Station",
      "Nearby Place of Worship": "Cranbrook Baptist Church",
      "Worship Distance (m)": "114",
      place_id: "saravanaa-description"
    }
  ];

  const result = analyzeDirectoryRows(rows, "test.csv", "normal import");
  const listing = result.listings[0];

  assert.ok(listing.description, "expected generated listing description");
  assert.ok(listing.metaDescription, "expected generated meta description");
  assert.equal(listing.description.split(". ").length, 2, "visible description should use two sentences");
  assert.match(listing.description, /South Indian/);
  assert.match(listing.description, /Ilford|Redbridge/);
  assert.match(listing.description, /vegan|vegetarian/i);
  assert.match(listing.description, /takeaway|delivery|dine-in/i);
  assert.match(listing.description, /5,374 Google reviews|5374 Google reviews/);
  assert.match(listing.description, /Barkingside Underground Station|Cranbrook Baptist Church/);
  assert.doesNotMatch(listing.description, /A great spot for authentic flavors|welcoming dining experience for all|is a highly-rated/i);
  assert.doesNotMatch(listing.metaDescription, /A great spot for authentic flavors|welcoming dining experience for all|is a highly-rated/i);
  assert.doesNotMatch(listing.metaDescription, /\b(and|near|with|dine-|di|n)\.$/i);
}

function listingDescriptionVariantsAreStableAndVaried() {
  const rows: Row[] = [
    {
      "Restaurant Name": "Alpha Kitchen",
      "Cuisine Type": "Indian, Punjabi",
      "Dietary Options": "Halal",
      "Service options": "Delivery, Takeaway",
      "Google Rating": "4.8",
      "Review Count": "320",
      Neighborhood: "Camden",
      "Tube Station": "Camden Town Underground Station",
      place_id: "alpha-description"
    },
    {
      "Restaurant Name": "Beta Dosa",
      "Cuisine Type": "South Indian, Indian",
      "Dietary Options": "Vegan, Vegetarian",
      "Service options": "Dine-in, Outdoor seating",
      "Google Rating": "4.3",
      "Review Count": "210",
      Neighborhood: "Wembley",
      "Nearby Cinema": "Troubadour Wembley Park Theatre",
      "Cinema Distance (m)": "300",
      place_id: "beta-description"
    }
  ];

  const first = analyzeDirectoryRows(rows, "test.csv", "normal import").listings;
  const second = analyzeDirectoryRows(rows, "test.csv", "normal import").listings;

  assert.equal(first[0].description, second[0].description, "same listing should keep the same generated copy");
  assert.notEqual(first[0].description, first[1].description, "different listings should not share one repeated formula");
  assert.ok(first.every((listing) => listing.metaDescription), "each listing should receive a generated meta description");
}

function listingMetaDescriptionsAvoidBrokenTruncation() {
  const rows: Row[] = [
    {
      "Restaurant Name": "Long Descriptive Indian Kitchen",
      "Cuisine Type": "Indian, Middle Eastern, Pakistani",
      "Dietary Options": "Vegan, Vegetarian",
      "Service options": "Delivery, Takeaway, Dine-in",
      "Google Rating": "4.9",
      "Review Count": "1234",
      Neighborhood: "South Kensington",
      Borough: "Kensington & Chelsea",
      "Nearby Museum": "Royal College of Music Museum",
      "Museum Distance (m)": "446",
      place_id: "long-description"
    }
  ];

  const listing = analyzeDirectoryRows(rows, "test.csv", "normal import").listings[0];

  assert.ok(listing.metaDescription, "expected generated meta description");
  assert.doesNotMatch(listing.metaDescription, /\b(and|near|with|dine-|di|n)\.$/i);
  assert.doesNotMatch(listing.metaDescription, /-\.$/);
}

repeatedHeaderRowsAreSkipped();
restaurantFeatureColumnsMapToDetails();
actionLinksAreCleanedForSafeDisplay();
csvBuffersParseQuotedCommasAndEscapedQuotes();
nonCsvBuffersAreRejected();
ignoredColumnsAreReported();
sampledReportsUseSampledCounts();
serviceFilterExcludesAdvancedOnlyValues();
listingDescriptionsUseDataRichCopy();
listingDescriptionVariantsAreStableAndVaried();
listingMetaDescriptionsAvoidBrokenTruncation();

console.log("import-directory behavior tests passed");
