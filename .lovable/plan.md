

# Product Data Fixes & Review System Verification

## Review System Status
The review system is already fully integrated and looks correct:
- `ReviewSummary` renders rating histogram with star distribution bars
- `ReviewCard` has thumbs up/down voting with localStorage duplicate prevention
- `ReviewSort` provides Newest/Highest/Lowest/Most Helpful dropdown
- Both mobile (compact) and desktop views use all three components
- `useReviewStats` computes averages and distributions from review data
- No code changes needed for the review system

## Product Data Issues Found

### Commentary Attribution (3 books)
These list the original author but should clarify the commentator:
- `kitab-tawhid-uthaymeen-commentary`: Author says "Muhammad ibn Abdul Wahhab" — should note "Commentary by Shaykh Ibn Al-Uthaymeen"
- `kitab-tawhid-sadi-commentary`: Same issue — commentary by Imam As-Sa'di, missing publisher
- `three-fundamental-principles-uthaymeen`: Same — commentary by Ibn Al-Uthaymeen, missing publisher

### Missing Authors (~20 products)
- `masala-takfeer-urdu`, `tafsir-ahsan-kalam-urdu`, `tafsir-ahsanul-bayan-urdu`, `historical-marvels-quran`, `quran-english-translation`, `sublime-beauty-prophet`, `honorable-wives-prophet`, `important-lessons-muslim-women`, `supporting-rights-believing-women`, `great-women-of-islam`, `guidelines-raising-children`, `manhaj-salaf`, `journey-of-strangers`, `evils-of-music`, `they-are-enemy-beware`, `questions-jinn`, `beautiful-names-allah`, `concise-collection-creed-tawheed`, `dress-code-muslim-women`, `khawateen-ke-masail-urdu`, `rizq-lawful-earnings`, `20-pieces-advice-sister-marriage`, `womans-guide-raising-family`

### Missing Publishers (~15 products)
- `book-of-tawheed-fawzan`, `book-of-faith`, `guide-to-sound-creed`, `usool-sunnah-urdu` and many of the above

### Wrong Tags
- `stories-prophets-urdu`: tags include "arabic" but it's an Urdu book — should be "urdu stories"

### Empty Images
- `khadija-niqab`: `images: []` — needs a placeholder

## Plan

### 1. Fix `src/data/products.ts` — All product metadata
Single file edit with all fixes:
- Add `author` field to ~20 products with best-known attributions
- Add `publisher` field where missing (Darussalam for most)
- Fix commentary books: change author to "Commentary by X on [Original Author]'s work" format
- Fix `stories-prophets-urdu` tags: "arabic" → "urdu stories"  
- Add placeholder image for `khadija-niqab`

All changes are in one file: `src/data/products.ts`

