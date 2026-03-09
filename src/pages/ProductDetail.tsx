import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, Star, ArrowLeft, Minus, Plus, Check, Heart, Loader2, MessageCircle, Share2, ChevronLeft, ChevronRight, Shield, Globe, Package, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProduct, useProducts, useVariantProducts } from "@/hooks/useProducts";
import { useCurrencyContext } from "@/contexts/CurrencyContext";
import { useCart } from "@/contexts/CartContext";
import { useIsInWishlist, useToggleWishlistItem } from "@/hooks/useWishlist";
import { useProductReviews, useCanReviewProduct, useCreateReview } from "@/hooks/useReviews";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductImage from "@/components/ui/product-image";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import SEO from "@/components/SEO";
import { useIsMobile } from "@/hooks/use-mobile";

const ProductDetail = () => {
  const { id } = useParams();
  const { data: product, isLoading, error } = useProduct(id || '');
  useDocumentTitle(product?.name);
  const { data: allProducts = [] } = useProducts();
  const { formatPrice, currency } = useCurrencyContext();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isInWishlist } = useIsInWishlist(id || '');
  const toggleWishlist = useToggleWishlistItem();
  const { data: reviews = [] } = useProductReviews(id || '');
  const { data: canReview } = useCanReviewProduct(id || '');
  const createReview = useCreateReview();
  const isMobile = useIsMobile();

  const { data: variantProducts = [] } = useVariantProducts(id || '', product?.tags || null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', content: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const imageScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedImage(0);
    setQuantity(1);
    setAddedToCart(false);
  }, [id]);

  // Sync mobile image scroll with selectedImage
  useEffect(() => {
    if (isMobile && imageScrollRef.current) {
      const el = imageScrollRef.current;
      const child = el.children[selectedImage] as HTMLElement;
      if (child) {
        el.scrollTo({ left: child.offsetLeft, behavior: 'smooth' });
      }
    }
  }, [selectedImage, isMobile]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container px-4 py-8">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-4">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="w-20 h-20 rounded-md" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product not found</h1>
            <Link to="/shop">
              <Button>Back to Shop</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const priceInfo = formatPrice(product.price, product.price_inr, product.sale_price, product.sale_price_inr);

  const handleAddToCart = () => {
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
    }, quantity);

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);

    toast({
      title: "Added to cart",
      description: `${quantity}x ${product.name} has been added to your cart.`,
    });
  };

  const relatedProducts = allProducts
    .filter((p) => {
      if (p.id === product.id) return false;
      const img = p.images?.[0] || p.cover_image_url || '';
      if (!img || img === '/placeholder.svg' || img.includes('placeholder')) return false;
      return p.category === product.category;
    })
    .slice(0, 4);

  const images = product.images && product.images.length > 0 ? product.images : (product.cover_image_url ? [product.cover_image_url] : ['/placeholder.svg']);
  const isInStock = (product.stock_quantity ?? 0) > 0;
  const savePercent = priceInfo.originalPrice
    ? Math.round(((priceInfo.numericOriginal! - priceInfo.numericPrice) / priceInfo.numericOriginal!) * 100)
    : 0;

  // Handle mobile image scroll end to detect current image
  const handleImageScroll = () => {
    if (!imageScrollRef.current) return;
    const el = imageScrollRef.current;
    const scrollPos = el.scrollLeft;
    const childWidth = el.children[0]?.clientWidth || 1;
    const idx = Math.round(scrollPos / childWidth);
    if (idx !== selectedImage && idx >= 0 && idx < images.length) {
      setSelectedImage(idx);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={product.name}
        description={product.description?.slice(0, 160) || `Buy ${product.name} at Abu Hurayrah Essentials`}
        image={images[0]}
        url={`/product/${product.id}`}
        type="product"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Shop', url: '/shop' },
          { name: product.category?.charAt(0).toUpperCase() + product.category?.slice(1) || 'Products', url: `/shop?category=${product.category}` },
          { name: product.name, url: `/product/${product.id}` },
        ]}
        product={{
          name: product.name,
          price: priceInfo.numericPrice,
          currency: currency,
          availability: isInStock ? 'InStock' : 'OutOfStock',
          image: images[0],
          description: product.description?.slice(0, 300),
          rating: product.rating || undefined,
          reviewCount: product.reviews_count || undefined,
          brand: product.publisher || 'Abu Hurayrah Essentials',
          sku: product.sku || product.id,
          isbn: product.isbn_13 || product.isbn || undefined,
          author: product.author || undefined,
          language: product.language || undefined,
          pages: product.pages || undefined,
        }}
      />
      <Header />

      {isMobile ? (
        /* ==================== MOBILE LAYOUT ==================== */
        <>
          <main className="flex-1 pb-24">
            {/* Back button overlay */}
            <div className="sticky top-0 z-20 px-3 py-2 bg-background/80 backdrop-blur-sm border-b border-border/30">
              <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </div>

            {/* Swipeable Image Gallery */}
            <div className="relative">
              <div
                ref={imageScrollRef}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                style={{ scrollbarWidth: 'none' }}
                onScroll={handleImageScroll}
              >
                {images.map((image, index) => (
                  <div key={index} className="flex-shrink-0 w-full snap-center">
                    <div className="aspect-[4/5] bg-muted relative">
                      <ProductImage
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* Dot indicators */}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === selectedImage ? 'w-5 bg-primary' : 'w-1.5 bg-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              )}
              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {product.badge && (
                  <span className="bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded">
                    {product.badge}
                  </span>
                )}
                {savePercent > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded">
                    -{savePercent}% OFF
                  </span>
                )}
                {!isInStock && (
                  <span className="bg-muted-foreground text-background text-[10px] font-bold px-2 py-0.5 rounded">
                    Sold Out
                  </span>
                )}
              </div>
              {/* Wishlist */}
              {user && (
                <button
                  className="absolute top-3 right-3 h-9 w-9 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
                  onClick={() => toggleWishlist.mutate({ productId: product.id })}
                >
                  <Heart className={`h-4.5 w-4.5 ${isInWishlist ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
                </button>
              )}
            </div>

            {/* Product Info */}
            <div className="px-4 pt-4 space-y-3">
              {/* Title & Author */}
              <div>
                <h1 className="text-xl font-bold leading-tight text-foreground">{product.name}</h1>
                {product.author && (
                  <p className="text-sm text-muted-foreground mt-0.5">by {product.author}</p>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-bold text-primary">{priceInfo.displayPrice}</span>
                {priceInfo.originalPrice && (
                  <span className="text-base line-through text-muted-foreground">{priceInfo.originalPrice}</span>
                )}
                {savePercent > 0 && (
                  <Badge variant="destructive" className="text-[10px]">Save {savePercent}%</Badge>
                )}
              </div>

              {/* Stock + Quantity in one row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {isInStock ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">In Stock</span>
                    </>
                  ) : (
                    <span className="text-sm text-destructive font-medium">Out of Stock</span>
                  )}
                  {product.stock_quantity !== null && product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                    <span className="text-xs text-destructive ml-1">· Only {product.stock_quantity} left!</span>
                  )}
                </div>
                {isInStock && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground disabled:opacity-30"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-sm font-semibold w-6 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={product.stock_quantity !== null && quantity >= product.stock_quantity}
                      className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground disabled:opacity-30"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Trust signals — compact row */}
              <div className="flex items-center gap-3 py-2.5 border-y border-border/40">
                {[
                  { icon: Shield, text: '100% Authentic' },
                  { icon: Globe, text: 'Ships Worldwide' },
                  { icon: Package, text: 'Secure Packaging' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1">
                    <Icon className="h-3 w-3 text-primary" />
                    <span className="text-[10px] text-muted-foreground">{text}</span>
                  </div>
                ))}
              </div>

              {/* Share row */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs h-9 text-green-600 border-green-600/30"
                  onClick={() => {
                    const url = `${window.location.origin}/product/${product.id}`;
                    const text = `Check out ${product.name} at Abu Hurayrah Essentials! ${priceInfo.displayPrice}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank');
                  }}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs h-9"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/product/${product.id}`);
                    toast({ title: 'Link copied!', description: 'Product link copied to clipboard.' });
                  }}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Copy Link
                </Button>
              </div>

              <Separator />

              {/* Description — collapsed by default on mobile */}
              <MobileCollapsible title="Description">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description || 'No description available.'}
                </p>
              </MobileCollapsible>

              {/* Book Details */}
              {(product.author || product.publisher || product.language) && (
                <MobileCollapsible title="Book Details" defaultOpen>
                  <div className="space-y-2 text-sm">
                    {product.author && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Author</span>
                        <span className="font-medium">{product.author}</span>
                      </div>
                    )}
                    {product.publisher && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Publisher</span>
                        <span className="font-medium">{product.publisher}</span>
                      </div>
                    )}
                    {product.language && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Language</span>
                        <span className="font-medium">{product.language}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <Link to={`/shop?category=${product.category}`} className="font-medium capitalize text-primary">
                        {product.category}
                      </Link>
                    </div>
                  </div>
                </MobileCollapsible>
              )}

              {/* Other Editions */}
              {variantProducts.length > 0 && (
                <MobileCollapsible title={`Other Editions (${variantProducts.length})`}>
                  <div className="space-y-2">
                    {variantProducts.map(vp => {
                      const vpPrice = formatPrice(vp.price, vp.price_inr, vp.sale_price, vp.sale_price_inr);
                      return (
                        <Link key={vp.id} to={`/product/${vp.id}`} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
                          <ProductImage
                            src={vp.cover_image_url || vp.images?.[0] || '/placeholder.svg'}
                            alt={vp.name}
                            className="w-10 h-14 object-cover rounded flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium line-clamp-2">{vp.name}</p>
                            {vp.author && <p className="text-[10px] text-muted-foreground">{vp.author}</p>}
                          </div>
                          <span className="text-xs font-bold text-primary flex-shrink-0">{vpPrice.displayPrice}</span>
                        </Link>
                      );
                    })}
                  </div>
                </MobileCollapsible>
              )}

              {/* Reviews */}
              <MobileCollapsible title={`Reviews (${reviews.length})`}>
                {reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No reviews yet.</p>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-border/30 pb-3 last:border-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold">
                            {review.user?.full_name || review.user?.email?.split('@')[0] || 'Anonymous'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                          ))}
                          {review.is_verified_purchase && (
                            <Badge variant="secondary" className="text-[9px] ml-1 h-4">Verified</Badge>
                          )}
                        </div>
                        {review.title && <p className="text-xs font-medium mb-0.5">{review.title}</p>}
                        {review.content && <p className="text-xs text-muted-foreground leading-relaxed">{review.content}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {user && canReview?.canReview && (
                  <Button variant="outline" size="sm" className="w-full mt-3 text-xs" onClick={() => setShowReviewForm(!showReviewForm)}>
                    Write a Review
                  </Button>
                )}
                {showReviewForm && user && canReview?.canReview && (
                  <div className="mt-3 space-y-3 border-t border-border/30 pt-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <button key={i} onClick={() => setReviewForm({ ...reviewForm, rating: i + 1 })}>
                          <Star className={`h-6 w-6 ${i < reviewForm.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                        </button>
                      ))}
                    </div>
                    <Input
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                      placeholder="Title (optional)"
                      className="h-9 text-sm"
                    />
                    <Textarea
                      value={reviewForm.content}
                      onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                      placeholder="Share your experience..."
                      rows={3}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={createReview.isPending || !reviewForm.content.trim()}
                      onClick={() => {
                        createReview.mutate({
                          product_id: product.id,
                          rating: reviewForm.rating,
                          title: reviewForm.title || undefined,
                          content: reviewForm.content,
                        }, {
                          onSuccess: () => {
                            setReviewForm({ rating: 5, title: '', content: '' });
                            setShowReviewForm(false);
                          },
                        });
                      }}
                    >
                      {createReview.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      Submit Review
                    </Button>
                  </div>
                )}
              </MobileCollapsible>

              {/* Related Products */}
              {relatedProducts.length > 0 && (
                <div className="pt-2">
                  <h2 className="text-base font-semibold mb-3">You May Also Like</h2>
                  <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                    {relatedProducts.map((relProduct) => {
                      const relPriceInfo = formatPrice(relProduct.price, relProduct.price_inr, relProduct.sale_price, relProduct.sale_price_inr);
                      return (
                        <Link key={relProduct.id} to={`/product/${relProduct.id}`} className="flex-shrink-0 w-[110px] group">
                          <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted border border-border/40 mb-1.5">
                            <ProductImage
                              src={relProduct.images?.[0] || '/placeholder.svg'}
                              alt={relProduct.name}
                              className="w-full h-full object-cover group-active:scale-95 transition-transform"
                            />
                          </div>
                          <p className="text-[11px] font-medium line-clamp-2 leading-tight">{relProduct.name}</p>
                          <p className="text-xs font-bold text-primary mt-0.5">{relPriceInfo.displayPrice}</p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* Sticky Add-to-Cart Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-pb">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-primary truncate">{priceInfo.displayPrice}</p>
                {priceInfo.originalPrice && (
                  <p className="text-[10px] line-through text-muted-foreground">{priceInfo.originalPrice}</p>
                )}
              </div>
              <Button
                size="lg"
                disabled={!isInStock}
                onClick={handleAddToCart}
                className={`h-12 px-6 rounded-xl font-semibold shadow-lg flex items-center gap-2 transition-all duration-200 ${
                  addedToCart ? 'bg-green-600 hover:bg-green-600' : ''
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="h-5 w-5" />
                    Added!
                  </>
                ) : isInStock ? (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    Add to Cart
                  </>
                ) : (
                  'Sold Out'
                )}
              </Button>
            </div>
          </div>

          <Footer />
        </>
      ) : (
        /* ==================== DESKTOP LAYOUT (unchanged) ==================== */
        <>
          <main className="flex-1 container px-4 py-8">
            <Link to="/shop">
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Shop
              </Button>
            </Link>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Product Images */}
              <div className="space-y-4">
                <div className="aspect-square overflow-hidden rounded-lg bg-muted relative">
                  <ProductImage
                    src={images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                  {product.badge && (
                    <Badge className="absolute top-4 right-4">{product.badge}</Badge>
                  )}
                  {!isInStock && (
                    <Badge className="absolute top-4 left-4" variant="destructive">Out of Stock</Badge>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${selectedImage === index ? "border-primary" : "border-transparent"}`}
                      >
                        <ProductImage
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                  {product.author && (
                    <p className="text-muted-foreground mb-2">by {product.author}</p>
                  )}
                  {(product.reviews_count || 0) > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-5 w-5 ${i < Math.floor(product.rating || 0) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                        ))}
                      </div>
                      <span className="text-muted-foreground">
                        {product.rating} ({product.reviews_count} reviews)
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-primary">{priceInfo.displayPrice}</span>
                    {priceInfo.originalPrice && (
                      <>
                        <span className="text-xl line-through text-muted-foreground">{priceInfo.originalPrice}</span>
                        <Badge variant="destructive">Save {savePercent}%</Badge>
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                <p className="text-muted-foreground leading-relaxed">
                  {product.description || 'No description available.'}
                </p>

                {(product.author || product.publisher || product.language) && (
                  <Card>
                    <CardContent className="p-4 space-y-2 text-sm">
                      {product.author && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Author:</span>
                          <span className="font-medium">{product.author}</span>
                        </div>
                      )}
                      {product.publisher && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Publisher:</span>
                          <span className="font-medium">{product.publisher}</span>
                        </div>
                      )}
                      {product.language && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Language:</span>
                          <span className="font-medium">{product.language}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {variantProducts.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Other Editions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                      {variantProducts.map(vp => {
                        const vpPrice = formatPrice(vp.price, vp.price_inr, vp.sale_price, vp.sale_price_inr);
                        return (
                          <Link key={vp.id} to={`/product/${vp.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                            <ProductImage
                              src={vp.cover_image_url || vp.images?.[0] || '/placeholder.svg'}
                              alt={vp.name}
                              className="w-12 h-16 object-cover rounded flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-2">{vp.name}</p>
                              {vp.author && <p className="text-xs text-muted-foreground">{vp.author}</p>}
                            </div>
                            <span className="text-sm font-medium text-primary flex-shrink-0">{vpPrice.displayPrice}</span>
                          </Link>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-3">
                  <label className="text-sm font-medium">Quantity</label>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                    <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)} disabled={product.stock_quantity !== null && quantity >= product.stock_quantity}>
                      <Plus className="h-4 w-4" />
                    </Button>
                    {product.stock_quantity !== null && product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                      <span className="text-sm text-destructive">Only {product.stock_quantity} left!</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isInStock ? (
                    <>
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-green-500 font-medium">In Stock</span>
                    </>
                  ) : (
                    <span className="text-destructive font-medium">Out of Stock</span>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button size="lg" className="flex-1" disabled={!isInStock} onClick={handleAddToCart}>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {isInStock ? "Add to Cart" : "Out of Stock"}
                  </Button>
                  {user && (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => toggleWishlist.mutate({ productId: product.id })}
                      disabled={toggleWishlist.isPending}
                      className={isInWishlist ? "text-red-500 border-red-500" : ""}
                    >
                      <Heart className={`h-5 w-5 ${isInWishlist ? "fill-current" : ""}`} />
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-green-600 border-green-600/30 hover:bg-green-600 hover:text-white"
                    onClick={() => {
                      const url = `${window.location.origin}/product/${product.id}`;
                      const text = `Check out ${product.name} at Abu Hurayrah Essentials! ${priceInfo.displayPrice}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank');
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Share on WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/product/${product.id}`);
                      toast({ title: 'Link copied!', description: 'Product link copied to clipboard.' });
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    Copy Link
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <Link to={`/shop?category=${product.category}`} className="font-medium capitalize hover:text-primary transition-colors">
                        {product.category}
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Reviews Section */}
            <section className="mt-16">
              <Tabs defaultValue="reviews" className="w-full">
                <TabsList>
                  <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
                  <TabsTrigger value="write-review" disabled={!user || !canReview?.canReview}>Write a Review</TabsTrigger>
                </TabsList>

                <TabsContent value="reviews" className="mt-6">
                  {reviews.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <Card key={review.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">
                                    {review.user?.full_name || review.user?.email?.split('@')[0] || 'Anonymous'}
                                  </span>
                                  {review.is_verified_purchase && (
                                    <Badge variant="secondary" className="text-xs">Verified Purchase</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                                  ))}
                                </div>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {review.title && <h4 className="font-semibold mb-2">{review.title}</h4>}
                            {review.content && <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="write-review" className="mt-6">
                  {user && canReview?.canReview ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Write a Review</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Rating *</Label>
                          <div className="flex items-center gap-2 mt-2">
                            {[...Array(5)].map((_, i) => (
                              <button key={i} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: i + 1 })} className="focus:outline-none">
                                <Star className={`h-8 w-8 transition-colors ${i < reviewForm.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="review-title">Title (Optional)</Label>
                          <Input id="review-title" value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} placeholder="Brief summary of your review" />
                        </div>
                        <div>
                          <Label htmlFor="review-content">Your Review *</Label>
                          <Textarea id="review-content" value={reviewForm.content} onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })} placeholder="Share your experience with this product..." rows={5} required />
                        </div>
                        <Button
                          onClick={() => {
                            if (!reviewForm.content.trim()) {
                              toast({ title: 'Review required', description: 'Please write your review before submitting.', variant: 'destructive' });
                              return;
                            }
                            createReview.mutate({
                              product_id: product.id,
                              rating: reviewForm.rating,
                              title: reviewForm.title || undefined,
                              content: reviewForm.content,
                            }, {
                              onSuccess: () => {
                                setReviewForm({ rating: 5, title: '', content: '' });
                                setShowReviewForm(false);
                              },
                            });
                          }}
                          disabled={createReview.isPending}
                        >
                          {createReview.isPending ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
                          ) : (
                            'Submit Review'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        {!user ? (
                          <>
                            <p className="text-muted-foreground mb-4">Please login to write a review.</p>
                            <Button asChild><Link to={`/auth?redirect=/product/${id}`}>Login</Link></Button>
                          </>
                        ) : canReview?.hasReviewed ? (
                          <p className="text-muted-foreground">You have already reviewed this product.</p>
                        ) : (
                          <p className="text-muted-foreground">You need to purchase this product to review it.</p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </section>

            {relatedProducts.length > 0 && (
              <section className="mt-16">
                <h2 className="text-2xl font-bold mb-6">Related Products</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {relatedProducts.map((relProduct) => {
                    const relPriceInfo = formatPrice(relProduct.price, relProduct.price_inr, relProduct.sale_price, relProduct.sale_price_inr);
                    return (
                      <Card key={relProduct.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                        <Link to={`/product/${relProduct.id}`}>
                          <div className="aspect-square overflow-hidden bg-muted">
                            <ProductImage
                              src={relProduct.images?.[0] || '/placeholder.svg'}
                              alt={relProduct.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        </Link>
                        <CardContent className="p-4">
                          <Link to={`/product/${relProduct.id}`}>
                            <h3 className="font-semibold line-clamp-1 hover:text-primary transition-colors">{relProduct.name}</h3>
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="font-bold">{relPriceInfo.displayPrice}</p>
                            {relPriceInfo.originalPrice && <p className="text-sm text-muted-foreground line-through">{relPriceInfo.originalPrice}</p>}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}
          </main>
          <Footer />
        </>
      )}
    </div>
  );
};

/* Collapsible section for mobile */
const MobileCollapsible = ({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/30 pb-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-2 text-sm font-semibold text-foreground"
      >
        {title}
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="pb-1">{children}</div>}
    </div>
  );
};

export default ProductDetail;
