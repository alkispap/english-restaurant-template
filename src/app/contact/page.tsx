import { TrustPage } from "@/components/TrustPage";
import { getTrustPage, getTrustPageMetadata } from "@/lib/trust-pages";

const page = getTrustPage("contact");

export const metadata = getTrustPageMetadata(page);

export default function ContactPage() {
  return <TrustPage page={page} />;
}
