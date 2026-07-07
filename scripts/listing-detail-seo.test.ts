import assert from "node:assert/strict";
import {
  buildListingDetailMetaDescription,
  buildListingDetailPageSummary,
  buildListingDetailSeoTitle
} from "../src/lib/listing-detail-seo";

const curryClub = {
  name: "The Curry Club London",
  area: "Redbridge",
  neighborhood: "Ilford",
  categories: ["Indian", "Punjabi"],
  rating: 5,
  reviewCount: 254,
  fullAddress: "41 High St, Ilford, IG6 2AD, London",
  contact: { menuUrl: "https://thecurryclub.uk/our-menu/#menu" },
  details: {
    workingHours: [{ day: "Monday", hours: "4-10pm" }],
    serviceOptions: ["Delivery", "Takeaway", "Dine-in"]
  }
};

const mtr = {
  name: "MTR",
  area: "Harrow",
  neighborhood: "Rayners Lane",
  categories: ["South Indian"],
  rating: 5,
  reviewCount: 1346,
  fullAddress: "3 Village Way E, London, HA2 7LX",
  contact: {},
  details: {
    workingHours: [{ day: "Tuesday", hours: "11:30am-3pm" }],
    serviceOptions: ["Takeaway", "Dine-in"]
  }
};

const gujjuDhaba = {
  name: "Gujju Dhaba Express (Kingsbury)",
  area: "Brent",
  neighborhood: "Kingsbury",
  categories: ["Indian"],
  rating: 4,
  reviewCount: 648,
  fullAddress: "6 Honeypot Ln, Kingsbury, NW9 9QD, London",
  contact: {},
  details: {
    workingHours: [{ day: "Monday", hours: "11am-10pm" }],
    serviceOptions: ["Delivery", "Takeaway", "Dine-in"]
  }
};

assert.equal(
  buildListingDetailSeoTitle(curryClub),
  "The Curry Club London in Redbridge, London - Reviews & Details"
);
assert.equal(buildListingDetailSeoTitle(mtr), "MTR in Harrow, London - Reviews & Details");

const description = buildListingDetailMetaDescription(curryClub);
assert.equal(
  description,
  "The Curry Club London in Ilford, Redbridge is an Indian restaurant rated 5.0 from 254 reviews. Check menu, address, hours, delivery, takeaway, and nearby restaurants."
);
assert.ok(description.length <= 170, "description should fit a search snippet");

assert.equal(
  buildListingDetailMetaDescription(mtr),
  "MTR in Rayners Lane, Harrow is a South Indian restaurant rated 5.0 from 1,346 reviews. Check address, hours, takeaway, and nearby restaurants."
);
assert.ok(!buildListingDetailMetaDescription(mtr).includes("menu"), "menu should appear only when a menu URL exists");

const summary = buildListingDetailPageSummary(gujjuDhaba);
assert.equal(
  summary,
  "Use this profile to check Gujju Dhaba Express (Kingsbury)'s Kingsbury location, Indian category, 4.0 rating from 648 reviews, opening details, delivery, takeaway, and similar restaurants nearby."
);

console.log("listing detail SEO tests passed");
