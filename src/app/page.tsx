import type { Metadata } from "next";
import { DirectoryListingsPage } from "@/components/DirectoryListingsPage";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: siteConfig.niche,
  description: siteConfig.description,
  alternates: {
    canonical: "/"
  }
};

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  return (
    <DirectoryListingsPage
      searchParams={await searchParams}
      basePath="/"
      title="Indian Restaurants in London"
      description="Compare Indian restaurants across London with ratings, review counts, areas, cuisine tags, service options, transport links, and dining details from the current directory."
    />
  );
}

