import assert from "node:assert/strict";
import React from "react";
import type { ReactElement, ReactNode } from "react";
import RestaurantsPage from "../src/app/restaurants/page";
import { DirectoryListingsPage } from "../src/components/DirectoryListingsPage";
import { buildDirectoryListingsModel } from "../src/lib/directory-listings-model";
import { directorySearchPath } from "../src/lib/routes";

type DirectoryListingsPageProps = Parameters<typeof DirectoryListingsPage>[0];

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function findDirectoryListingsPageProps(node: ReactNode): DirectoryListingsPageProps | null {
  if (!node || typeof node !== "object") return null;

  const element = node as ReactElement<{ children?: ReactNode }>;
  if (element.type === DirectoryListingsPage) return element.props as DirectoryListingsPageProps;

  const children = element.props?.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findDirectoryListingsPageProps(child);
      if (found) return found;
    }
    return null;
  }

  return findDirectoryListingsPageProps(children);
}

function restaurantsIndexUsesKeywordFocusedVisibleCopy() {
  const props = findDirectoryListingsPageProps(RestaurantsPage());
  assert.ok(props, "/restaurants should render DirectoryListingsPage");

  const model = buildDirectoryListingsModel(props);

  assert.equal(props.basePath, directorySearchPath());
  assert.equal(model.title, "Find Indian Restaurants in London");
  assert.equal(
    model.description,
    "Search Indian restaurants in London by area, cuisine, rating, service options, dietary needs, transport links, and dining style."
  );
  assert.equal(model.headingContext, "Indian Restaurants in London");
}

function restaurantsIndexUsesKeywordFocusedSidebarHeadings() {
  const props = findDirectoryListingsPageProps(RestaurantsPage());
  assert.ok(props, "/restaurants should render DirectoryListingsPage");

  const model = buildDirectoryListingsModel(props);
  const sidebarTitles = model.sidebarBlocks.map((block) => block.title);

  [
    "Popular Indian Restaurant Searches",
    "Recently Added Indian Restaurants",
    "Filter Indian Restaurants by Need",
    "Top London Areas for Indian Restaurants",
    "Indian Restaurant Cuisine Hubs"
  ].forEach((title) => {
    assert.ok(sidebarTitles.includes(title), `/restaurants sidebar should include "${title}"`);
  });
}

restaurantsIndexUsesKeywordFocusedVisibleCopy();
restaurantsIndexUsesKeywordFocusedSidebarHeadings();

console.log("restaurants index SEO tests passed");
