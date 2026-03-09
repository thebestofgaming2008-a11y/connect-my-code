import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useUserOrders } from '@/hooks/useOrders';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ArrowLeft, Package, Loader2, ShoppingBag, Clock, CheckCircle, Truck, DollarSign, XCircle, MapPin, Mail, Phone as PhoneIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import { formatOrderCurrency } from '@/lib/pricing';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  paid: { label: 'Paid', icon: DollarSign, color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
  processing: { label: 'Processing', icon: Package, color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200' },
  shipped: { label: 'Shipped', icon: Truck, color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
};

const MyOrders = () => {
  useDocumentTitle('My Orders');
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: orders = [], isLoading } = useUserOrders(user?.id);
  const accessGranted = useRef(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  if (user) accessGranted.current = true;

  useEffect(() => {
    if (!authLoading && !accessGranted.current && !user) {
      navigate('/auth');
    }
  }, [authLoading]);

  const getStatusBadge = (status: string | null) => {
    const cfg = STATUS_CONFIG[status || 'pending'] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.bgColor} ${cfg.color}`}>
        <Icon className="h-3 w-3" />
        {cfg.label}
      </span>
    );
  };


  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container max-w-3xl px-4 py-8">
        <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
          <Link to="/account">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            My Account
          </Link>
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-philosopher">My Orders</h1>
          {orders.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
          )}
        </div>

        {/* Info banner — no email, check here */}
        <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
          <Package className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">This is your order hub</p>
            <p className="text-xs text-muted-foreground">All order updates appear here — no emails will be sent. Bookmark this page and check back for status changes.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 border border-border/50 rounded-2xl bg-card">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6 text-sm max-w-sm mx-auto">
              Start shopping to see your orders here.
            </p>
            <Button asChild>
              <Link to="/shop">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              return (
                <div key={order.id} className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
                  {/* Order header — always visible, clickable */}
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="w-full flex items-center gap-3 p-4 sm:p-5 text-left hover:bg-muted/30 transition-colors"
                  >
                    {/* First item image */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {order.order_items?.[0]?.product_image ? (
                        <img src={order.order_items[0].product_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-foreground">#{order.order_number || order.id.slice(0, 8)}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at || ''), 'MMM d, yyyy')} · {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0 flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{formatOrderCurrency(order.currency, order.total)}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-border/50 p-4 sm:p-5 space-y-5">
                      {/* Items */}
                      <div className="space-y-3">
                        {order.order_items?.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              {item.product_image ? (
                                <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground line-clamp-1">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatOrderCurrency(order.currency, item.unit_price)}</p>
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                              {formatOrderCurrency(order.currency, item.total_price || item.unit_price * item.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Tracking */}
                      {order.tracking_number && (
                        <>
                          <Separator />
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                            <Truck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm space-y-0.5">
                              {order.tracking_carrier && <p className="font-medium text-blue-900">{order.tracking_carrier}</p>}
                              <p className="text-blue-700 font-mono text-xs">{order.tracking_number}</p>
                              {order.tracking_url && (
                                <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs inline-flex items-center gap-1">
                                  Track Package →
                                </a>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      <Separator />

                      {/* Address + Contact */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-muted-foreground">
                            <p className="font-medium text-foreground">{order.shipping_name}</p>
                            <p>{order.shipping_address_line_1}</p>
                            <p>{order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}</p>
                            <p>{order.shipping_country}</p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="break-all">{order.shipping_email}</span>
                          </div>
                          {order.shipping_phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <PhoneIcon className="h-3.5 w-3.5 flex-shrink-0" />
                              <span>{order.shipping_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Summary */}
                      <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{formatOrderCurrency(order.currency, order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shipping</span>
                          <span>{formatOrderCurrency(order.currency, order.shipping_cost)}</span>
                        </div>
                        {order.discount && Number(order.discount) > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span>-{formatOrderCurrency(order.currency, order.discount)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-bold text-base">
                          <span>Total</span>
                          <span>{formatOrderCurrency(order.currency, order.total)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyOrders;
