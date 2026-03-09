import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ShoppingCart, Search, Loader2, SlidersHorizontal, Heart, Check, X, ChevronDown } from "lucide-react";
import { BOOK_SUBCATEGORY_IDS } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useCurrencyContext } from "@/contexts/CurrencyContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductImage from "@/components/ui/product-image";
import FilterSidebar from "@/components/shop/FilterSidebar";
import SortDropdown, { SortOption } from "@/components/shop/SortDropdown";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import SEO from "@/components/SEO";
import { useWishlistItems, useToggleWishlistItem } from "@/hooks/useWishlist";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

// Build category-aware SEO meta content
function getCategorySEO(category: string, search: string, categories: { name: string; slug: string }[]) {
  if (search) {
    return {
      title: `Search: "${search}" – Islamic Books & Essentials`,
      description: `Search results for "${search}" at Abu Hurayrah Essentials. Authentic Islamic books, clothing, and essentials.`,
      breadcrumbs: [
        { name: 'Home', url: '/' },
        { name: 'Shop', url: '/shop' },
        { name: `"${search}"`, url: `/shop?search=${encodeURIComponent(search)}` },
      ],
    };
  }
  if (category && category !== 'all') {
    const cat = categories.find(c => c.slug === category);
    const catName = cat?.name || category.charAt(0).toUpperCase() + category.slice(1);
    return {
      title: `${catName} – Islamic Books & Essentials`,
      description: `Shop authentic ${catName} at Abu Hurayrah Essentials. Carefully curated selection from verified publishers. Free shipping in India.`,
      breadcrumbs: [
        { name: 'Home', url: '/' },
        { name: 'Shop', url: '/shop' },
        { name: catName, url: `/shop?category=${category}` },
      ],
    };
  }
  return {
    title: 'Shop Islamic Books, Clothing & Essentials',
    description: 'Browse our full collection of authentic Islamic books, clothing, and essentials. Filter by category, price, and more. Free shipping in India.',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Shop', url: '/shop' },
    ],
  };
}

