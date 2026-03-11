import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProductImage from '@/components/ui/product-image';
import { useCart } from '@/contexts/CartContext';
import { useCurrencyContext } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { formatPrice } = useCurrencyContext();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const cartProduct = {
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      priceInr: product.price_inr || undefined,
      salePrice: product.sale_price ?? undefined,
      salePriceInr: product.sale_price_inr ?? undefined,
      category: product.category || '',
      images: product.images || [product.cover_image_url || '/placeholder.svg'],
      inStock: (product.stock_quantity ?? 0) > 0,
      rating: product.rating || 0,
      reviews: product.reviews_count || 0,
      badge: product.badge ?? undefined,
    };

    addToCart(cartProduct);
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  const priceInfo = formatPrice(product.price, product.price_inr, product.sale_price, product.sale_price_inr);
  const mainImage = product.images?.[0] || '/placeholder.svg';

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="bg-card rounded-lg border border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/20">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {product.badge && (
            <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
              {product.badge}
            </Badge>
          )}
          {(product.stock_quantity ?? 0) <= 0 && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <span className="text-muted-foreground font-medium">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-primary">
                {priceInfo.displayPrice}
              </span>
              {priceInfo.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {priceInfo.originalPrice}
                </span>
              )}
            </div>

            {(product.stock_quantity ?? 0) > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;