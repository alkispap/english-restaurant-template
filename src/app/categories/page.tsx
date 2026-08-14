import type { Metadata } from "next";
import { DirectoryIndexPage } from "@/components/DirectoryIndexPage";
import { directoryConfig } from "@/config/directory";
import { siteConfig } from "@/config/site";
import { getFeaturedCategoryCards } from "@/lib/directory";
import { categoriesIndexHeadings } from "@/lib/categories-index-headings";
import { pageShareMetadata } from "@/lib/share-metadata";
import { directoryRouteLink } from "@/lib/directory-route-links";

const metadataTitle = `${siteConfig.localNicheTitle} in ${siteConfig.cityOrRegion} by Cuisine`;
const metadataDescription = `Browse ${siteConfig.cuisineLabel} restaurant cuisines and styles in ${siteConfig.cityOrRegion}, then compare matching restaurants by area, rating, price, and service options.`;

export const metadata: Metadata = {
  title: metadataTitle,
  description: metadataDescription,
  alternates: {
    canonical: "/categories"
  },
  ...pageShareMetadata({ title: metadataTitle, description: metadataDescription, path: "/categories" })
};

export default function CategoriesPage() {
  const categories = getFeaturedCategoryCards(100).map((category) => ({
    ...category,
    href: directoryRouteLink("category", category.slug)
  }));

  return (
    <DirectoryIndexPage
      eyebrow={directoryConfig.categoryPluralLabel}
      heroTitle={categoriesIndexHeadings.heroTitle}
      heroDescription={`Choose a cuisine or restaurant style to see matching ${directoryConfig.listingPluralLabel.toLowerCase()}, then refine by area, rating, price, opening status, and practical service details.`}
      directoryTitle={categoriesIndexHeadings.directoryTitle}
      popularSearchesTitle={categoriesIndexHeadings.popularSearchesTitle}
      items={categories}
      searchPlaceholder="Search cuisines and styles"
      emptyMessage="No cuisines or styles match this search."
      alphabetLabel="Filter cuisines and styles by first letter"
    />
  );
}
