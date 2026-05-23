import assert from "node:assert/strict";
import { localBusinessJsonLd } from "../src/lib/structured-data";
import type { Listing } from "../src/data/listings";

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

  assert.equal(schema.url, "http://localhost:3001/listings/sample-restaurant");
  assert.deepEqual(schema.sameAs, ["https://restaurant.example.com/"]);
}

openingHoursSupportCompactImportedRanges();
openingHoursSupportExplicitAmPmRanges();
localBusinessUrlUsesDirectoryPage();

console.log("structured-data behavior tests passed");
