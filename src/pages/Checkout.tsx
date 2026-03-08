import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrencyContext } from '@/contexts/CurrencyContext';
import { calculateShipping, getShippingInfo } from '@/lib/pricing';
import { useToast } from '@/hooks/use-toast';
import { useRazorpay } from '@/hooks/useRazorpay';
import { ArrowLeft, Loader2, ShoppingBag, Package, Lock, CreditCard, Shield, MessageCircle, Truck } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { z } from 'zod';
import useDocumentTitle from '@/hooks/useDocumentTitle';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Andaman & Nicobar', 'Chandigarh', 'Dadra & Nagar Haveli', 'Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const WHATSAPP_NUMBER = '918491943437';

const baseSchema = z.object({
  name: z.string().min(1, 'Full name is required').max(100),
  email: z.string().trim().email('Please enter a valid email'),
  address: z.string().min(5, 'Address is required').max(200),
  city: z.string().min(2, 'City is required').max(100),
  state: z.string().min(1, 'State/Province is required').max(100),
  country: z.string().min(2, 'Country is required').max(100),
});

const indiaSchema = baseSchema.extend({
  phone: z.string().regex(/^(?:\+?91[\s-]?)?[6-9]\d{9}$/, 'Enter a valid Indian mobile number (e.g. 9876543210 or +91 9876543210)'),
  postalCode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
});

const internationalSchema = baseSchema.extend({
  phone: z.string().min(7, 'Phone number must be at least 7 characters').max(20),
  postalCode: z.string().min(3, 'Postal code is required').max(20),
});

type CheckoutFormData = z.infer<typeof indiaSchema>;
type CheckoutErrors = Partial<Record<keyof CheckoutFormData, string>>;

function buildWhatsAppMessage(items: { name: string; quantity: number; price: number }[], formData: CheckoutFormData, total: number, currencySymbol: string) {
  let msg = `*New Order from Abu Hurayrah Essentials*\n\n`;
  msg += `*Customer:* ${formData.name}\n`;
  msg += `*Email:* ${formData.email}\n`;
  msg += `*Phone:* ${formData.phone}\n`;
  msg += `*Address:* ${formData.address}, ${formData.city}, ${formData.state} ${formData.postalCode}, ${formData.country}\n\n`;
  msg += `*Items:*\n`;
  items.forEach(item => {
    msg += `- ${item.name} x${item.quantity} = ${currencySymbol}${(item.price * item.quantity).toFixed(2)}\n`;
  });
  msg += `\n*Total: ${currencySymbol}${total.toFixed(2)}*\n`;
  msg += `\nPlease confirm availability and payment method.`;
  return encodeURIComponent(msg);
}

