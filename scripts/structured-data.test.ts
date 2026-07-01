import assert from "node:assert/strict";
import { localBusinessJsonLd, organizationJsonLd, websiteJsonLd } from "../src/lib/structured-data";
import type { Listing } from "../src/data/listings";
import { getSiteUrl } from "../src/lib/site-url";

function baseListing(hours: string): Listing {
  return {
    name: "Sample Restaurant",
    slug: "sample-restaurant",
    images: [],
    categories: ["Indian"],
    listingTypes: [],
    dietaryOptions: [],
    tags: [],
    details: {
      workingHours: [
        { day: "Monday", hours },
        { day: "Tuesday", hours: "Closed" }
      ]
    }
  };
}

function openingHoursSupportCompactImportedRanges() {
  const schema = localBusinessJsonLd(baseListing("4-10pm"));
  const specs = schema.openingHoursSpecification as Array<Record<string, string>>;

  assert.deepEqual(specs, [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Monday",
      opens: "16:00",
      closes: "22:00"
    }
  ]);
}

function openingHoursSupportExplicitAmPmRanges() {
  const schema = localBusinessJsonLd(baseListing("9am-11pm"));
  const specs = schema.openingHoursSpecification as Array<Record<string, string>>;

  assert.equal(specs[0].opens, "09:00");
  assert.equal(specs[0].closes, "23:00");
}

function localBusinessUrlUsesDirectoryPage() {
  const listing = {
    ...baseListing("9am-11pm"),
    contact: {
      website: "https://restaurant.example.com/"
    }
  };
  const schema = localBusinessJsonLd(listing);

  assert.equal(schema.url, `${getSiteUrl()}/restaurants/sample-restaurant`);
  assert.deepEqual(schema.sameAs, ["https://restaurant.example.com/"]);
}

function restaurantSchemaUsesRestaurantTypeAndCuisineSignals() {
  const schema = localBusinessJsonLd({
    ...baseListing("9am-11pm"),
    categories: ["Indian", "Punjabi"],
    location: {
      googleMapsUrl: "https://maps.google.com/?cid=123"
    },
    contact: {
      menuUrl: "https://restaurant.example.com/menu",
      reserveUrl: "https://restaurant.example.com/book"
    }
  });

  assert.equal(schema["@type"], "Restaurant");
  assert.deepEqual(schema.servesCuisine, ["Indian", "Punjabi"]);
  assert.equal(schema.menu, "https://restaurant.example.com/menu");
  assert.equal(schema.acceptsReservations, "https://restaurant.example.com/book");
  assert.equal(schema.hasMap, "https://maps.google.com/?cid=123");
}

function restaurantSchemaBuildsMapUrlFromLocationWhenMissingExplicitMapUrl() {
  const schema = localBusinessJsonLd({
    ...baseListing("9am-11pm"),
    name: "Sample Spice",
    address: "10 High Street",
    fullAddress: "10 High Street, Ilford, IG1 1AA, London",
    postcode: "IG1 1AA",
    city: "London",
    location: {
      latitude: 51.558,
      longitude: 0.074
    }
  });

  assert.equal(schema.hasMap, "https://www.google.com/maps/search/?api=1&query=Sample%20Spice%2010%20High%20Street%2C%20Ilford%2C%20IG1%201AA%2C%20London");
}

function siteSchemaDescribesTheDirectory() {
  const organization = organizationJsonLd();
  const website = websiteJsonLd();

  assert.equal(organization["@type"], "Organization");
  assert.equal(organization.name, "Indian Restaurants London");
  assert.equal(organization.url, getSiteUrl());
  assert.equal(typeof organization.description, "string");
  assert.ok(organization.description.includes("Indian restaurants in London"));
  assert.equal(website["@type"], "WebSite");
  assert.equal(website.name, "Indian Restaurants London");
  assert.equal(website.url, getSiteUrl());
  assert.equal(typeof website.description, "string");
  assert.ok(website.description.includes("imported local business data"));
  assert.deepEqual(website.publisher, {
    "@type": "Organization",
    name: "Indian Restaurants London",
    url: getSiteUrl()
  });
}

openingHoursSupportCompactImportedRanges();
openingHoursSupportExplicitAmPmRanges();
localBusinessUrlUsesDirectoryPage();
restaurantSchemaUsesRestaurantTypeAndCuisineSignals();
restaurantSchemaBuildsMapUrlFromLocationWhenMissingExplicitMapUrl();
siteSchemaDescribesTheDirectory();

console.log("structured-data behavior tests passed");
