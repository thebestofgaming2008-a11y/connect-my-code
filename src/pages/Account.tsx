import { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserOrders } from '@/hooks/useOrders';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import { formatOrderCurrency } from '@/lib/pricing';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ArrowLeft, Package, Loader2, ShoppingBag, Heart, User, Mail, ChevronRight, LogOut } from 'lucide-react';

const Account = () => {
  useDocumentTitle('My Account');
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: orders = [] } = useUserOrders(user?.id);
  const accessGranted = useRef(false);

  if (user) accessGranted.current = true;

  useEffect(() => {
    if (!authLoading && !accessGranted.current && !user) {
      navigate('/auth?redirect=/account');
    }
  }, [authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const initials = name.slice(0, 2).toUpperCase();
  const recentOrders = orders.slice(0, 3);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Home
          </Link>
        </Button>

        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground font-philosopher truncate">{name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </p>
          </div>
        </div>

        {/* Quick links */}
        <div className="space-y-2 mb-8">
          <Link
            to="/my-orders"
            className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">My Orders</p>
              <p className="text-xs text-muted-foreground">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          <Link
            to="/wishlist"
            className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
              <Heart className="h-5 w-5 text-pink-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Wishlist</p>
              <p className="text-xs text-muted-foreground">Your saved items</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          <Link
            to="/track-order"
            className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Track Order</p>
              <p className="text-xs text-muted-foreground">Check delivery status</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>

        {/* Recent orders preview */}
        {recentOrders.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Recent Orders</h2>
              <Link to="/my-orders" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            <div className="space-y-2">
              {recentOrders.map(order => {
                return (
                  <Link
                    key={order.id}
                    to="/my-orders"
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card hover:bg-muted/20 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {order.order_items?.[0]?.product_image ? (
                        <img src={order.order_items[0].product_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">#{order.order_number || order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{order.status || 'pending'}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{formatOrderCurrency(order.currency, order.total)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Account info */}
        <div className="rounded-xl border border-border/60 bg-card p-5 mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Account Details
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-border/30">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-foreground">{user.email}</span>
            </div>
            {user.user_metadata?.full_name && (
              <div className="flex items-center justify-between py-2 border-b border-border/30">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium text-foreground">{user.user_metadata.full_name}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Member since</span>
              <span className="font-medium text-foreground">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <Button
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          onClick={() => { signOut(); navigate('/'); }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </main>

      <Footer />
    </div>
  );
};

export default Account;
