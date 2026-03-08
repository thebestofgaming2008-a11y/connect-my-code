import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Truck,
  Layers,
  Settings,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Globe,
  CreditCard,
  Image,
  FolderOpen,
} from 'lucide-react';

interface HelpSection {
  id: string;
  icon: React.ElementType;
  title: string;
  items: { q: string; a: string }[];
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    items: [
      { q: "What does the Dashboard show?", a: "The Dashboard is your home screen. It shows today's orders and revenue (in ₹), total customers, low-stock alerts, a revenue chart, and your most recent orders. Use it to get a quick daily overview." },
      { q: "Why does it show ₹ for revenue?", a: "All Razorpay payments are processed in INR (₹). The dashboard shows revenue in the currency it was actually collected in, so the numbers are accurate." },
    ],
  },
  {
    id: 'orders',
    icon: ShoppingCart,
    title: 'Orders',
    items: [
      { q: "How do I manage orders?", a: "Go to Orders. You'll see all orders as a list. Click any order to open its details. Inside the detail view you can change the status, add tracking info, and write internal notes." },
      { q: "How do I change an order's status?", a: "Open the order detail, then use the status dropdown at the top. For dangerous actions like cancelling, you'll get a confirmation prompt to prevent mistakes." },
      { q: "How do I add tracking info?", a: "Open the order, scroll to the Tracking section, type the carrier name and tracking number, then click away. It auto-saves. A tracking email is automatically sent to the customer." },
      { q: "What do the status colors mean?", a: "Yellow = Pending, Blue = Confirmed, Indigo = Processing, Purple = Shipped, Green = Delivered, Red = Cancelled." },
    ],
  },
  {
    id: 'products',
    icon: Package,
    title: 'Products',
    items: [
      { q: "How do I add a product?", a: "Click 'Add Product' at the top of the Products page. Fill in the name (slug auto-generates), set the INR price, upload images, choose a category, set stock, and click Create." },
      { q: "How does pricing work?", a: "You set the INR price. The USD price is auto-calculated using the live exchange rate. Indian customers see ₹, international customers see $. You can turn off auto-convert and set USD manually if needed." },
      { q: "How do I upload images?", a: "In the product form, click the upload area in the Images section. Images are compressed to WebP format automatically. You can also paste an image URL." },
      { q: "How do I delete a product?", a: "On the product list, click the ⋯ menu on the right side of any product, then 'Delete Product'. You'll see a confirmation with the product image and name before it's deleted." },
      { q: "What is a Variant Group?", a: "If you sell the same book in different editions (e.g. hardcover, paperback), give them the same variant group name. They'll be linked on the product page so customers can switch between them." },
      { q: "What does Featured mean?", a: "Featured products appear on the homepage in the 'Featured Products' section. Toggle it on in the product form." },
    ],
  },
  {
    id: 'categories',
    icon: FolderOpen,
    title: 'Categories',
    items: [
      { q: "How do categories work?", a: "Categories organize your products in the shop. Go to Categories to create, rename, reorder, or delete them. Each product can belong to one category." },
    ],
  },
  {
    id: 'coupons',
    icon: Tag,
    title: 'Coupons',
    items: [
      { q: "How do I create a coupon?", a: "Go to Coupons → Create Coupon. Set the code, discount type (percentage, fixed ₹, or fixed $), value, minimum order amounts, and validity dates." },
      { q: "What discount types are available?", a: "Percentage (e.g. 10% off), Fixed INR (e.g. ₹200 off), or Fixed USD (e.g. $5 off). For percentage discounts, you can set a maximum discount cap in ₹." },
    ],
  },
  {
    id: 'shipping',
    icon: Truck,
    title: 'Shipping',
    items: [
      { q: "How does shipping work?", a: "Shipping rates are set in ₹. The base rate applies to all orders. India and Rest of World have separate rates. International orders are handled via WhatsApp." },
    ],
  },
  {
    id: 'homepage',
    icon: Layers,
    title: 'Homepage Sections',
    items: [
      { q: "How do I customize the homepage?", a: "Go to Homepage. You can reorder sections (hero, trust indicators, featured products, categories, reviews, etc.), toggle their visibility, and edit their content." },
      { q: "Can I add custom sections?", a: "Yes. You can add custom banner or custom text sections from the Homepage editor." },
    ],
  },
  {
    id: 'currency',
    icon: Globe,
    title: 'Currency & Pricing',
    items: [
      { q: "How does the dual currency system work?", a: "The site detects the visitor's country automatically. Indian visitors see prices in ₹ (INR), everyone else sees $ (USD). The exchange rate updates automatically every 30 minutes from live APIs." },
      { q: "Do I need to set both INR and USD prices?", a: "No. Just set the INR price. USD is auto-calculated. You can override USD manually if you want specific pricing for international customers." },
      { q: "Where do exchange rates come from?", a: "The site fetches live rates from multiple free APIs (exchangerate-api.com, open.er-api.com, frankfurter.app) with automatic fallback. The current rate and last update time are shown in Settings." },
      { q: "Can customers switch currency manually?", a: "Yes. There's a small globe icon in the header bar that lets customers toggle between INR and USD." },
    ],
  },
  {
    id: 'payments',
    icon: CreditCard,
    title: 'Payments',
    items: [
      { q: "What payment methods are supported?", a: "Razorpay for Indian customers (UPI, cards, net banking, wallets) and WhatsApp ordering for international customers." },
      { q: "How do WhatsApp orders work?", a: "International customers click 'Order via WhatsApp' at checkout. This sends a pre-formatted message with their order details to your WhatsApp number. You handle payment and confirmation manually." },
    ],
  },
  {
    id: 'customers',
    icon: Users,
    title: 'Customers',
    items: [
      { q: "Where can I see customer data?", a: "Go to Customers. You'll see all registered users with their name, email, order count, and total spending. Click a customer to see their order history." },
    ],
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Settings',
    items: [
      { q: "What's in Settings?", a: "Settings shows the current exchange rate info and lets you manually refresh rates. It also shows store configuration." },
    ],
  },
  {
    id: 'whatsapp',
    icon: MessageSquare,
    title: 'WhatsApp Support',
    items: [
      { q: "What is the WhatsApp tab?", a: "This is where you can configure the WhatsApp support number and see the chat widget settings for customer support." },
    ],
  },
  {
    id: 'images',
    icon: Image,
    title: 'Images & Media',
    items: [
      { q: "How are product images handled?", a: "Images are uploaded to Supabase Storage. They're automatically compressed to WebP format (max 1200px) to keep the site fast. You can upload multiple images per product." },
      { q: "What image formats are supported?", a: "JPG, PNG, WebP, and GIF. All are converted to WebP on upload for optimal performance. Max file size is 5MB." },
    ],
  },
];

