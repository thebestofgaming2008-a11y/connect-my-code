

# Desktop & Tablet Layout Optimization — Using Only Real, Verified Data

## Fake/Unverified Data to Remove or Fix

| Current fake content | Location | Fix |
|---|---|---|
| "4.9/5" hardcoded rating | `Index.tsx` line 645 | Remove — no verified aggregate rating exists |
| "Based on X*50+ reviews" | `Index.tsx` line 648 | Change to real count: "Based on 65+ customer reviews" (65 real Instagram screenshots exist) |
| "Trusted by 500+ customers" | `Index.tsx` lines 210, 242 | Cannot verify — change to factual: "Authentic titles · Aqeedah to Seerah · Shipped worldwide" |
| "Loved by 500+ customers worldwide" | `Index.tsx` line 242 | Change to "Join our growing community of readers" |
| Product `rating` and `reviews_count` stars on desktop PDP | `ProductDetail.tsx` line 655 | Already guarded by `(product.reviews_count || 0) > 0` — safe, only shows if real reviews exist |
| Social proof "X customers reviewed" on PDP | `ProductDetail.tsx` line 799 | Already guarded — safe |

## Layout Changes (Desktop & Tablet)

### 1. Product Detail Page (`src/pages/ProductDetail.tsx`)

**a) Main image: `aspect-square` → `aspect-[3/4]`** (lines 615, 966)
- Books are portrait — square wastes 25% of visual space
- Apply to both main image and related products

**b) Make right column sticky** (line 649)
- Add `lg:sticky lg:top-24 lg:self-start` to product info column
- Keeps CTA visible as user scrolls through images/description

**c) Restructure info hierarchy** for conversion:
- Title → Author → Real reviews (if any) → Price → Stock/Scarcity → Quantity + CTA + Wishlist → Trust badges
- Currently description sits between price and CTA — move it below CTA into a collapsible/tab section

### 2. Shop Page (`src/pages/Shop.tsx`)

**a) Add desktop category pills** above the grid (between toolbar and products)
- Horizontal row of clickable category chips for 1-click filtering
- Mirrors what mobile already has; reduces friction

**b) Desktop cards already have author, scarcity, sale badge, "Added!" feedback** — these were added in the previous session. No changes needed to card content.

### 3. Homepage (`src/pages/Index.tsx`)

**a) Fix fake social proof text** (detailed above)

**b) Desktop hero: reduce padding** from `lg:py-28` to `lg:py-20` to push products above fold

**c) Featured product cards on desktop: add author name** below title (currently missing on desktop cards, only mobile has it via different card layout)

**d) Reviews section (desktop)**: Remove the fake "4.9/5" and inflated count. Show the real number of review screenshots (65+). Link to the /reviews page where real Instagram screenshots are displayed.

### 4. All Other Pages — Quick Wins

**a) Auth page (`Auth.tsx`)**: Add trust messaging below the sign-up form: "Your data is secure · We never share your information" — factual, not inflated.

**b) Contact page (`Contact.tsx`)**: Already well-structured. No changes.

**c) Shipping Policy (`ShippingPolicy.tsx`)**: Already clean. No changes.

**d) Cart page (`Cart.tsx`)**: Already has "no email" notice from previous session. No layout changes needed.

**e) Wishlist (`Wishlist.tsx`)**: Add "Continue Shopping" CTA when wishlist has items (conversion nudge). Currently only shows it when empty.

**f) Account page (`Account.tsx`)**: No changes — already clean and functional.

**g) Reviews page (`Reviews.tsx`)**: Add a "Shop Now" CTA at the bottom — after seeing real reviews, users should have a clear path to purchase.

---

## Files to Edit

| File | Changes |
|---|---|
| `src/pages/ProductDetail.tsx` | Main image aspect-[3/4], sticky right column, restructure info order, related products aspect-[3/4] |
| `src/pages/Shop.tsx` | Add desktop category pills above grid |
| `src/pages/Index.tsx` | Remove fake stats, fix social proof to real numbers, reduce hero padding, add author to desktop featured cards |
| `src/pages/Wishlist.tsx` | Add "Continue Shopping" CTA when items exist |
| `src/pages/Reviews.tsx` | Add "Shop Now" CTA at bottom |
| `src/pages/Auth.tsx` | Add trust line below sign-up form |

