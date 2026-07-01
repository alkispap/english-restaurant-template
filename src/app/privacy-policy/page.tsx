import { TrustPage } from "@/components/TrustPage";
import { getTrustPage, getTrustPageMetadata } from "@/lib/trust-pages";

const page = getTrustPage("privacy");

export const metadata = getTrustPageMetadata(page);

export default function PrivacyPolicyPage() {
  return <TrustPage page={page} />;
}
