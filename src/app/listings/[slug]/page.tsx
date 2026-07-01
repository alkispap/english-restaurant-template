import { redirect } from "next/navigation";
import { listings } from "@/data/listings";
import { listingDetailPath } from "@/lib/routes";
import { shouldGenerateFullStaticParams } from "@/lib/static-build";

type LegacyListingPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  if (!shouldGenerateFullStaticParams()) return [];

  return listings.map((listing) => ({ slug: listing.slug }));
}

export default async function LegacyListingPageRedirect({ params }: LegacyListingPageProps) {
  const { slug } = await params;
  redirect(listingDetailPath(slug));
}
