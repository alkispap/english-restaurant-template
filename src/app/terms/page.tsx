import { TrustPage } from "@/components/TrustPage";
import { getTrustPage, getTrustPageMetadata } from "@/lib/trust-pages";

const page = getTrustPage("terms");

export const metadata = getTrustPageMetadata(page);

export default function TermsPage() {
  return <TrustPage page={page} />;
}
