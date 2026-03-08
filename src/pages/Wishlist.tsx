import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useWishlistItems, useRemoveWishlistItem } from '@/hooks/useWishlist';
import { useCurrencyContext } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductImage from '@/components/ui/product-image';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import { Skeleton } from '@/components/ui/skeleton';

const Wishlist = () => {
  useDocumentTitle('Wishlist');
  const { user } = useAuth();
  const { data: wishlistItems = [], isLoading } = useWishlistItems();
  const removeWishlistItem = useRemoveWishlistItem();
  const { formatPrice } = useCurrencyContext();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleRemove = (productId: string) => {
    removeWishlistItem.mutate(productId);
  };

  const handleAddToCart = (item: any) => {
    if (!item.product) return;

    const product = item.product;
    addToCart({
      id: product.id,
      name: product.name,
      description: '',
      price: product.price,
      priceInr: product.price_inr,
      salePrice: product.sale_price,
      salePriceInr: product.sale_price_inr,
      category: '',
      images: product.images || [product.cover_image_url || ''],
      inStock: product.in_stock,
      rating: 0,
      reviews: 0,
    });

    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center p-8">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-6">Please login to view your wishlist.</p>
            <Button asChild>
              <Link to="/auth?redirect=/wishlist">Login / Sign Up</Link>
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container px-4 py-8">
        <Link to="/shop">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-8 font-philosopher">My Wishlist</h1>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="aspect-square w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">Add products you love to your wishlist</p>
            <Link to="/shop">
              <Button size="lg">Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistItems.map((item) => {
              if (!item.product) return null;

              const product = item.product;
              const priceInfo = formatPrice(
                product.price,
                product.price_inr,
                product.sale_price,
                product.sale_price_inr
              );
              const imageUrl = product.images?.[0] || product.cover_image_url || '/placeholder.svg';

              return (
                <Card key={item.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                  <Link to={`/product/${product.id}`}>
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <ProductImage
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </Link>
                  <CardContent className="p-4 space-y-3">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-semibold hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">{priceInfo.displayPrice}</span>
                      {priceInfo.originalPrice && (
                        <span className="text-sm line-through text-muted-foreground">
                          {priceInfo.originalPrice}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        size="sm"
                        disabled={!product.in_stock}
                        onClick={() => handleAddToCart(item)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemove(item.product_id)}
                        disabled={removeWishlistItem.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;

