import { SeoLandingPageContent } from "@/components/SeoLandingPageContent";
import { SeoLandingQueryEnhancer } from "@/components/SeoLandingQueryEnhancer";
import type { SeoPageModel } from "@/lib/seo-pages";

type SeoLandingPageProps = {
  page: SeoPageModel;
};

export function SeoLandingPage({ page }: SeoLandingPageProps) {
  return (
    <>
      <SeoLandingPageContent page={page} viewId="seo-landing-server-main" />
      <SeoLandingQueryEnhancer initialPage={page} />
    </>
  );
}
