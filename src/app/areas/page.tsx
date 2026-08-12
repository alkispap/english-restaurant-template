import type { Metadata } from "next";
import { DirectoryIndexPage } from "@/components/DirectoryIndexPage";
import { directoryConfig } from "@/config/directory";
import { getAreaDirectoryCards } from "@/lib/area-guide";
import { areasIndexHeadings } from "@/lib/areas-index-headings";
import { pageShareMetadata } from "@/lib/share-metadata";

const metadataTitle = "Indian Restaurants in London by Area";
const metadataDescription =
  "Browse Indian restaurants in London by area, then narrow by cuisine, rating, price, service options, and opening status.";

export const metadata: Metadata = {
  title: metadataTitle,
  description: metadataDescription,
  alternates: {
    canonical: "/areas"
  },
  ...pageShareMetadata({ title: metadataTitle, description: metadataDescription, path: "/areas" })
};

export default function AreasPage() {
  const areas = getAreaDirectoryCards(100);

  return (
    <DirectoryIndexPage
      eyebrow="Area directory"
      heroTitle={areasIndexHeadings.heroTitle}
      heroDescription={`Start with a London area, then compare matching ${directoryConfig.listingPluralLabel.toLowerCase()} by rating, cuisine, price, service options, and opening details.`}
      directoryTitle={areasIndexHeadings.directoryTitle}
      popularSearchesTitle={areasIndexHeadings.popularSearchesTitle}
      items={areas}
      searchPlaceholder="Search areas"
      emptyMessage="No areas match this search."
      alphabetLabel="Filter areas by first letter"
    />
  );
}
