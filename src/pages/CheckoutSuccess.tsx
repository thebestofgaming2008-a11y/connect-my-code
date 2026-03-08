import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { CheckCircle, Package, ArrowRight, Home, Truck, Mail, MessageCircle, ClipboardList } from 'lucide-react';
import Header from '@/components/layout/Header';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import Footer from '@/components/layout/Footer';

const WHATSAPP_NUMBER = '918491943437';

const TIMELINE_STEPS = [
  { label: 'Order Confirmed', description: 'Payment received', active: true },
  { label: 'Processing', description: 'Preparing your order', active: false },
  { label: 'Shipped', description: 'On its way to you', active: false },
  { label: 'Delivered', description: 'At your doorstep', active: false },
];

const CheckoutSuccess = () => {
  useDocumentTitle('Order Confirmed');
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const orderNumber = searchParams.get('order_number');

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 py-8 sm:py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Success header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-5 bg-green-500/10 rounded-full flex items-center justify-center ring-4 ring-green-500/20">
              <CheckCircle className="h-11 w-11 text-green-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-philosopher mb-2">
              Thank You for Your Order!
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your payment was successful and your order has been confirmed. We'll get it to you as soon as possible.
            </p>
          </div>

          {/* Order number card */}
          {orderNumber && (
            <div className="rounded-xl border border-border bg-card p-5 mb-6 text-center shadow-sm">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Order Number</p>
              <p className="text-xl sm:text-2xl font-bold font-mono tracking-wide">{orderNumber}</p>
              <p className="text-xs text-muted-foreground mt-2">Save this number for tracking your order</p>
            </div>
          )}

          {/* Order timeline */}
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6 mb-6 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Order Progress
            </h2>
            <div className="relative">
              {TIMELINE_STEPS.map((step, i) => (
                <div key={step.label} className="flex items-start gap-3 pb-5 last:pb-0">
                  {/* Dot + line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${step.active ? 'bg-green-500 ring-4 ring-green-500/20' : 'bg-muted-foreground/20'}`} />
                    {i < TIMELINE_STEPS.length - 1 && (
                      <div className={`w-0.5 flex-1 min-h-[28px] ${step.active ? 'bg-green-500/30' : 'bg-muted-foreground/10'}`} />
                    )}
                  </div>
                  {/* Text */}
                  <div className="-mt-0.5">
                    <p className={`text-sm font-medium ${step.active ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How to track */}
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6 mb-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Truck className="h-4 w-4" />
              How to Track Your Order
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email Confirmation</p>
                  <p className="text-xs text-muted-foreground">You'll receive a confirmation email with your order details shortly.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">My Orders Page</p>
                  <p className="text-xs text-muted-foreground">View your order status, details, and tracking info anytime from your account.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Truck className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Tracking Updates</p>
                  <p className="text-xs text-muted-foreground">Once shipped, you'll get a tracking number via email. Use it on the Track Order page.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button asChild className="w-full h-11">
              <Link to="/my-orders">
                <ClipboardList className="h-4 w-4 mr-2" />
                View My Orders
              </Link>
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="h-11">
                <Link to="/shop">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11">
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
            <Button
              asChild
              variant="ghost"
              className="w-full h-10 text-green-700 hover:text-green-800 hover:bg-green-50"
            >
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi, I just placed order ${orderNumber || ''}. I have a question about my order.`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Need help? Chat with us on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutSuccess;
