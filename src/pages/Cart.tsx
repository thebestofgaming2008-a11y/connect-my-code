import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrencyContext } from "@/contexts/CurrencyContext";
import { useValidateCoupon } from "@/hooks/useCoupons";
import { calculateShipping, getShippingInfo } from "@/lib/pricing";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductImage from "@/components/ui/product-image";
import useDocumentTitle from "@/hooks/useDocumentTitle";

const Cart = () => {
  useDocumentTitle('Cart');
  const { items, removeFromCart, updateQuantity, getTotal, appliedCoupon, applyCoupon, removeCoupon, getDiscount } = useCart();
  const { user } = useAuth();
  const { currency, exchangeRates, formatAmount, userCountry } = useCurrencyContext();
  const { toast } = useToast();
  const validateCoupon = useValidateCoupon();
  const [promoCode, setPromoCode] = useState("");

  const handleRemove = (productId: string, name: string) => {
    removeFromCart(productId);
    toast({
      title: "Item removed",
      description: `${name} has been removed from your cart.`,
    });
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast({
        title: "Enter a coupon code",
        description: "Please enter a coupon code to apply.",
        variant: "destructive",
      });
      return;
    }

    const sub = getTotal(currency, exchangeRates);
    validateCoupon.mutate(
      { code: promoCode, subtotal: sub, currency, exchangeRates },
      {
        onSuccess: (result) => {
          if (result.valid && result.coupon) {
            applyCoupon({
              code: promoCode.toUpperCase().trim(),
              discount_type: result.coupon.discount_type === 'percentage' ? 'percentage' : 'fixed_inr',
              discount_value: result.coupon.discount_value,
              max_discount_inr: result.coupon.max_discount_inr ?? undefined,
            });
            toast({
              title: "Coupon applied!",
              description: `You saved ${formatAmount(result.discount || 0)} on your order.`,
            });
          } else {
            toast({
              title: "Invalid coupon",
              description: result.error || "Please check your code and try again.",
              variant: "destructive",
            });
          }
        },
      }
    );
  };

  const subtotal = getTotal(currency, exchangeRates);
  const shipping = calculateShipping(subtotal, currency, userCountry, exchangeRates);
  const discount = getDiscount(subtotal);
  const total = subtotal + shipping - discount;
  const shipInfo = getShippingInfo(userCountry);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container px-4 py-6 pb-32 lg:pb-8">
        <Link to="/shop">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-8 font-philosopher">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some products to get started</p>
            <Link to="/shop">
              <Button size="lg">Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                let itemPrice: number;
                if (currency === 'INR') {
                  const inrRate = exchangeRates['INR'] || 90;
                  itemPrice = item.product.salePriceInr || item.product.priceInr || (item.product.salePrice || item.product.price) * inrRate;
                } else if (currency === 'USD') {
                  itemPrice = item.product.salePrice || item.product.price;
                } else {
                  const rate = exchangeRates[currency] || 1;
                  itemPrice = (item.product.salePrice || item.product.price) * rate;
                }
                return (
                  <Card key={`${item.product.id}-${item.size}-${item.color}`}>
                    <CardContent className="p-6">
                      <div className="flex gap-4 sm:gap-6">
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                          <ProductImage
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 flex flex-col">
                          <div className="flex justify-between items-start">
                            <div className="pr-2">
                              <Link to={`/product/${item.product.id}`}>
                                <h3 className="font-semibold text-sm sm:text-base hover:text-primary transition-colors line-clamp-2">
                                  {item.product.name}
                                </h3>
                              </Link>
                              {item.size && (
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Size: {item.size}</p>
                              )}
                              {item.color && (
                                <p className="text-xs sm:text-sm text-muted-foreground">Color: {item.color}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground hover:text-destructive shrink-0 -mt-1 -mr-2 sm:mt-0 sm:mr-0"
                              onClick={() => handleRemove(item.product.id, item.product.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between mt-auto pt-4">
                            <div className="flex items-center gap-2 sm:gap-3 bg-muted/50 rounded-md p-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-background shadow-sm"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-xs sm:text-sm font-semibold w-6 sm:w-8 text-center">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-background shadow-sm"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-base sm:text-lg font-bold">
                              {formatAmount(itemPrice * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{formatAmount(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping ({shipInfo.estimatedDays}d)</span>
                      <span className="font-medium">{formatAmount(shipping)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-500">
                        <span>Discount</span>
                        <span>-{formatAmount(discount)}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatAmount(total)}</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Coupon Code</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        disabled={!!appliedCoupon || validateCoupon.isPending}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !appliedCoupon) {
                            e.preventDefault();
                            applyPromoCode();
                          }
                        }}
                      />
                      {appliedCoupon ? (
                        <Button onClick={removeCoupon} variant="destructive" size="sm">Remove</Button>
                      ) : (
                        <Button
                          onClick={applyPromoCode}
                          variant="secondary"
                          disabled={validateCoupon.isPending}
                        >
                          {validateCoupon.isPending ? "Checking..." : "Apply"}
                        </Button>
                      )}
                    </div>
                    {appliedCoupon && (
                      <p className="text-xs text-green-600">
                        Coupon {appliedCoupon.code} applied — Saved {formatAmount(discount)}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  {!user && (
                    <Alert className="bg-muted">
                      <Lock className="h-4 w-4" />
                      <AlertDescription>
                        You'll need to <Link to="/auth?redirect=/checkout" className="font-medium text-primary hover:underline">login or create an account</Link> to checkout.
                      </AlertDescription>
                    </Alert>
                  )}
                  <Link to={user ? "/checkout" : "/auth?redirect=/checkout"} className="w-full">
                    <Button className="w-full" size="lg">
                      {user ? "Proceed to Checkout" : "Login to Checkout"}
                    </Button>
                  </Link>
                  <p className="text-[11px] text-muted-foreground text-center">
                    Track orders in your account after purchase — no emails sent
                  </p>
                </CardFooter>
              </Card>
            </div>

            {/* Mobile Sticky Checkout Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t lg:hidden z-40 flex flex-col gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-center px-1">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">{formatAmount(total)}</span>
              </div>
              <Link to={user ? "/checkout" : "/auth?redirect=/checkout"} className="w-full">
                <Button className="w-full" size="lg">
                  {user ? "Proceed to Checkout" : "Login to Checkout"}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
