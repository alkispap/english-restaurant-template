import { TrustPage } from "@/components/TrustPage";
import { getTrustPage, getTrustPageMetadata } from "@/lib/trust-pages";

const page = getTrustPage("about");

export const metadata = getTrustPageMetadata(page);

export default function AboutPage() {
  return <TrustPage page={page} />;
}
