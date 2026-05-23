import { Star } from "lucide-react";

type RatingPillProps = {
  rating: number;
  reviewCount?: number;
  href?: string;
};

export function RatingPill({ rating, reviewCount, href }: RatingPillProps) {
  const content = (
    <>
      <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
      {rating.toFixed(1)}
      {reviewCount ? <span className="font-medium opacity-85">({reviewCount.toLocaleString()})</span> : null}
    </>
  );

  const className = "inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-sm font-semibold text-white transition-colors hover:bg-secondary/90";

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return <span className={className}>{content}</span>;
}

