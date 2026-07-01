import { TrustPage } from "@/components/TrustPage";
import { getTrustPage, getTrustPageMetadata } from "@/lib/trust-pages";

const page = getTrustPage("methodology");

export const metadata = getTrustPageMetadata(page);

export default function MethodologyPage() {
  return <TrustPage page={page} />;
}
