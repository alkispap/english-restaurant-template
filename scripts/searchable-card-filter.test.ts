import assert from "node:assert/strict";
import { filterDirectoryCards, type SearchableDirectoryCard } from "../src/lib/searchable-card-filter";

const cards: SearchableDirectoryCard[] = [
  {
    label: "Harrow",
    slug: "harrow",
    href: "/areas/harrow",
    count: 181,
    description: "Compare restaurants in Harrow."
  },
  {
    label: "Redbridge",
    slug: "redbridge",
    href: "/areas/redbridge",
    count: 165,
    description: "Compare restaurants in Redbridge."
  },
  {
    label: "Brent",
    slug: "brent",
    href: "/areas/brent",
    count: 149,
    description: "Compare restaurants in Brent."
  }
];

function filtersByTextAsTheUserTypes() {
  assert.deepEqual(
    filterDirectoryCards(cards, { query: "har" }).map((card) => card.slug),
    ["harrow"]
  );
}

function filtersByFirstLetter() {
  assert.deepEqual(
    filterDirectoryCards(cards, { letter: "b" }).map((card) => card.slug),
    ["brent"]
  );
}

function combinesTextAndLetterFilters() {
  assert.deepEqual(
    filterDirectoryCards(cards, { query: "restaurants", letter: "r" }).map((card) => card.slug),
    ["redbridge"]
  );
}

function returnsNoMatchesWhenNothingFits() {
  assert.deepEqual(filterDirectoryCards(cards, { query: "wembley", letter: "h" }), []);
}

filtersByTextAsTheUserTypes();
filtersByFirstLetter();
combinesTextAndLetterFilters();
returnsNoMatchesWhenNothingFits();

console.log("searchable card filter tests passed");