const Checkout = () => {
  useDocumentTitle('Checkout');
  const navigate = useNavigate();
  const { items, getTotal, clearCart, appliedCoupon, removeCoupon, getDiscount } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { currency, currencySymbol, exchangeRates, formatAmount, userCountry } = useCurrencyContext();
  const { toast } = useToast();
  const { initiatePayment, loading: paymentLoading } = useRazorpay();
  const queryClient = useQueryClient();
  const [formErrors, setFormErrors] = useState<CheckoutErrors>({});
  const accessGranted = useRef(false);

  if (user) accessGranted.current = true;

  const [formData, setFormData] = useState<CheckoutFormData>({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: userCountry === 'IN' ? 'India' : '',
  });

  // Derive shipping destination from the country the user typed, not from currency
  const shippingToIndia = formData.country.trim().toLowerCase() === 'india';

  useEffect(() => {
    if (!authLoading && !accessGranted.current && !user) {
      toast({ title: "Login Required", description: "Please login or create an account to checkout.", variant: "destructive" });
      navigate('/auth?redirect=/checkout');
    }
  }, [authLoading]);

  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [user]);

  const subtotal = getTotal(currency, exchangeRates);
  const shippingCost = calculateShipping(subtotal, currency, userCountry, exchangeRates);
  const discount = getDiscount(subtotal);
  const total = subtotal + shippingCost - discount;
  const shippingInfo = getShippingInfo(userCountry);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof CheckoutErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): CheckoutFormData | null => {
    const schema = shippingToIndia ? indiaSchema : internationalSchema;
    const result = schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: CheckoutErrors = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof CheckoutErrors;
        fieldErrors[field] = err.message;
      });
      setFormErrors(fieldErrors);
      toast({ title: "Please fix the errors", description: "Some fields are missing or invalid.", variant: "destructive" });
      return null;
    }
    return result.data as CheckoutFormData;
  };

  const handleRazorpayCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    if (!user) { navigate('/auth?redirect=/checkout'); return; }
    if (items.length === 0) { toast({ title: "Cart is empty", variant: "destructive" }); return; }

    const validated = validateForm();
    if (!validated) return;

    try {
      // Razorpay always charges in INR — compute INR prices for payment
      const inrRate = exchangeRates['INR'] || 90;
      const cartItems = items.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.salePriceInr || item.product.priceInr || (item.product.salePrice || item.product.price) * inrRate,
        quantity: item.quantity,
        image: item.product.images?.[0],
      }));

      const shippingData = {
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        address: validated.address,
        city: validated.city,
        state: validated.state,
        postal_code: validated.postalCode,
        country: validated.country,
      };

      // Razorpay payment is always in INR
      const shippingINR = calculateShipping(getTotal('INR', exchangeRates), 'INR', userCountry, exchangeRates);
      const response = await initiatePayment(cartItems, shippingData, 'INR', user.id, appliedCoupon?.code, shippingINR);
      if (response.verified && response.order) {
        clearCart();
        queryClient.invalidateQueries({ queryKey: ['user-orders'] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        navigate(`/checkout-success?order_number=${response.order.order_number}`);
      }
    } catch (error: unknown) {
      if (import.meta.env.DEV) console.error('Checkout error:', error);
      const msg = error instanceof Error ? error.message : 'Payment could not be completed';
      if (!msg.includes('cancelled')) {
        toast({ title: 'Payment Error', description: msg, variant: 'destructive' });
      }
    }
  };

  const handleWhatsAppOrder = () => {
    setFormErrors({});
    const validated = validateForm();
    if (!validated) return;

    const cartItems = items.map(item => {
      let price: number;
      if (currency === 'INR') {
        const inrRate = exchangeRates['INR'] || 90;
        price = item.product.salePriceInr || item.product.priceInr || (item.product.salePrice || item.product.price) * inrRate;
      } else if (currency === 'USD') {
        price = item.product.salePrice || item.product.price;
      } else {
        const rate = exchangeRates[currency] || 1;
        price = (item.product.salePrice || item.product.price) * rate;
      }
      return { name: item.product.name, quantity: item.quantity, price };
    });

    const msg = buildWhatsAppMessage(cartItems, validated, total, currencySymbol);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
    toast({ title: 'Order sent via WhatsApp', description: 'We will confirm your order and payment details shortly.' });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center p-8">
            <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-6">Please login or create an account to complete your purchase.</p>
            <Button asChild className="w-full"><Link to="/auth?redirect=/checkout">Login / Sign Up</Link></Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center p-8">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some items to proceed with checkout.</p>
            <Button asChild><Link to="/shop">Browse Products</Link></Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-6 sm:py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/cart"><ArrowLeft className="h-4 w-4 mr-2" />Back to Cart</Link>
          </Button>

          <h1 className="text-2xl sm:text-3xl font-bold mb-6 font-philosopher">Checkout</h1>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Shipping Form */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base"><Package className="h-5 w-5" />Shipping Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={shippingToIndia ? handleRazorpayCheckout : (e) => { e.preventDefault(); handleWhatsAppOrder(); }} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Your full name" />
                    {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="you@example.com" />
                      {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder={shippingToIndia ? '9876543210 or +91 9876543210' : '+1 234 567 890'} />
                      {formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address">Address *</Label>
                    <Input id="address" name="address" value={formData.address} onChange={handleInputChange} placeholder="Street address, apartment, etc." />
                    {formErrors.address && <p className="text-xs text-destructive">{formErrors.address}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="city">City *</Label>
                      <Input id="city" name="city" value={formData.city} onChange={handleInputChange} placeholder={shippingToIndia ? 'Srinagar' : 'City'} />
                      {formErrors.city && <p className="text-xs text-destructive">{formErrors.city}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="state">State/Province *</Label>
                      {shippingToIndia ? (
                        <Select value={formData.state} onValueChange={v => { setFormData(p => ({ ...p, state: v })); setFormErrors(p => ({ ...p, state: '' })); }}>
                          <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                          <SelectContent className="max-h-60">
                            {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input id="state" name="state" value={formData.state} onChange={handleInputChange} placeholder="State/Province" />
                      )}
                      {formErrors.state && <p className="text-xs text-destructive">{formErrors.state}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="postalCode">{shippingToIndia ? 'PIN Code' : 'Postal Code'} *</Label>
                      <Input id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleInputChange} placeholder={shippingToIndia ? '190001' : 'Postal code'} inputMode="numeric" />
                      {formErrors.postalCode && <p className="text-xs text-destructive">{formErrors.postalCode}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="country">Country *</Label>
                      <Input id="country" name="country" value={formData.country} onChange={handleInputChange} placeholder="Your country" />
                      {formErrors.country && <p className="text-xs text-destructive">{formErrors.country}</p>}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Shipping estimate */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                    <Truck className="h-4 w-4 flex-shrink-0" />
                    <span>
                      Shipping: {formatAmount(shippingCost)}
                      {' · '}{shippingInfo.estimatedDays} days estimated
                    </span>
                  </div>

                  {/* India: Razorpay button */}
                  {shippingToIndia ? (
                    <>
                      <Button type="submit" className="w-full h-12 text-base" disabled={paymentLoading}>
                        {paymentLoading ? (
                          <><Loader2 className="h-5 w-5 animate-spin mr-2" />Processing...</>
                        ) : (
                          <><CreditCard className="h-5 w-5 mr-2" />Pay {formatAmount(total)}</>
                        )}
                      </Button>
                      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                        <Shield className="h-3.5 w-3.5 text-green-600" />
                        Secure payment powered by Razorpay
                      </p>
                    </>
                  ) : (
                    /* International: WhatsApp order button */
                    <>
                      <Button type="submit" className="w-full h-12 text-base bg-green-600 hover:bg-green-700">
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Order via WhatsApp — {formatAmount(total)}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Your order details will be sent to our WhatsApp. We'll confirm availability and payment.
                      </p>
                    </>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <div className="lg:sticky lg:top-24 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Order Summary ({items.reduce((s, i) => s + i.quantity, 0)} item{items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
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
                        <div key={item.product.id} className="flex gap-3">
                          <img src={item.product.images[0]} alt={item.product.name} className="w-14 h-16 object-cover rounded border border-border/50" loading="lazy" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2">{item.product.name}</h4>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-medium text-sm flex-shrink-0">{formatAmount(itemPrice * item.quantity)}</p>
                        </div>
                      );
                    })}
                  </div>
                  <Separator />
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatAmount(subtotal)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{formatAmount(shippingCost)}</span></div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({appliedCoupon?.code})</span>
                        <span>-{formatAmount(discount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg pt-1"><span>Total</span><span className="text-primary">{formatAmount(total)}</span></div>
                  </div>
                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600">Coupon: {appliedCoupon.code}</span>
                      <Button type="button" variant="ghost" size="sm" className="text-destructive h-auto p-0" onClick={removeCoupon}>Remove</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground px-2">
                <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-green-600" />Secure Checkout</span>
                <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" />Tracked Shipping</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
