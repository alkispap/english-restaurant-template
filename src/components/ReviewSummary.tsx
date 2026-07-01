import type { ReviewDistribution } from "@/data/listings";

type ReviewSummaryProps = {
  rating: number;
  reviewCount: number;
  distribution?: ReviewDistribution;
  heading?: string;
};

export function ReviewSummary({ rating, reviewCount, distribution, heading = "Reviews" }: ReviewSummaryProps) {
  if (!reviewCount) return null;

  const hasDistribution = Boolean(distribution);
  const total = distribution ? Object.values(distribution).reduce((a, b) => a + b, 0) : 0;

  const getLabel = (r: number) => {
    if (r >= 4.5) return "Excellent";
    if (r >= 4.0) return "Very Good";
    if (r >= 3.5) return "Good";
    if (r >= 3.0) return "Average";
    return "Poor";
  };

  const rows = [
    { label: "Excellent", stars: 5, count: distribution?.[5] ?? 0 },
    { label: "Good", stars: 4, count: distribution?.[4] ?? 0 },
    { label: "Average", stars: 3, count: distribution?.[3] ?? 0 },
    { label: "Poor", stars: 2, count: distribution?.[2] ?? 0 },
    { label: "Terrible", stars: 1, count: distribution?.[1] ?? 0 },
  ];

  return (
    <section className="mt-10 rounded-lg border border-line bg-white p-8">
      <h2 className="mb-8 text-2xl font-bold text-ink">{heading}</h2>
      <div className="grid gap-12 md:grid-cols-[200px_1fr]">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="text-7xl font-bold text-ink">{rating.toFixed(1)}</div>
          <div className="mt-3 text-xl font-bold text-ink">{getLabel(rating)}</div>
          <div className="mt-5 flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div 
                key={s} 
                className={`h-4 w-4 rounded-full ${s <= Math.round(rating) ? "bg-emerald-600" : "bg-slate-200"}`} 
              />
            ))}
            <span className="ml-1 text-sm font-bold text-muted">({reviewCount.toLocaleString()})</span>
          </div>
        </div>
        {hasDistribution && distribution ? (
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.stars} className="flex items-center gap-4">
                <div className="w-20 text-sm font-bold text-ink">{row.label}</div>
                <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="absolute inset-y-0 left-0 bg-emerald-600 transition-all duration-700 ease-out"
                    style={{ width: `${total ? (row.count / total) * 100 : 0}%` }}
                  />
                </div>
                <div className="w-12 text-right text-sm font-bold text-muted">{row.count}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-line bg-page p-5">
            <p className="text-sm font-semibold leading-6 text-muted">
              Rating and review count are imported from Google Business/Profile data where available. Star-by-star distribution is not currently stored for this listing.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