const Shop = () => {
  useDocumentTitle('Shop');
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || "all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [addedToCartId, setAddedToCartId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const urlCategory = searchParams.get('category');
    const urlSearch = searchParams.get('search');
    setSelectedCategory(urlCategory || 'all');
    setSearchQuery(urlSearch || '');
  }, [searchParams]);

  const { addToCart } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: wishlistItems = [] } = useWishlistItems();
  const toggleWishlist = useToggleWishlistItem();
  const wishlistIds = new Set(wishlistItems.map(w => w.product_id));
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: categories = [] } = useCategories(true);
  const { formatPrice, currency, exchangeRates, currencySymbol } = useCurrencyContext();

  const priceManuallySet = useRef(false);

  const maxPrice = useMemo(() => {
    if (products.length === 0) return 0;
    const rate = currency === 'USD' ? 1 : (exchangeRates[currency] || 1);
    const prices = products.map(p => currency === 'INR' ? (p.price_inr || p.price * (exchangeRates['INR'] || 90)) : p.price * rate);
    return Math.ceil(Math.max(...prices) / 10) * 10;
  }, [products, currency, exchangeRates]);

  useEffect(() => {
    if (maxPrice > 0 && !priceManuallySet.current) {
      setPriceRange([0, maxPrice]);
    }
  }, [maxPrice]);

  const productCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter(p => {
      const img = p.images?.[0] || p.cover_image_url || '';
      return img && img !== '/placeholder.svg' && !img.includes('placeholder');
    });

    if (selectedCategory !== "all") {
      const sel = selectedCategory.toLowerCase();
      if (sel === "books") {
        result = result.filter(p => (BOOK_SUBCATEGORY_IDS as readonly string[]).includes(p.category));
      } else {
        result = result.filter(p => p.category === selectedCategory);
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.author?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.publisher?.toLowerCase().includes(query) ||
        (p.tags as string[] | null)?.some(t => t.toLowerCase().includes(query))
      );
    }

    if (priceRange[1] > 0 && !(priceRange[0] === 0 && priceRange[1] >= maxPrice)) {
      result = result.filter(p => {
        const rate = currency === 'USD' ? 1 : (exchangeRates[currency] || 1);
        const price = currency === 'INR' ? (p.price_inr || p.price * (exchangeRates['INR'] || 90)) : p.price * rate;
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

    if (inStockOnly) {
      result = result.filter(p => (p.stock_quantity ?? 0) > 0);
    }

    if (onSaleOnly) {
      result = result.filter(p => p.sale_price || p.sale_price_inr);
    }

    if (minRating > 0) {
      result = result.filter(p => (p.rating || 0) >= minRating);
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
        break;
      case 'price-desc':
        result.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popular':
        result.sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortBy, priceRange, inStockOnly, onSaleOnly, minRating, currency, exchangeRates]);

  const handleAddToCart = (product: Product) => {
    if ((product.stock_quantity ?? 0) <= 0) return;
    addToCart({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      priceInr: product.price_inr || undefined,
      salePrice: product.sale_price || undefined,
      salePriceInr: product.sale_price_inr || undefined,
      category: product.category || '',
      images: product.images || [product.cover_image_url || ''],
      inStock: (product.stock_quantity ?? 0) > 0,
      rating: product.rating || 0,
      reviews: product.reviews_count || 0,
      badge: product.badge || undefined,
    });
    // Visual feedback on mobile
    setAddedToCartId(product.id);
    setTimeout(() => setAddedToCartId(null), 1200);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handlePriceRangeChange = (range: [number, number]) => {
    priceManuallySet.current = true;
    setPriceRange(range);
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    priceManuallySet.current = false;
    setPriceRange([0, maxPrice]);
    setInStockOnly(false);
    setOnSaleOnly(false);
    setMinRating(0);
  };

  // Mobile category pills data
  const mobileCategoryPills = useMemo(() => {
    const bookSubcatSet = new Set<string>(BOOK_SUBCATEGORY_IDS);
    const bookSubcats = categories.filter(c => bookSubcatSet.has(c.slug));
    const booksCount = bookSubcats.reduce((sum, c) => sum + (productCounts[c.slug] || 0), 0);
    return [
      { slug: 'all', name: 'All', count: productCounts['all'] || 0 },
      { slug: 'Books', name: 'Books', count: booksCount },
      ...bookSubcats.map(c => ({ slug: c.slug, name: c.name, count: productCounts[c.slug] || 0 })),
      { slug: 'clothing', name: 'Clothing', count: productCounts['clothing'] || 0 },
    ];
  }, [categories, productCounts]);

  // Compute sale percentage
  const getSalePercent = (product: Product) => {
    const original = currency === 'INR' ? (product.price_inr || product.price * (exchangeRates['INR'] || 90)) : product.price;
    const sale = currency === 'INR' ? (product.sale_price_inr || product.sale_price || 0) : (product.sale_price || 0);
    if (!sale || sale >= original) return 0;
    return Math.round(((original - sale) / original) * 100);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Mobile: compact header with sticky search + category pills */}
      {isMobile ? (
        <section className="sticky top-0 z-30 bg-background border-b border-border/50">
          {/* Search bar */}
          <div className="px-3 pt-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search books, authors..."
                className="pl-9 h-10 rounded-lg border-border/50 text-sm bg-secondary/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Category pills — horizontal scroll */}
          <div className="flex gap-1.5 px-3 pb-2.5 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            {mobileCategoryPills.map(cat => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat.slug
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground border border-border/40'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Filter/sort bar */}
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="text-xs text-muted-foreground">{filteredAndSortedProducts.length} products</span>
            <div className="flex items-center gap-2">
              <SortDropdown value={sortBy} onChange={setSortBy} />
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
                Filters
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-12 border-b border-border/50">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-philosopher">Our Collection</h1>
              <p className="text-muted-foreground">Discover our curated selection of authentic Islamic literature</p>
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-10 h-11 rounded-sm border-border/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Mobile filter bottom sheet */}
      {isMobile && showFilters && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowFilters(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[75vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border/50 sticky top-0 bg-background z-10">
              <h2 className="text-base font-semibold">Filters</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">
                  Clear all
                </Button>
                <button onClick={() => setShowFilters(false)} className="p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <FilterSidebar
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={(cat) => { setSelectedCategory(cat); }}
                priceRange={priceRange}
                maxPrice={maxPrice}
                onPriceRangeChange={handlePriceRangeChange}
                inStockOnly={inStockOnly}
                onInStockChange={setInStockOnly}
                onSaleOnly={onSaleOnly}
                onSaleChange={setOnSaleOnly}
                minRating={minRating}
                onRatingChange={setMinRating}
                onClearFilters={clearFilters}
                productCounts={productCounts}
                currencySymbol={currencySymbol}
              />
            </div>
            <div className="p-4 border-t border-border/50 sticky bottom-0 bg-background">
              <Button className="w-full" onClick={() => setShowFilters(false)}>
                Show {filteredAndSortedProducts.length} Results
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className={`flex-1 container px-4 ${isMobile ? 'py-3' : 'py-8 sm:py-12'}`}>
        <SEO
          title="Shop"
          description="Browse authentic Islamic books, clothing, and essentials. Filter by category, price, and more. International shipping available."
          url="/shop"
        />
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'} gap-8`}>
          {/* Desktop sidebar */}
          {!isMobile && (
            <aside className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <FilterSidebar
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                priceRange={priceRange}
                maxPrice={maxPrice}
                onPriceRangeChange={handlePriceRangeChange}
                inStockOnly={inStockOnly}
                onInStockChange={setInStockOnly}
                onSaleOnly={onSaleOnly}
                onSaleChange={setOnSaleOnly}
                minRating={minRating}
                onRatingChange={setMinRating}
                onClearFilters={clearFilters}
                productCounts={productCounts}
                currencySymbol={currencySymbol}
              />
            </aside>
          )}

          <div className={isMobile ? '' : 'lg:col-span-3'}>
            {/* Desktop toolbar */}
            {!isMobile && (
              <div className="flex items-center justify-between mb-6 gap-2">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowFilters(!showFilters)}>
                    <SlidersHorizontal className="h-4 w-4 mr-1" />
                    Filters
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    {filteredAndSortedProducts.length} products
                  </p>
                </div>
                <SortDropdown value={sortBy} onChange={setSortBy} />
              </div>
            )}

            {productsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className={`grid ${isMobile ? 'grid-cols-2 gap-2.5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'}`}>
                {filteredAndSortedProducts.map((product) => {
                  const priceInfo = formatPrice(product.price, product.price_inr, product.sale_price, product.sale_price_inr);
                  const isOutOfStock = (product.stock_quantity ?? 0) <= 0;
                  const salePercent = getSalePercent(product);
                  const justAdded = addedToCartId === product.id;

                  if (isMobile) {
                    // Mobile: compact 2-col card optimized for thumb reach & scanning
                    return (
                      <div key={product.id} className="group relative">
                        <Link to={`/product/${product.id}`}>
                          <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted border border-border/40">
                            <ProductImage
                              src={product.images?.[0] || '/placeholder.svg'}
                              alt={product.name}
                              className="w-full h-full object-cover group-active:scale-[0.97] transition-transform duration-200"
                            />
                            {/* Badges — top left */}
                            <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                              {product.badge && (
                                <span className="bg-accent text-accent-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  {product.badge}
                                </span>
                              )}
                              {salePercent > 0 && (
                                <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  -{salePercent}%
                                </span>
                              )}
                              {isOutOfStock && (
                                <span className="bg-muted-foreground text-background text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  Sold Out
                                </span>
                              )}
                            </div>
                            {/* Wishlist — top right */}
                            {user && (
                              <button
                                className="absolute top-1.5 right-1.5 z-10 h-7 w-7 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist.mutate({ productId: product.id }); }}
                              >
                                <Heart className={`h-3.5 w-3.5 ${wishlistIds.has(product.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
                              </button>
                            )}
                          </div>
                        </Link>
                        {/* Info below image */}
                        <div className="mt-1.5 px-0.5">
                          <Link to={`/product/${product.id}`}>
                            <p className="text-[12px] font-medium line-clamp-2 leading-tight text-foreground min-h-[2rem]">
                              {product.name}
                            </p>
                          </Link>
                          {product.author && (
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{product.author}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-sm font-bold text-primary">{priceInfo.displayPrice}</span>
                            {priceInfo.originalPrice && (
                              <span className="text-[10px] line-through text-muted-foreground">{priceInfo.originalPrice}</span>
                            )}
                          </div>
                          {/* Quick add button */}
                          <button
                            disabled={isOutOfStock}
                            onClick={() => handleAddToCart(product)}
                            className={`w-full mt-1.5 h-8 rounded-md text-[11px] font-medium flex items-center justify-center gap-1 transition-all duration-200 ${
                              justAdded
                                ? 'bg-green-600 text-white'
                                : isOutOfStock
                                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                  : 'bg-primary text-primary-foreground active:scale-[0.97]'
                            }`}
                          >
                            {justAdded ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                Added!
                              </>
                            ) : isOutOfStock ? (
                              'Sold Out'
                            ) : (
                              <>
                                <ShoppingCart className="h-3.5 w-3.5" />
                                Add to Cart
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Desktop card (unchanged)
                  return (
                    <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-shadow border-border hover:border-primary/30">
                      <Link to={`/product/${product.id}`}>
                        <div className="relative aspect-square overflow-hidden bg-muted">
                          <ProductImage
                            src={product.images?.[0] || '/placeholder.svg'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {product.badge && <Badge className="absolute top-3 left-3">{product.badge}</Badge>}
                          {isOutOfStock && <Badge className="absolute top-3 left-3 mt-8" variant="destructive">Out of Stock</Badge>}
                          {user && (
                            <button
                              className="absolute top-3 right-3 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist.mutate({ productId: product.id }); }}
                            >
                              <Heart className={`h-4 w-4 ${wishlistIds.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                            </button>
                          )}
                        </div>
                      </Link>
                      <CardContent className="p-4 space-y-3">
                        <Link to={`/product/${product.id}`}>
                          <h3 className="font-semibold hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
                        </Link>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-primary">{priceInfo.displayPrice}</span>
                            {priceInfo.originalPrice && <span className="text-sm line-through text-muted-foreground">{priceInfo.originalPrice}</span>}
                          </div>
                        </div>
                        <Button className="w-full" disabled={isOutOfStock} onClick={() => handleAddToCart(product)}>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {!isOutOfStock ? "Add to Cart" : "Out of Stock"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {!productsLoading && filteredAndSortedProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">No products found matching your filters.</p>
                <Button variant="link" onClick={clearFilters}>Clear filters</Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Shop;
