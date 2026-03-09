import { Star, ThumbsUp, ThumbsDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Review } from "@/hooks/useReviews";
import { useVoteReview } from "@/hooks/useReviews";

interface ReviewCardProps {
  review: Review;
  compact?: boolean;
}

const ReviewCard = ({ review, compact = false }: ReviewCardProps) => {
  const voteReview = useVoteReview();
  const hasVoted = typeof window !== 'undefined' && !!localStorage.getItem(`review-vote-${review.id}`);

  const authorName = review.user?.full_name || review.user?.email?.split('@')[0] || 'Anonymous';
  const dateStr = new Date(review.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  if (compact) {
    return (
      <div className="border-b border-border/30 pb-3 last:border-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold">{authorName}</span>
          <span className="text-[10px] text-muted-foreground">{dateStr}</span>
        </div>
        <div className="flex items-center gap-0.5 mb-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} />
          ))}
          {review.is_verified_purchase && (
            <Badge variant="secondary" className="text-[9px] ml-1 h-4">Verified</Badge>
          )}
        </div>
        {review.title && <p className="text-xs font-medium mb-0.5">{review.title}</p>}
        {review.content && <p className="text-xs text-muted-foreground leading-relaxed">{review.content}</p>}
        
        {/* Compact voting */}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] text-muted-foreground">Helpful?</span>
          <button
            onClick={() => !hasVoted && voteReview.mutate({ reviewId: review.id, helpful: true })}
            disabled={hasVoted || voteReview.isPending}
            className={`flex items-center gap-1 text-[10px] ${hasVoted ? 'text-muted-foreground/50' : 'text-muted-foreground hover:text-primary'} transition-colors`}
          >
            <ThumbsUp className="h-3 w-3" />
            {(review.helpful_count || 0) > 0 && review.helpful_count}
          </button>
          <button
            onClick={() => !hasVoted && voteReview.mutate({ reviewId: review.id, helpful: false })}
            disabled={hasVoted || voteReview.isPending}
            className={`flex items-center gap-1 text-[10px] ${hasVoted ? 'text-muted-foreground/50' : 'text-muted-foreground hover:text-muted-foreground/70'} transition-colors`}
          >
            <ThumbsDown className="h-3 w-3" />
            {(review.not_helpful_count || 0) > 0 && review.not_helpful_count}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{authorName}</span>
            {review.is_verified_purchase && (
              <Badge variant="secondary" className="text-xs">Verified Purchase</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} />
            ))}
            <span className="text-xs text-muted-foreground ml-2">{dateStr}</span>
          </div>
        </div>
      </div>
      {review.title && <h4 className="font-semibold text-sm mb-1.5">"{review.title}"</h4>}
      {review.content && <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>}

      {/* Helpful voting */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/30">
        <span className="text-xs text-muted-foreground">Was this helpful?</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => voteReview.mutate({ reviewId: review.id, helpful: true })}
          disabled={hasVoted || voteReview.isPending}
          className={`h-7 px-2 gap-1.5 text-xs ${hasVoted ? 'opacity-50' : ''}`}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          {(review.helpful_count || 0) > 0 ? review.helpful_count : 'Yes'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => voteReview.mutate({ reviewId: review.id, helpful: false })}
          disabled={hasVoted || voteReview.isPending}
          className={`h-7 px-2 gap-1.5 text-xs ${hasVoted ? 'opacity-50' : ''}`}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
          {(review.not_helpful_count || 0) > 0 ? review.not_helpful_count : 'No'}
        </Button>
      </div>
    </div>
  );
};

export default ReviewCard;
