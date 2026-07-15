import { redirect } from "next/navigation";
import { directorySearchPath, listingDetailPath } from "@/lib/routes";

const legacyListingRedirectPlaceholder = "__legacy-listing-redirect-placeholder";

type LegacyListingPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ slug: legacyListingRedirectPlaceholder }];
}

export default async function LegacyListingPageRedirect({ params }: LegacyListingPageProps) {
  const { slug } = await params;
  if (slug === legacyListingRedirectPlaceholder) redirect(directorySearchPath());

  redirect(listingDetailPath(slug));
}