const AdminHelp = () => {
  const [openSection, setOpenSection] = useState<string | null>('dashboard');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    setOpenSection(prev => prev === id ? null : id);
  };

  const toggleItem = (key: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Help & Guide</h2>
        <p className="text-sm text-gray-500">Everything you need to know about managing your store</p>
      </div>

      <div className="space-y-2">
        {HELP_SECTIONS.map(section => {
          const Icon = section.icon;
          const isOpen = openSection === section.id;
          return (
            <div key={section.id} className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50/50 transition-colors"
              >
                <Icon className="h-4.5 w-4.5 text-gray-400 flex-shrink-0" />
                <span className="flex-1 text-sm font-semibold text-gray-900">{section.title}</span>
                <span className="text-[11px] text-gray-400 mr-2">{section.items.length} topic{section.items.length !== 1 ? 's' : ''}</span>
                {isOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
              </button>
              {isOpen && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {section.items.map((item, idx) => {
                    const key = `${section.id}-${idx}`;
                    const itemOpen = openItems.has(key);
                    return (
                      <div key={key}>
                        <button
                          onClick={() => toggleItem(key)}
                          className="w-full flex items-start gap-3 px-5 py-3 text-left hover:bg-gray-50/30 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-700 flex-1">{item.q}</span>
                          {itemOpen ? <ChevronDown className="h-3.5 w-3.5 text-gray-300 mt-0.5 flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-300 mt-0.5 flex-shrink-0" />}
                        </button>
                        {itemOpen && (
                          <div className="px-5 pb-3 -mt-1">
                            <p className="text-sm text-gray-500 leading-relaxed pl-0">{item.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminHelp;
