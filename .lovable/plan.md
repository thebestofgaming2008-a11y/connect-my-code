

# Pro-Level Review System Upgrade

## What We're Building
Amazon/Shopify-style review system with:
1. **Rating histogram** — Visual bar chart showing star distribution (5-star: 70%, 4-star: 20%, etc.)
2. **Average rating summary** — Large number with total review count
3. **Sort options** — Newest, Highest Rated, Lowest Rated, Most Helpful
4. **Helpful voting** — "Was this helpful?" Yes/No buttons on each review

## Database Support
Good news: The `reviews` table already has `helpful_count` and `not_helpful_count` columns — we just need to use them.

---

## Implementation

### 1. Update `src/hooks/useReviews.ts`
- Update `Review` interface to include `helpful_count`, `not_helpful_count`
- Add `useReviewStats(productId)` hook that computes:
  - Average rating
  - Total count
  - Star distribution array `[{stars: 5, count: 12, percent: 40}, ...]`
- Add `useVoteReview()` mutation to increment helpful/not_helpful counts

### 2. Create `src/components/reviews/ReviewSummary.tsx`
New component showing:
- Large average rating (e.g., "4.5 out of 5")
- Total reviews count
- Horizontal bar histogram for each star (5→1)
- Each bar shows percentage with count

### 3. Create `src/components/reviews/ReviewCard.tsx`
Extracted review card with:
- Star rating, author, date, verified badge
- Title and content
- "Was this helpful?" section with thumbs up/down buttons
- Shows helpful count if > 0

### 4. Create `src/components/reviews/ReviewSort.tsx`
Simple dropdown/select for sorting:
- Newest (default)
- Highest Rated
- Lowest Rated  
- Most Helpful

### 5. Update `src/pages/ProductDetail.tsx`
- Import new components
- Replace inline review rendering with `ReviewSummary` + sorted `ReviewCard` list
- Add sort state and logic
- Update both mobile and desktop review sections

---

## Files to Create/Edit

| File | Action |
|------|--------|
| `src/hooks/useReviews.ts` | Add stats hook, vote mutation, update interface |
| `src/components/reviews/ReviewSummary.tsx` | Create — histogram + average |
| `src/components/reviews/ReviewCard.tsx` | Create — review with voting |
| `src/components/reviews/ReviewSort.tsx` | Create — sort dropdown |
| `src/pages/ProductDetail.tsx` | Update both mobile + desktop review sections |

---

## UI Preview

```text
┌─────────────────────────────────────┐
│  ★ 4.5 out of 5                     │
│  Based on 24 reviews                │
│                                     │
│  5 ★ ████████████████░░░  70% (17)  │
│  4 ★ ████████░░░░░░░░░░░  20%  (5)  │
│  3 ★ ██░░░░░░░░░░░░░░░░░   4%  (1)  │
│  2 ★ ░░░░░░░░░░░░░░░░░░░   0%  (0)  │
│  1 ★ ██░░░░░░░░░░░░░░░░░   4%  (1)  │
└─────────────────────────────────────┘

Sort by: [Newest ▼]

┌─────────────────────────────────────┐
│ Ahmed K.  ★★★★★  Verified Purchase  │
│ "Excellent quality!"                │
│ Great book, authentic content...    │
│                                     │
│ Was this helpful?  👍 12  👎 1      │
└─────────────────────────────────────┘
```

