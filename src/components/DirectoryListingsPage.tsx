import { DirectoryListingsQueryEnhancer } from "@/components/DirectoryListingsQueryEnhancer";
import { DirectoryListingsView } from "@/components/DirectoryListingsView";
import { directoryConfig } from "@/config/directory";
import { siteConfig } from "@/config/site";
import { buildDirectoryListingsModel } from "@/lib/directory-listings-model";
import type { DirectoryListingsSearchParams } from "@/lib/directory-listings-search-params";

type DirectoryListingsPageProps = {
  searchParams?: DirectoryListingsSearchParams;
  basePath?: string;
  title?: string;
  description?: string;
  headingContext?: string;
};

export function DirectoryListingsPage({
  searchParams,
  basePath,
  title = `Find ${directoryConfig.listingPluralLabel.toLowerCase()} in ${siteConfig.cityOrRegion}`,
  description = `Search the imported directory dataset and refine by area, ${directoryConfig.categoryLabel.toLowerCase()}, ${directoryConfig.filterLabels.type.toLowerCase()}, features, price, and rating.`,
  headingContext
}: DirectoryListingsPageProps) {
  const model = buildDirectoryListingsModel({ searchParams, basePath, title, description, headingContext });

  return (
    <>
      <DirectoryListingsView model={model} viewId="directory-listings-server-main" />
      {model.searchQuery ? <DirectoryListingsQueryEnhancer initialModel={model} /> : null}
    </>
  );
}
