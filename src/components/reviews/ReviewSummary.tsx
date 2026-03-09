import { Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { ReviewStats } from "@/hooks/useReviews";

interface ReviewSummaryProps {
  stats: ReviewStats;
  compact?: boolean;
}

const ReviewSummary = ({ stats, compact = false }: ReviewSummaryProps) => {
  if (stats.total === 0) return null;

  return (
    <div className={`flex ${compact ? 'flex-col gap-3' : 'flex-col sm:flex-row gap-6'} items-start`}>
      {/* Average Rating */}
      <div className={`${compact ? '' : 'sm:min-w-[140px]'} text-center`}>
        <div className="text-4xl font-bold text-foreground">{stats.average}</div>
        <div className="flex items-center justify-center gap-0.5 my-1.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.round(stats.average)
                  ? 'fill-primary text-primary'
                  : 'text-muted-foreground/30'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {stats.total} {stats.total === 1 ? 'review' : 'reviews'}
        </p>
      </div>

      {/* Distribution Histogram */}
      <div className="flex-1 w-full space-y-1.5">
        {stats.distribution.map(({ stars, count, percent }) => (
          <button
            key={stars}
            className="flex items-center gap-2 w-full group hover:opacity-80 transition-opacity"
          >
            <span className="text-xs font-medium w-8 text-right text-muted-foreground">
              {stars} ★
            </span>
            <Progress
              value={percent}
              className="h-2.5 flex-1 bg-muted"
            />
            <span className="text-xs text-muted-foreground w-12 text-left tabular-nums">
              {percent}% ({count})
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReviewSummary;
