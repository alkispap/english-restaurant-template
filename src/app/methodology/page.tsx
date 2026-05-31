import type { Metadata } from "next";
import { TrustPage } from "@/components/TrustPage";
import { getTrustPage } from "@/lib/trust-pages";

const page = getTrustPage("methodology");

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: { canonical: page.href }
};

export default function MethodologyPage() {
  return <TrustPage page={page} />;
}
