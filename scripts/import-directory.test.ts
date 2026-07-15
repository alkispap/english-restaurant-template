import assert from "node:assert/strict";
import {
  analyzeDirectoryRows,
  analyzeDirectoryBuffer,
  renderListingFilterCountsJsonFile,
  renderMissingCategoryReview,
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

function importGeneratesCompactNormalizedFilterCounts() {
  const listings = [
    {
      name: "First Kitchen",
      slug: "first-kitchen",
      images: [],
      categories: ["Indian", "South Indian"],
      listingTypes: ["Casual Dining"],
      dietaryOptions: ["Vegan"],
      tags: [],
      area: "Tower Hamlets",
      neighborhood: "Brick Lane",
      priceLevel: "££" as const,
      details: { serviceOptions: ["Delivery", "Takeaway"], offerings: ["Coffee"] }
    },
    {
      name: "Second Kitchen",
      slug: "second-kitchen",
      images: [],
      categories: ["Indian"],
      listingTypes: ["Fine Dining"],
      dietaryOptions: ["Vegan"],
      tags: [],
      area: "Tower Hamlets",
      neighborhood: "Whitechapel",
      priceLevel: "££" as const,
      details: { serviceOptions: ["Delivery"], offerings: ["Coffee"] }
    }
  ];

  const counts = JSON.parse(renderListingFilterCountsJsonFile(listings));

  assert.equal(counts.area["tower-hamlets"], 2);
  assert.equal(counts.neighborhood["brick-lane"], 1);
  assert.equal(counts.category.indian, 2);
  assert.equal(counts.category["south-indian"], 1);
  assert.equal(counts.type["casual-dining"], 1);
  assert.equal(counts.dietary.vegan, 2);
  assert.equal(counts.service.delivery, 2);
  assert.equal(counts.service.takeaway, 1);
  assert.equal(counts.offering.coffee, 2);
  assert.equal(counts.price["££"], 2);
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
  assert.match(listing.description, /Barkingside Underground Station|Cranbrook Baptist Church/);
  assert.match(listing.description, /Saravanaa Bhavan is a South Indian restaurant in Ilford, Redbridge serving South Indian food\./);
  assert.doesNotMatch(listing.description, /The listing includes|Google reviews|compare/i);
  assert.doesNotMatch(listing.description, /A great spot for authentic flavors|welcoming dining experience for all|is a highly-rated/i);
  assert.doesNotMatch(listing.metaDescription, /A great spot for authentic flavors|welcoming dining experience for all|is a highly-rated/i);
  assert.doesNotMatch(listing.metaDescription, /The listing includes|Google reviews|compare/i);
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

function listingDescriptionsAvoidAwkwardSeoCopy() {
  const rows: Row[] = [
    {
      "Restaurant Name": "Royal Nawaab",
      "Cuisine Type": "Indian",
      "Service options": "Delivery, Takeaway, Dine-in",
      "Google Rating": "5",
      "Review Count": "18625",
      Neighborhood: "Ilford",
      Borough: "Redbridge",
      "Tube Station": "Barkingside Underground Station",
      place_id: "indian-article-description"
    },
    {
      "Restaurant Name": "Kera Restaurant",
      "Service options": "Takeaway, Dine-in",
      "Review Count": "27",
      Neighborhood: "Finsbury Park",
      Borough: "Islington",
      "Nearby Cinema": "Finsbury Park Picturehouse",
      "Cinema Distance (m)": "200",
      place_id: "missing-category-description"
    },
    {
      "Restaurant Name": "Kabul Kitchen",
      "Cuisine Type": "Afghan",
      "Service options": "Takeaway, Delivery",
      "Review Count": "120",
      Neighborhood: "Harrow",
      Borough: "Harrow",
      place_id: "afghan-article-description"
    }
  ];

  const listings = analyzeDirectoryRows(rows, "test.csv", "normal import").listings;
  const [indian, uncategorized, afghan] = listings;

  assert.match(indian.description ?? "", /Royal Nawaab is an Indian restaurant in Ilford, Redbridge serving Indian food\./i);
  assert.doesNotMatch(indian.description ?? "", /\ba Indian\b|Indian option|appears as|is listed for|is listed in|restaurant covering|The listing includes|Google reviews|compare/i);
  assert.doesNotMatch(indian.metaDescription ?? "", /\ba Indian\b|Restaurant food|Indian option|The listing includes|Google reviews|compare/i);

  assert.match(uncategorized.description ?? "", /Kera Restaurant is a restaurant in Finsbury Park, Islington/i);
  assert.doesNotMatch(uncategorized.description ?? "", /Restaurant food|Restaurant restaurant|The listing includes|Google reviews|compare/i);
  assert.doesNotMatch(uncategorized.metaDescription ?? "", /Restaurant food|Restaurant restaurant|The listing includes|Google reviews|compare/i);

  assert.match(afghan.description ?? "", /\b(an Afghan restaurant|serves Afghan food|offers Afghan food)\b/i);
  assert.doesNotMatch(afghan.description ?? "", /\ba Afghan\b|Afghan option/i);
}

function duplicateListingSlugsPreferLocalAreaBeforeNumbers() {
  const rows: Row[] = [
    {
      "Restaurant Name": "Curry House",
      "Cuisine Type": "Indian",
      Borough: "Redbridge",
      Neighborhood: "Ilford",
      place_id: "curry-redbridge"
    },
    {
      "Restaurant Name": "Curry House",
      "Cuisine Type": "Indian",
      Borough: "Camden",
      Neighborhood: "Camden Town",
      place_id: "curry-camden"
    },
    {
      "Restaurant Name": "Curry House",
      "Cuisine Type": "Indian",
      Borough: "Camden",
      Neighborhood: "Kentish Town",
      place_id: "curry-kentish"
    }
  ];

  const listings = analyzeDirectoryRows(rows, "test.csv", "normal import").listings;

  assert.deepEqual(
    listings.map((listing) => listing.slug),
    ["curry-house", "curry-house-camden", "curry-house-kentish-town"]
  );
}

function missingCategoriesUseConservativeInferenceAndReview() {
  const rows: Row[] = [
    {
      "Restaurant Name": "Moj Spice Indian Takeaway",
      "Cuisine Type": "",
      "Restaurant Type": "",
      "Service options": "Delivery, Takeaway",
      Offerings: "Quick bite",
      Borough: "Redbridge",
      Neighborhood: "South Woodford",
      "Google Reviews": "89",
      place_id: "moj-spice"
    },
    {
      "Restaurant Name": "Chennai Dosa Surbiton",
      "Cuisine Type": "",
      "Restaurant Type": "Casual Dining",
      "Service options": "Delivery, Takeaway, Dine-in",
      Offerings: "Halal food, Vegetarian options",
      Borough: "Kingston upon Thames",
      Neighborhood: "Tolworth",
      "Google Reviews": "340",
      place_id: "chennai-dosa"
    },
    {
      "Restaurant Name": "Bang Bang Oriental Foodhall",
      "Cuisine Type": "",
      "Restaurant Type": "Casual Dining",
      "Service options": "Dine-in",
      Borough: "Brent",
      Neighborhood: "Colindale",
      "Google Reviews": "10267",
      place_id: "foodhall"
    }
  ];

  const result = analyzeDirectoryRows(rows, "test.csv", "normal import");
  const bySlug = new Map(result.listings.map((listing) => [listing.slug, listing]));

  assert.deepEqual(bySlug.get("moj-spice-indian-takeaway")?.categories, ["Indian"]);
  assert.deepEqual(bySlug.get("chennai-dosa-surbiton")?.categories, ["South Indian", "Indian"]);
  assert.deepEqual(bySlug.get("bang-bang-oriental-foodhall")?.categories, []);

  const review = renderMissingCategoryReview(result.categoryReview);
  assert.match(review, /Missing Category Review/);
  assert.match(review, /inferred[\s\S]+Moj Spice Indian Takeaway[\s\S]+Indian/);
  assert.match(review, /inferred[\s\S]+Chennai Dosa Surbiton[\s\S]+South Indian, Indian/);
  assert.match(review, /manual_review[\s\S]+Bang Bang Oriental Foodhall/);
}

function sourceDataOverridesCorrectKnownLocalBusinessErrors() {
  const rows: Row[] = [
    {
      "Restaurant Name": "Yummy Dosa Catering",
      "Cuisine Type": "South Indian",
      Website: "https://yummydosarestaurant.co.uk/",
      Phone: "+44 7776 675146",
      Phone_2: "447776675146",
      Email: "yummydosailford@gmail.com",
      City: "London",
      Borough: "Barking & Dagenham",
      Neighborhood: "Barking",
      Area: "Farr Avenue Area",
      Postcode: "IG11 0NY",
      "Street Address": "5 Farr Ave",
      latitude: "47.73855",
      longitude: "12.5088275",
      place_id: "ChIJocOA2Stm2qoRoXP2Vrhu6T4"
    },
    {
      "Restaurant Name": "The Indian Dinner Box",
      "Cuisine Type": "Indian",
      Phone: "+44 20 7387 9292",
      City: "London",
      latitude: "51.4893323",
      longitude: "-0.0881552",
      place_id: "ChIJDQ9xSacEdkgRIXfW2iPUYkQ"
    }
  ];

  const [yummyDosa, dinnerBox] = analyzeDirectoryRows(rows, "test.csv", "normal import").listings;

  assert.equal(yummyDosa.name, "Yummy Dosa");
  assert.equal(yummyDosa.address, "68 Cranbrook Rd");
  assert.equal(yummyDosa.postcode, "IG1 4NH");
  assert.equal(yummyDosa.area, "Redbridge");
  assert.equal(yummyDosa.neighborhood, "Ilford");
  assert.equal(yummyDosa.borough, "Redbridge");
  assert.equal(yummyDosa.fullAddress, "68 Cranbrook Rd, Ilford, IG1 4NH, London");
  assert.equal(yummyDosa.location?.latitude, 51.5606646);
  assert.equal(yummyDosa.location?.longitude, 0.0697829);
  assert.equal(yummyDosa.contact?.phone, "+44 20 8637 3026");
  assert.equal(yummyDosa.contact?.phoneAlt, "+44 7776 675146");

  assert.equal(dinnerBox.address, "6 Trinity Street");
  assert.equal(dinnerBox.postcode, "SE1 1DB");
  assert.equal(dinnerBox.area, "Southwark");
  assert.equal(dinnerBox.neighborhood, "The Borough");
  assert.equal(dinnerBox.borough, "Southwark");
  assert.equal(dinnerBox.fullAddress, "6 Trinity Street, The Borough, SE1 1DB, London");
  assert.equal(dinnerBox.location?.latitude, 51.4996898);
  assert.equal(dinnerBox.location?.longitude, -0.0951699);
  assert.equal(dinnerBox.contact?.phone, "+44 20 7387 9292");
}

function duplicateSourceRowsMergeUsefulFieldsInsteadOfSkipping() {
  const rows: Row[] = [
    {
      "Restaurant Name": "Monty's Nepalese Cuisine",
      "Cuisine Type": "Indian, Nepalese",
      "Restaurant Type": "",
      Website: "http://www.kathmandunepalesecuisine.co.uk/",
      Phone: "+44 20 8840 1634",
      City: "London",
      Borough: "Ealing",
      Neighborhood: "West Ealing",
      Area: "Northfield Avenue",
      Postcode: "W13 9RR",
      "Street Address": "86 Northfield Ave",
      latitude: "51.5034531",
      longitude: "-0.3176297",
      "Google Rating": "5",
      "Google Reviews": "255",
      "Reserve a Table": "",
      "Book Appointment": "",
      place_id: "old-place-id"
    },
    {
      "Restaurant Name": "MONTYS NEPALESE CUISINE",
      "Restaurant Type": "Casual Dining",
      Website: "https://montysnepalesecuisine.com/",
      Phone: "+44 20 8840 1634",
      City: "London",
      Borough: "Ealing",
      Neighborhood: "Northfields",
      Area: "Northfield Avenue",
      Postcode: "W13 9RR",
      "Street Address": "86 Northfield Ave",
      latitude: "51.5034162",
      longitude: "-0.3177137",
      "Reserve a Table": "https://www.google.com/maps/reserve/v/dine/c/riKu7jbTA8g",
      "Book Appointment": "https://www.google.com/maps/reserve/v/dine/c/riKu7jbTA8g",
      place_id: "new-place-id"
    }
  ];

  const result = analyzeDirectoryRows(rows, "test.csv", "normal import");
  const listing = result.listings[0];

  assert.equal(result.listings.length, 1);
  assert.equal(result.reportData.summary.skippedRows, 0);
  assert.equal(result.reportData.duplicateCount, 1);
  assert.match(result.report, /Duplicate rows merged: 1/);
  assert.doesNotMatch(result.report, /Duplicate rows skipped/);
  assert.equal(listing.name, "Monty's Nepalese Cuisine");
  assert.equal(listing.contact?.website, "https://montysnepalesecuisine.com/");
  assert.equal(listing.contact?.reserveUrl, "https://www.google.com/maps/reserve/v/dine/c/riKu7jbTA8g");
  assert.equal(listing.contact?.appointmentUrl, "https://www.google.com/maps/reserve/v/dine/c/riKu7jbTA8g");
  assert.deepEqual(listing.categories, ["Indian", "Nepalese"]);
  assert.deepEqual(listing.listingTypes, ["Casual Dining"]);
  assert.equal(listing.neighborhood, "Northfield Avenue");
  assert.equal(listing.rating, 5);
  assert.equal(listing.reviewCount, 255);
}

repeatedHeaderRowsAreSkipped();
restaurantFeatureColumnsMapToDetails();
actionLinksAreCleanedForSafeDisplay();
csvBuffersParseQuotedCommasAndEscapedQuotes();
nonCsvBuffersAreRejected();
ignoredColumnsAreReported();
sampledReportsUseSampledCounts();
serviceFilterExcludesAdvancedOnlyValues();
importGeneratesCompactNormalizedFilterCounts();
listingDescriptionsUseDataRichCopy();
listingDescriptionVariantsAreStableAndVaried();
listingMetaDescriptionsAvoidBrokenTruncation();
listingDescriptionsAvoidAwkwardSeoCopy();
duplicateListingSlugsPreferLocalAreaBeforeNumbers();
missingCategoriesUseConservativeInferenceAndReview();
sourceDataOverridesCorrectKnownLocalBusinessErrors();
duplicateSourceRowsMergeUsefulFieldsInsteadOfSkipping();

console.log("import-directory behavior tests passed");
