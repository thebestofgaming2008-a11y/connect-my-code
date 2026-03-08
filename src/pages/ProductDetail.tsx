import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, Star, ArrowLeft, Minus, Plus, Check, Heart, Loader2, MessageCircle, Share2 } from "lucide-react";
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

  const { data: variantProducts = [] } = useVariantProducts(id || '', product?.tags || null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', content: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    setSelectedImage(0);
    setQuantity(1);
  }, [id]);

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

    toast({
      title: "Added to cart",
      description: `${quantity}x ${product.name} has been added to your cart.`,
    });
  };

  // Get related products — same category, exclude current, filter out test/placeholder products
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={product.name}
        description={product.description?.slice(0, 160) || `Buy ${product.name} at Abu Hurayrah Essentials`}
        image={images[0]}
        url={`/product/${product.id}`}
        type="product"
        product={{
          name: product.name,
          price: priceInfo.numericPrice,
          currency: currency,
          availability: isInStock ? 'InStock' : 'OutOfStock',
          image: images[0],
          description: product.description?.slice(0, 300),
          rating: product.rating || undefined,
          reviewCount: product.reviews_count || undefined,
        }}
      />
      <Header />

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
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${selectedImage === index ? "border-primary" : "border-transparent"
                      }`}
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
                      <Star
                        key={i}
                        className={`h-5 w-5 ${i < Math.floor(product.rating || 0)
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-muted-foreground">
                    {product.rating} ({product.reviews_count} reviews)
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-primary">
                  {priceInfo.displayPrice}
                </span>
                {priceInfo.originalPrice && (
                  <>
                    <span className="text-xl line-through text-muted-foreground">
                      {priceInfo.originalPrice}
                    </span>
                    <Badge variant="destructive">
                      Save {Math.round(((priceInfo.numericOriginal! - priceInfo.numericPrice) / priceInfo.numericOriginal!) * 100)}%
                    </Badge>
                  </>
                )}
              </div>
            </div>

            <Separator />

            <p className="text-muted-foreground leading-relaxed">
              {product.description || 'No description available.'}
            </p>

            {/* Book Details */}
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

            {/* Other Editions */}
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

            {/* Quantity */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Quantity</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={product.stock_quantity !== null && quantity >= product.stock_quantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                {product.stock_quantity !== null && product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                  <span className="text-sm text-destructive">Only {product.stock_quantity} left!</span>
                )}
              </div>
            </div>

            {/* Stock Status */}
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

            {/* Add to Cart */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1"
                disabled={!isInStock}
                onClick={handleAddToCart}
              >
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

            {/* Share */}
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

            {/* Category */}
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
              <TabsTrigger value="reviews">
                Reviews ({reviews.length})
              </TabsTrigger>
              <TabsTrigger value="write-review" disabled={!user || !canReview?.canReview}>
                Write a Review
              </TabsTrigger>
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
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.title && (
                          <h4 className="font-semibold mb-2">{review.title}</h4>
                        )}
                        {review.content && (
                          <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>
                        )}
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
                          <button
                            key={i}
                            type="button"
                            onClick={() => setReviewForm({ ...reviewForm, rating: i + 1 })}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-8 w-8 transition-colors ${
                                i < reviewForm.rating ? 'fill-primary text-primary' : 'text-muted-foreground'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="review-title">Title (Optional)</Label>
                      <Input
                        id="review-title"
                        value={reviewForm.title}
                        onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                        placeholder="Brief summary of your review"
                      />
                    </div>
                    <div>
                      <Label htmlFor="review-content">Your Review *</Label>
                      <Textarea
                        id="review-content"
                        value={reviewForm.content}
                        onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                        placeholder="Share your experience with this product..."
                        rows={5}
                        required
                      />
                    </div>
                    <Button
                      onClick={() => {
                        if (!reviewForm.content.trim()) {
                          toast({
                            title: 'Review required',
                            description: 'Please write your review before submitting.',
                            variant: 'destructive',
                          });
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
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
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
                        <Button asChild>
                          <Link to={`/auth?redirect=/product/${id}`}>Login</Link>
                        </Button>
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

        {/* Related Products */}
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
                        <h3 className="font-semibold line-clamp-1 hover:text-primary transition-colors">
                          {relProduct.name}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-bold">{relPriceInfo.displayPrice}</p>
                        {relPriceInfo.originalPrice && (
                          <p className="text-sm text-muted-foreground line-through">{relPriceInfo.originalPrice}</p>
                        )}
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
    </div>
  );
};

export default ProductDetail;
