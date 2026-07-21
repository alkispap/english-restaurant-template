import { Suspense } from "react";
import { TrustPage } from "@/components/TrustPage";
import { SuggestUpdateForm } from "@/components/SuggestUpdateForm";
import { getTrustPage, getTrustPageMetadata } from "@/lib/trust-pages";

const page = getTrustPage("suggest-update");

export const metadata = getTrustPageMetadata(page);

export default function SuggestUpdatePage() {
  return (
    <>
      <TrustPage page={page} />
      <div className="mx-auto -mt-4 max-w-4xl px-4 pb-12 sm:px-6 lg:px-8">
        <Suspense fallback={<p className="rounded-md border border-line bg-white p-6 text-muted shadow-soft">Preparing the correction form…</p>}>
          <SuggestUpdateForm submissionEmail={process.env.CORRECTIONS_EMAIL?.trim()} />
        </Suspense>
      </div>
    </>
  );
}
