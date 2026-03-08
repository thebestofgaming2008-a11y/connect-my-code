import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingCart,
  Users,
  MessageSquare,
  Settings,
  Loader2,
  Layers,
  Tag,
  Truck,
  Menu,
  X,
  Store,
  HelpCircle,
} from 'lucide-react';
import useDocumentTitle from '@/hooks/useDocumentTitle';

const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('@/components/admin/AdminProducts'));
const AdminCategories = lazy(() => import('@/components/admin/AdminCategories'));
const AdminOrders = lazy(() => import('@/components/admin/AdminOrders'));
const AdminCustomers = lazy(() => import('@/components/admin/AdminCustomers'));
const AdminSupport = lazy(() => import('@/components/admin/AdminSupport'));
const AdminSettings = lazy(() => import('@/components/admin/AdminSettings'));
const AdminSections = lazy(() => import('@/components/admin/AdminSections'));
const AdminCoupons = lazy(() => import('@/components/admin/AdminCoupons'));
const AdminShipping = lazy(() => import('@/components/admin/AdminShipping'));
const AdminHelp = lazy(() => import('@/components/admin/AdminHelp'));

interface NavItem {
  key: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: '',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { key: 'orders', label: 'Orders', icon: ShoppingCart },
      { key: 'products', label: 'Products', icon: Package },
      { key: 'customers', label: 'Customers', icon: Users },
    ],
  },
  {
    title: 'Manage',
    items: [
      { key: 'categories', label: 'Categories', icon: FolderOpen },
      { key: 'coupons', label: 'Coupons', icon: Tag },
      { key: 'shipping', label: 'Shipping', icon: Truck },
      { key: 'sections', label: 'Homepage', icon: Layers },
    ],
  },
  {
    title: 'Other',
    items: [
      { key: 'support', label: 'WhatsApp', icon: MessageSquare },
      { key: 'settings', label: 'Settings', icon: Settings },
      { key: 'help', label: 'Help & Guide', icon: HelpCircle },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items);
const MOBILE_NAV = ALL_NAV_ITEMS.slice(0, 4);

const SidebarNav = ({ activeTab, onSwitch, onClose }: { activeTab: string; onSwitch: (key: string) => void; onClose?: () => void }) => (
  <>
    <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100">
      <Link to="/" className="flex items-center gap-2" onClick={onClose}>
        <img
          src="/images/logo versions/HURAYRAH logo for white background.png"
          alt="Abu Hurayrah"
          className="h-12 w-auto"
        />
      </Link>
      {onClose && (
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 md:hidden">
          <X className="h-5 w-5 text-gray-400" />
        </button>
      )}
    </div>
    <nav className="flex-1 overflow-y-auto py-4 px-3">
      {NAV_GROUPS.map((group, gi) => (
        <div key={gi} className={gi > 0 ? 'mt-6' : ''}>
          {group.title && (
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
              {group.title}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map(item => (
              <button
                key={item.key}
                onClick={() => onSwitch(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  activeTab === item.key
                    ? 'bg-amber-50 text-amber-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`h-[18px] w-[18px] flex-shrink-0 ${
                  activeTab === item.key ? 'text-amber-700' : 'text-gray-400'
                }`} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
    <div className="p-3 border-t border-gray-100">
      <Link
        to="/"
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
        onClick={onClose}
      >
        <Store className="h-[18px] w-[18px] text-gray-400" />
        Back to Store
      </Link>
    </div>
  </>
);

const Admin = () => {
  useDocumentTitle('Admin Dashboard');
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const accessGranted = useRef(false);

  if (isAdmin && user) accessGranted.current = true;

  useEffect(() => {
    if (!authLoading && !accessGranted.current && (!user || !isAdmin)) {
      toast({ title: "Access Denied", description: "You don't have permission to access this page.", variant: "destructive" });
      navigate('/');
    }
  }, [authLoading]);

  const switchTab = (key: string) => {
    setActiveTab(key);
    setSidebarOpen(false);
    window.scrollTo({ top: 0 });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
      </div>
    );
  }

  if (!isAdmin && !accessGranted.current) return null;

  const activeItem = ALL_NAV_ITEMS.find(i => i.key === activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboard onNavigate={switchTab} />;
      case 'orders': return <AdminOrders />;
      case 'products': return <AdminProducts />;
      case 'coupons': return <AdminCoupons />;
      case 'customers': return <AdminCustomers />;
      case 'categories': return <AdminCategories />;
      case 'shipping': return <AdminShipping />;
      case 'sections': return <AdminSections />;
      case 'support': return <AdminSupport />;
      case 'settings': return <AdminSettings />;
      case 'help': return <AdminHelp />;
      default: return <AdminDashboard onNavigate={switchTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Desktop Sidebar — fixed left */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[240px] flex-col bg-white border-r border-gray-200/80 z-40">
        <SidebarNav activeTab={activeTab} onSwitch={switchTab} />
      </aside>

      {/* Main content area — offset by sidebar on desktop */}
      <div className="md:ml-[240px] flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-200/80 h-14 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {activeItem?.label || 'Dashboard'}
            </h1>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-amber-700" /></div>}>
            {renderContent()}
          </Suspense>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200">
        <div className="flex items-stretch">
          {MOBILE_NAV.map(item => (
            <button
              key={item.key}
              onClick={() => switchTab(item.key)}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors ${
                activeTab === item.key ? 'text-amber-700' : 'text-gray-400'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
          <button
            onClick={() => setSidebarOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium ${
              !MOBILE_NAV.some(i => i.key === activeTab) ? 'text-amber-700' : 'text-gray-400'
            }`}
          >
            <Menu className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>

      {/* Mobile slide-out sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-white flex flex-col shadow-2xl">
            <SidebarNav activeTab={activeTab} onSwitch={switchTab} onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}
    </div>
  );
};

export default Admin;
