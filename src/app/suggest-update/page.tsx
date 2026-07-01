import { TrustPage } from "@/components/TrustPage";
import { getTrustPage, getTrustPageMetadata } from "@/lib/trust-pages";

const page = getTrustPage("suggest-update");

export const metadata = getTrustPageMetadata(page);

export default function SuggestUpdatePage() {
  return <TrustPage page={page} />;
}
