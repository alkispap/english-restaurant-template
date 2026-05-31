import type { TrustPage as TrustPageContent } from "@/lib/trust-pages";

type TrustPageProps = {
  page: TrustPageContent;
};

export function TrustPage({ page }: TrustPageProps) {
  return (
    <main className="bg-surface">
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">Directory information</p>
          <h1 className="text-3xl font-bold text-ink sm:text-4xl">{page.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted">{page.description}</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-4xl gap-5 px-4 py-10 sm:px-6 lg:px-8">
        {page.sections.map((section) => (
          <article key={section.heading} className="rounded-md border border-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-bold text-ink">{section.heading}</h2>
            <p className="mt-3 leading-7 text-muted">{section.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
