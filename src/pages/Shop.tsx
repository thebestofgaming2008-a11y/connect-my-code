import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ShoppingCart, Star, Search, Loader2, SlidersHorizontal, Heart } from "lucide-react";
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

  // Sync URL params → local state when navigating to /shop?search=... or /shop?category=...
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

  // Sync price range to maxPrice when products load (unless user manually adjusted)
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
    // Exclude products with placeholder/missing images (likely DB test entries)
    let result = products.filter(p => {
      const img = p.images?.[0] || p.cover_image_url || '';
      return img && img !== '/placeholder.svg' && !img.includes('placeholder');
    });

    // Category filter — supports main categories (Books, Clothing, Essentials) and subcategories
    if (selectedCategory !== "all") {
      const sel = selectedCategory.toLowerCase();
      if (sel === "books") {
        result = result.filter(p => (BOOK_SUBCATEGORY_IDS as readonly string[]).includes(p.category));
      } else {
        result = result.filter(p => p.category === selectedCategory);
      }
    }

    // Search filter
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

    // Price range filter (skip if range not set yet or covers full range)
    if (priceRange[1] > 0 && !(priceRange[0] === 0 && priceRange[1] >= maxPrice)) {
      result = result.filter(p => {
        const rate = currency === 'USD' ? 1 : (exchangeRates[currency] || 1);
        const price = currency === 'INR' ? (p.price_inr || p.price * (exchangeRates['INR'] || 90)) : p.price * rate;
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

    // Stock filter
    if (inStockOnly) {
      result = result.filter(p => (p.stock_quantity ?? 0) > 0);
    }

    // Sale filter
    if (onSaleOnly) {
      result = result.filter(p => p.sale_price || p.sale_price_inr);
    }

    // Rating filter
    if (minRating > 0) {
      result = result.filter(p => (p.rating || 0) >= minRating);
    }

    // Sorting
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

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

      <main className="flex-1 container px-4 py-8 sm:py-12">
        <SEO
          title="Shop"
          description="Browse authentic Islamic books, clothing, and essentials. Filter by category, price, and more. Shipping across India."
          url="/shop"
        />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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

          <div className="lg:col-span-3">
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

            {productsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedProducts.map((product) => {
                  const priceInfo = formatPrice(product.price, product.price_inr, product.sale_price, product.sale_price_inr);
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
                          {(product.stock_quantity ?? 0) <= 0 && <Badge className="absolute top-3 left-3 mt-8" variant="destructive">Out of Stock</Badge>}
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
                        {(product.reviews_count || 0) > 0 && (
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating || 0) ? "fill-primary text-primary" : "fill-muted text-muted"}`} />
                            ))}
                            <span className="text-xs text-muted-foreground ml-1">({product.reviews_count})</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-primary">{priceInfo.displayPrice}</span>
                            {priceInfo.originalPrice && <span className="text-sm line-through text-muted-foreground">{priceInfo.originalPrice}</span>}
                          </div>
                        </div>
                        <Button className="w-full" disabled={(product.stock_quantity ?? 0) <= 0} onClick={() => handleAddToCart(product)}>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {(product.stock_quantity ?? 0) > 0 ? "Add to Cart" : "Out of Stock"}
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
