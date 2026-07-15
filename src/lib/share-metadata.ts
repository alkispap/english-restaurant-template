import type { Listing } from "@/data/listings";
import { siteConfig } from "@/config/site";
import { canonicalPageUrl } from "@/lib/canonical-page-url";
import type { Metadata } from "next";

export type ListingShareMetadata = {
  title: string;
  description: string;
  url: string;
  images: string[];
};

export function listingShareMetadata(listing: Listing): ListingShareMetadata {
  const title = listing.metaTitle || listing.name;
  const description =
    listing.metaDescription ||
    listing.description ||
    `${listing.name} ${listing.categories.slice(0, 2).join(", ")} listing.`;
  const url = canonicalPageUrl(siteConfig.url, `/${siteConfig.listingBasePath}/${listing.slug}`);
  const images = listing.images[0] ? [listing.images[0]] : [siteConfig.heroImage];

  return {
    title,
    description,
    url,
    images
  };
}

export function pageShareMetadata({
  title,
  description,
  path,
  image = siteConfig.heroImage,
  imageAlt = siteConfig.heroImageAlt
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      title,
      description,
      type: "website",
      siteName: siteConfig.name,
      url: path,
      images: [{ url: image, alt: imageAlt }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
    }
  };
}
