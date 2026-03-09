import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, CheckCircle, Truck, Clock } from 'lucide-react';
import { format } from 'date-fns';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import { formatOrderCurrency } from '@/lib/pricing';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  created_at: string;
  total: number;
  currency: string;
  shipping_name: string;
  shipping_address_line_1: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  tracking_number?: string;
  tracking_carrier?: string;
  tracking_url?: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  currency: string;
}

const TrackOrder = () => {
  useDocumentTitle('Track Order');
  const [orderNumber, setOrderNumber] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const { toast } = useToast();

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderNumber.trim() || !contactInfo.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both order number and email/phone.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setOrder(null);
    setOrderItems([]);

    try {
      // Fetch order with email or phone verification
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber.trim())
        .or(`shipping_email.ilike.${contactInfo.trim()},shipping_phone.eq.${contactInfo.trim()}`)
        .single();

      if (orderError || !orderData) {
        toast({
          title: 'Order Not Found',
          description: 'No order found with that order number and contact information. Please check and try again.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Fetch order items
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id);

      if (!itemsError && items) {
        setOrderItems(items);
      }

      setOrder(orderData);
      toast({
        title: 'Order Found',
        description: `Order ${orderData.order_number} retrieved successfully.`,
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error tracking order:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while tracking your order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'processing':
        return <Package className="h-5 w-5 text-blue-600" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-600" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'shipped':
        return 'text-purple-600 bg-purple-50';
      case 'delivered':
        return 'text-green-600 bg-green-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };


  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 font-philosopher text-center">Track Your Order</h1>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Enter Order Details</CardTitle>
              <CardDescription>
                Enter your order number and the email address or phone number used during checkout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTrackOrder} className="space-y-4">
                <div>
                  <label htmlFor="orderNumber" className="block text-sm font-medium mb-2">
                    Order Number
                  </label>
                  <Input
                    id="orderNumber"
                    type="text"
                    placeholder="e.g., ORD-123456"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="contactInfo" className="block text-sm font-medium mb-2">
                    Email Address or Phone Number
                  </label>
                  <Input
                    id="contactInfo"
                    type="text"
                    placeholder="email@example.com or phone number"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    'Track Order'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {order && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Order {order.order_number}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Placed on {format(new Date(order.created_at), 'MMMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Order Status */}
                  <div>
                    <h3 className="font-semibold mb-3">Order Status</h3>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <span className="font-medium capitalize">{order.status}</span>
                    </div>
                    
                    {order.payment_status && (
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusIcon(order.payment_status)}
                        <span className="text-sm text-muted-foreground">
                          Payment: <span className="capitalize">{order.payment_status}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tracking Information */}
                  {order.tracking_number && (
                    <div>
                      <h3 className="font-semibold mb-3">Tracking Information</h3>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Tracking Number:</span> {order.tracking_number}
                        </p>
                        {order.tracking_carrier && (
                          <p className="text-sm">
                            <span className="font-medium">Carrier:</span> {order.tracking_carrier}
                          </p>
                        )}
                        {order.tracking_url && (
                          <a
                            href={order.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm inline-flex items-center gap-1"
                          >
                            Track Package
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  {orderItems.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Order Items</h3>
                      <div className="space-y-3">
                        {orderItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                            {item.product_image && (
                              <img
                                src={item.product_image}
                                alt={item.product_name}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{item.product_name}</p>
                              <p className="text-sm text-muted-foreground">
                                Quantity: {item.quantity}
                              </p>
                            </div>
                            <p className="font-semibold">
                              {formatOrderCurrency(item.currency, item.unit_price * item.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shipping Address */}
                  <div>
                    <h3 className="font-semibold mb-3">Shipping Address</h3>
                    <div className="text-sm space-y-1">
                      <p className="font-medium">{order.shipping_name}</p>
                      <p>{order.shipping_address_line_1}</p>
                      <p>
                        {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
                      </p>
                      <p>{order.shipping_country}</p>
                    </div>
                  </div>

                  {/* Order Total */}
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">Total</span>
                      <span className="font-bold text-2xl">
                        {formatOrderCurrency(order.currency, order.total)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TrackOrder;
