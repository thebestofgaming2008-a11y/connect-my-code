import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReviewSortOption } from "@/hooks/useReviews";

interface ReviewSortProps {
  value: ReviewSortOption;
  onChange: (value: ReviewSortOption) => void;
  total: number;
}

const options: { value: ReviewSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest', label: 'Lowest Rated' },
  { value: 'helpful', label: 'Most Helpful' },
];

const ReviewSort = ({ value, onChange, total }: ReviewSortProps) => {
  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">
        {total} {total === 1 ? 'review' : 'reviews'}
      </span>
      <Select value={value} onValueChange={(v) => onChange(v as ReviewSortOption)}>
        <SelectTrigger className="w-[160px] h-9 text-xs">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ReviewSort;
