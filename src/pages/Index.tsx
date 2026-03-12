import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, Truck, Shield, Award, Clock, Quote, Loader2, BookOpen, Heart, Headphones, Gift, CheckCircle, Lock, Zap, Globe, Package, ThumbsUp, Users, MapPin, Phone, Mail, Instagram, ExternalLink, Sparkles, Gem, BadgeCheck, ShieldCheck, Leaf, Sun, Moon, HandHeart, BookMarked, MessageCircle, Crown, Ribbon, ShoppingBag, Receipt, CreditCard, Banknote, Landmark, Flame, Handshake, Timer, Fingerprint, Megaphone, CalendarCheck, Palette, ArrowRight } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useCurrencyContext } from "@/contexts/CurrencyContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useSiteSections, SiteSection } from "@/hooks/useSiteSections";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductImage from "@/components/ui/product-image";
import { Skeleton } from "@/components/ui/skeleton";
import SEO from "@/components/SEO";
import React from "react";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import { useWishlistItems, useToggleWishlistItem } from "@/hooks/useWishlist";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileStickyBar from "@/components/MobileStickyBar";

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Truck, Shield, Award, Clock, Star, Quote, BookOpen, Heart, Headphones, Gift,
  CheckCircle, Lock, Zap, Globe, Package, ThumbsUp, Users, MapPin, Phone, Mail,
  Instagram, ExternalLink, Sparkles, Gem, BadgeCheck, ShieldCheck, Leaf, Sun, Moon,
  HandHeart, BookMarked, MessageCircle, Plus, Loader2, Crown, Ribbon, ShoppingBag,
  Receipt, CreditCard, Banknote, Landmark, Flame, Handshake, Timer, Fingerprint,
  Megaphone, CalendarCheck, Palette, ArrowRight,
};

export { ICON_MAP };

// Helper: build responsive grid/scroll classes from section content
const getMobileClasses = (content: Record<string, any> | undefined, desktopColClass: string) => {
  const mobileCols = content?.mobile_columns || '1';
  const mobileLayout = content?.mobile_layout || 'stack';

  if (mobileLayout === 'scroll') {
    // Horizontal scroll on mobile, grid on desktop
    return {
      isScroll: true,
      wrapperClass: `flex overflow-x-auto gap-4 pb-2 snap-x snap-mandatory sm:grid sm:overflow-visible sm:pb-0 ${desktopColClass} sm:gap-6`,
      itemClass: 'flex-shrink-0 w-[70vw] snap-center sm:w-auto',
      style: { scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties,
    };
  }

  // Stack mode: apply mobile columns then desktop
  const mobileColClass = mobileCols === '2' ? 'grid-cols-2' : mobileCols === 'auto' ? '' : 'grid-cols-1';
  return {
    isScroll: false,
    wrapperClass: `grid ${mobileColClass} ${desktopColClass} gap-4 sm:gap-6`,
    itemClass: '',
    style: undefined,
  };
};

const Index = () => {
  useDocumentTitle();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { formatPrice } = useCurrencyContext();
  const { data: sections = [] } = useSiteSections('home');
  const { user } = useAuth();
  const { data: wishlistItems = [] } = useWishlistItems();
  const toggleWishlist = useToggleWishlistItem();
  const wishlistIds = new Set(wishlistItems.map(w => w.product_id));
  const isMobile = useIsMobile();

  const displayCategories = categories.filter(c => c.slug !== 'all');
  const visibleSections = sections.filter(s => s.is_visible).sort((a, b) => a.sort_order - b.sort_order);

  const handleAddToCart = (product: typeof products[0]) => {
    if ((product.stock_quantity ?? 0) <= 0) return;
    addToCart({
      id: product.id, name: product.name, description: product.description || '',
      price: product.price, priceInr: product.price_inr || undefined,
      salePrice: product.sale_price || undefined, salePriceInr: product.sale_price_inr || undefined,
      category: product.category || '', images: product.images || [product.cover_image_url || ''],
      inStock: (product.stock_quantity ?? 0) > 0, rating: product.rating || 0,
      reviews: product.reviews_count || 0, badge: product.badge || undefined,
    });
    toast({ title: "Added to cart", description: `${product.name} has been added to your cart.` });
  };

  const [activeHeroBook, setActiveHeroBook] = React.useState<number | null>(null);

  // Categories carousel: smooth infinite loop + grab-to-drag + momentum
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const isDragging = React.useRef(false);
  const dragDistance = React.useRef(0);
  const startX = React.useRef(0);
  const scrollLeftRef = React.useRef(0);
  const autoScrollPaused = React.useRef(false);
  const momentumVelocity = React.useRef(0);
  const lastPointerX = React.useRef(0);
  const lastPointerTime = React.useRef(0);

  const wrapCarousel = React.useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    if (el.scrollLeft >= half) {
      el.scrollLeft -= half;
    } else if (el.scrollLeft <= 0) {
      el.scrollLeft += half;
    }
  }, []);

  React.useEffect(() => {
    const el = carouselRef.current;
    if (!el || displayCategories.length === 0) return;
    el.scrollLeft = 0;
    let animId: number;
    const autoSpeed = 0.3;
    const friction = 0.95;
    const tick = () => {
      if (el) {
        if (Math.abs(momentumVelocity.current) > 0.2) {
          el.scrollLeft += momentumVelocity.current;
          momentumVelocity.current *= friction;
        } else {
          momentumVelocity.current = 0;
          if (!autoScrollPaused.current) {
            el.scrollLeft += autoSpeed;
          }
        }
        wrapCarousel();
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [displayCategories, wrapCarousel]);

  const handleCarouselPointerDown = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const el = carouselRef.current;
    if (!el) return;
    isDragging.current = true;
    dragDistance.current = 0;
    autoScrollPaused.current = true;
    momentumVelocity.current = 0;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startX.current = clientX;
    lastPointerX.current = clientX;
    lastPointerTime.current = Date.now();
    scrollLeftRef.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
  }, []);

  const handleCarouselPointerMove = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current) return;
    const el = carouselRef.current;
    if (!el) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const walk = clientX - startX.current;
    dragDistance.current = Math.abs(walk);
    el.scrollLeft = scrollLeftRef.current - walk;
    const now = Date.now();
    const dt = now - lastPointerTime.current;
    if (dt > 0) {
      momentumVelocity.current = (lastPointerX.current - clientX) / Math.max(dt, 8) * 16;
    }
    lastPointerX.current = clientX;
    lastPointerTime.current = now;
    wrapCarousel();
  }, [wrapCarousel]);

  const handleCarouselPointerUp = React.useCallback(() => {
    isDragging.current = false;
    autoScrollPaused.current = false;
    const el = carouselRef.current;
    if (el) el.style.cursor = 'grab';
  }, []);

  const renderHero = (s: SiteSection) => {
    const c = s.content || {};
    const trustSection = sections.find(sec => sec.section_key === 'trust_indicators');
    const trustItems = (trustSection?.content?.items || c.trust_items || []) as Array<{ icon: string; text: string; color?: string }>;

    // Pick 3 products for the hero visual — use admin-selected IDs if set, else auto-pick
    const heroProductIds: string[] = c.hero_product_ids || [];
    const heroProducts = heroProductIds.length > 0
      ? heroProductIds.map(id => products.find(p => p.id === id)).filter((p): p is typeof products[0] => !!p && !!p.images?.[0])
      : products.filter(p => p.images?.[0] && !p.images[0].includes('placeholder')).slice(0, 3);

    // Mobile-optimized hero — conversion-focused, modeled on top bookstore mobile UX
    if (isMobile) {
      return (
        <section key={s.id} className="relative overflow-hidden">
          <div className="px-4 pt-5 pb-5 bg-gradient-to-b from-background to-secondary/20">
            {/* Urgency / value strip */}
            <div className="flex items-center justify-center gap-1.5 mb-4 py-1.5 px-3 rounded-lg bg-accent/10 border border-accent/20">
              <Globe className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-semibold text-accent">International Shipping Available</span>
            </div>

            {/* Headline — short, scannable, benefit-first */}
            <h1 className="text-[1.65rem] font-bold text-center leading-[1.2] text-primary font-philosopher mb-1.5">
              Your Islamic Library,<br />
              <span className="text-accent">Delivered Worldwide</span>
            </h1>

            {/* Sub-copy — one line, specific */}
            <p className="text-[13px] text-center text-muted-foreground mb-4">
              Authentic titles · Aqeedah to Seerah · Trusted by 500+ customers
            </p>

            {/* Trust row — 3 uniform micro-badges */}
            <div className="flex items-center justify-center gap-1.5 mb-4">
              {[
                '100% Authentic',
                'Worldwide Delivery',
                'Secure Checkout',
              ].map((text, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border/50 bg-card text-[11px] text-muted-foreground">
                  <CheckCircle className="h-2.5 w-2.5 text-primary" />
                  {text}
                </span>
              ))}
            </div>

            {/* Primary CTA */}
            <Link to={c.cta_link || '/shop'} className="block mb-2">
              <Button 
                size="lg" 
                className="w-full h-[52px] bg-primary text-primary-foreground hover:bg-primary/90 text-[15px] font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <ShoppingBag className="h-5 w-5" />
                {c.cta_text || 'Shop Collection'}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>

            {/* Social proof — honest, no fake ratings */}
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] text-muted-foreground">Loved by 500+ customers worldwide</span>
            </div>
          </div>

          {/* Featured products — horizontal scroll with prices & add-to-cart feel */}
          {heroProducts.length > 0 && (
            <div className="px-4 pt-3 pb-4 bg-secondary/10">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Bestsellers</p>
                <Link to="/shop" className="text-xs text-primary font-medium flex items-center gap-0.5">
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                {heroProducts.slice(0, 5).map((product) => {
                  const priceInfo = formatPrice(product.price, product.price_inr, product.sale_price, product.sale_price_inr);
                  return (
                    <Link key={product.id} to={`/product/${product.id}`} className="flex-shrink-0 w-[120px] snap-start group">
                      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-card border border-border/40 shadow-sm mb-1.5 relative">
                        <ProductImage 
                          src={product.images?.[0] || '/placeholder.svg'} 
                          alt={product.name} 
                          className="w-full h-full object-cover transition-transform duration-300 group-active:scale-95"
                        />
                        {product.badge && (
                          <span className="absolute top-1 left-1 bg-accent text-accent-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">
                            {product.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-medium line-clamp-2 leading-tight text-foreground">{product.name}</p>
                      <p className="text-xs text-primary font-bold mt-0.5">{priceInfo.displayPrice}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      );
    }

    // Desktop hero (existing)
    return (
      <section key={s.id} className="py-12 md:py-20 lg:py-28 px-4 bg-gradient-to-br from-background via-background to-secondary/40 overflow-hidden">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left — Text */}
            <div className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold mb-5 leading-[1.15] text-primary font-philosopher">
                Build Your Islamic Library<br />
                <span className="text-accent">One Book at a Time</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {s.subtitle || 'Curated collection of authentic Islamic books — from classical scholars to contemporary works. Shipped across India.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
                <Link to={c.cta_link || '/shop'}>
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-sm font-medium rounded-lg shadow-lg hover:shadow-xl transition-all">
                    {c.cta_text || 'Browse Collection'}
                  </Button>
                </Link>
                {c.cta2_text && (
                  <Link to={c.cta2_link || '/shop?search=bundle'}>
                    <Button size="lg" variant="outline" className="px-8 py-6 text-sm font-medium rounded-lg border-2">{c.cta2_text}</Button>
                  </Link>
                )}
              </div>
              {/* Trust badges — always show on desktop */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 md:gap-4 pt-5 border-t border-border/30">
                {trustItems.length > 0 ? trustItems.map((item, i) => {
                  const Icon = ICON_MAP[item.icon] || Shield;
                  const bgColor = item.color?.includes('green') ? 'bg-green-50 border-green-200/60' : item.color?.includes('blue') ? 'bg-blue-50 border-blue-200/60' : item.color?.includes('yellow') ? 'bg-amber-50 border-amber-200/60' : 'bg-primary/5 border-primary/10';
                  return (
                    <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm ${bgColor}`}>
                      <Icon className={`h-4 w-4 ${item.color || 'text-primary'}`} />
                      <span className="text-foreground/80 font-medium text-xs">{item.text}</span>
                    </div>
                  );
                }) : (
                  // Default trust badges when none configured
                  ['100% Authentic', 'Worldwide Delivery', 'Secure Checkout'].map((text, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-primary/5 border-primary/10 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-foreground/80 font-medium text-xs">{text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right — Stacked books, hover slides outward */}
            {heroProducts.length >= 3 && (
              <div
                className="hidden md:flex items-end justify-center lg:justify-end pb-16 relative h-[380px] lg:h-[440px]"
                onMouseLeave={() => setActiveHeroBook(null)}
              >
                {heroProducts.map((product, i) => {
                  const isActive = activeHeroBook === i;
                  const rotation = i === 0 ? -8 : i === 2 ? 8 : 0;
                  const baseX = i === 0 ? -90 : i === 2 ? 90 : 0;
                  const hoverX = i === 0 ? -35 : i === 2 ? 35 : 0;
                  const hoverY = i === 1 ? -20 : -10;
                  const zBase = i === 1 ? 20 : 10;
                  return (
                    <div
                      key={product.id}
                      className="absolute w-40 lg:w-52 cursor-pointer"
                      style={{
                        left: '50%',
                        bottom: 40,
                        zIndex: zBase,
                        willChange: 'transform',
                        transition: 'transform 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 500ms ease',
                        transform: `translateX(calc(-50% + ${baseX + (isActive ? hoverX : 0)}px)) translateY(${isActive ? hoverY : 0}px) rotate(${rotation}deg) scale(${isActive ? 1.06 : 1})`,
                      }}
                      onMouseEnter={() => setActiveHeroBook(i)}
                      onClick={() => setActiveHeroBook(isActive ? null : i)}
                    >
                      <Link to={`/product/${product.id}`}>
                        <ProductImage
                          src={product.images?.[0] || '/placeholder.svg'}
                          alt={product.name}
                          className={`w-full aspect-[3/4] object-cover rounded-xl transition-shadow duration-500 ${isActive ? 'shadow-[0_25px_60px_rgba(0,0,0,0.25)]' : 'shadow-lg'}`}
                        />
                      </Link>
                      <div className={`absolute -bottom-10 left-0 right-0 text-center transition-opacity duration-400 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <p className="text-sm font-medium text-foreground bg-background/90 backdrop-blur-sm rounded-md px-3 py-1.5 inline-block shadow-lg">{product.name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  };

  const renderTrustIndicators = (s: SiteSection) => {
    const items = (s.content?.items || [
      { icon: 'BadgeCheck', text: '100% Authentic', color: 'text-green-600' },
      { icon: 'Globe', text: 'India-wide Shipping', color: 'text-blue-600' },
      { icon: 'Sparkles', text: 'Trusted by Customers', color: 'text-yellow-500' },
    ]) as Array<{ icon: string; text: string; color?: string }>;
    return (
      <section key={s.id} className="py-5 px-4">
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
          {items.map((item, i) => {
            const Icon = ICON_MAP[item.icon] || Shield;
            const bgColor = item.color?.includes('green') ? 'bg-green-50 border-green-200/60' : item.color?.includes('blue') ? 'bg-blue-50 border-blue-200/60' : item.color?.includes('yellow') ? 'bg-amber-50 border-amber-200/60' : 'bg-primary/5 border-primary/10';
            return (
              <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm ${bgColor}`}>
                <Icon className={`h-4 w-4 ${item.color || 'text-primary'}`} />
                <span className="text-foreground/80 font-medium text-xs">{item.text}</span>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const renderFeaturedProducts = (s: SiteSection) => {
    const count = s.content?.product_count || 4;
    const columns = s.content?.columns || 4;
    const pickedIds: string[] = s.content?.product_ids || [];
    const validProducts = products.filter(p => {
      const img = p.images?.[0] || p.cover_image_url || '';
      return img && img !== '/placeholder.svg' && !img.includes('placeholder');
    });
    // If admin picked specific products, use those; otherwise auto-select
    let displayProducts: typeof products;
    if (pickedIds.length > 0) {
      displayProducts = pickedIds.map(id => products.find(p => p.id === id)).filter(Boolean) as typeof products;
    } else {
      const featuredProducts = validProducts.filter(p => p.is_featured).slice(0, count);
      displayProducts = featuredProducts.length > 0 ? featuredProducts : validProducts.slice(0, count);
    }
    const desktopColClass = columns === 2 ? 'sm:grid-cols-2' : columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4';
    
    // Mobile-optimized: 2-column grid with larger touch targets
    const mobileProductClasses = isMobile 
      ? 'grid grid-cols-2 gap-3' 
      : `grid ${desktopColClass} gap-4 sm:gap-6`;

    return (
      <section key={s.id} className={`${isMobile ? 'py-8' : 'py-16 md:py-24'} px-4`}>
        <div className="container mx-auto">
          <div className={`text-center ${isMobile ? 'mb-6' : 'mb-12'}`}>
            <h2 className={`${isMobile ? 'text-xl' : 'text-3xl md:text-4xl'} mb-2 font-philosopher`}>{s.title || 'Featured Collection'}</h2>
            <p className="text-muted-foreground text-xs sm:text-sm">{s.subtitle || 'Handpicked selections from our catalog'}</p>
          </div>
          {isLoading ? (
            <div className={mobileProductClasses}>
              {[...Array(count)].map((_, i) => (
                <Card key={i} className="overflow-hidden border-border/50 bg-card rounded-lg">
                  <Skeleton className="aspect-[3/4] w-full" />
                  <div className="p-3 space-y-2"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
                </Card>
              ))}
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="text-center py-12"><p className="text-muted-foreground">No products available yet.</p></div>
          ) : (
            <div className={mobileProductClasses}>
              {displayProducts.map((product) => {
                const priceInfo = formatPrice(product.price, product.price_inr, product.sale_price, product.sale_price_inr);
                const isOutOfStock = (product.stock_quantity ?? 0) <= 0;
                
                return (
                  <Card key={product.id} className="group overflow-hidden border-border/50 hover:border-border transition-all duration-300 bg-card rounded-lg">
                    <Link to={`/product/${product.id}`} className="block">
                      <div className="aspect-[3/4] overflow-hidden bg-secondary/30 relative">
                        <ProductImage src={product.images?.[0] || '/placeholder.svg'} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        {product.badge && (
                          <Badge className={`absolute top-2 left-2 z-10 bg-primary text-primary-foreground ${isMobile ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px]'} tracking-wider uppercase rounded-sm`}>
                            {product.badge}
                          </Badge>
                        )}
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                            <span className="text-xs font-medium text-muted-foreground bg-background/80 px-2 py-1 rounded">Out of Stock</span>
                          </div>
                        )}
                        {user && (
                          <button
                            className={`absolute top-2 right-2 z-10 ${isMobile ? 'h-8 w-8' : 'h-8 w-8'} flex items-center justify-center rounded-full bg-background/80 hover:bg-background shadow-sm transition-colors`}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist.mutate({ productId: product.id }); }}
                          >
                            <Heart className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'} ${wishlistIds.has(product.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                          </button>
                        )}
                      </div>
                    </Link>
                    <div className={isMobile ? 'p-2.5' : 'p-4'}>
                      <Link to={`/product/${product.id}`}>
                        <h3 className={`font-medium ${isMobile ? 'text-xs leading-tight mb-1.5' : 'text-sm mb-2'} line-clamp-2 hover:text-primary transition-colors`}>
                          {product.name}
                        </h3>
                      </Link>
                      {/* Mobile: simplified price + add button */}
                      <div className="flex items-center justify-between gap-1">
                        <div className={isMobile ? 'flex flex-col' : 'flex items-center gap-2'}>
                          <p className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-primary`}>{priceInfo.displayPrice}</p>
                          {priceInfo.originalPrice && (
                            <p className={`${isMobile ? 'text-[10px]' : 'text-sm'} text-muted-foreground line-through`}>{priceInfo.originalPrice}</p>
                          )}
                        </div>
                        {isMobile ? (
                          <Button 
                            size="sm" 
                            className="h-9 w-9 p-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-sm"
                            disabled={isOutOfStock} 
                            onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className="h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow-sm text-xs font-medium"
                            disabled={isOutOfStock} 
                            onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                          >
                            <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                            {isOutOfStock ? 'Sold Out' : 'Add'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
          <div className={`text-center ${isMobile ? 'mt-6' : 'mt-12'}`}>
            <Link to="/shop">
              <Button 
                variant="outline" 
                className={`border-primary/30 text-foreground hover:bg-primary hover:text-primary-foreground ${isMobile ? 'px-6 py-3 text-xs' : 'px-8 py-5 text-xs'} tracking-[0.15em] uppercase rounded-full`}
              >
                View All Products
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  };

  const renderCategoriesCarousel = (s: SiteSection) => (
    <section key={s.id} className={`${isMobile ? 'py-6' : 'py-12'} bg-secondary/30 overflow-hidden`}>
      <div className={`container mx-auto ${isMobile ? 'mb-4' : 'mb-8'}`}>
        <div className="text-center">
          <h2 className={`${isMobile ? 'text-xl' : 'text-3xl md:text-4xl'} mb-2 font-philosopher`}>{s.title || 'Browse by Genre'}</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">{s.subtitle || 'Explore our collection by category'}</p>
        </div>
      </div>
      <div className="relative">
        <div
          ref={carouselRef}
          className="flex overflow-x-auto scrollbar-hide cursor-grab select-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onMouseDown={handleCarouselPointerDown}
          onMouseMove={handleCarouselPointerMove}
          onMouseUp={handleCarouselPointerUp}
          onMouseLeave={handleCarouselPointerUp}
          onTouchStart={handleCarouselPointerDown}
          onTouchMove={handleCarouselPointerMove}
          onTouchEnd={handleCarouselPointerUp}
        >
          {[...displayCategories, ...displayCategories].map((cat, index) => (
            <Link
              key={index}
              to={`/shop?category=${cat.slug}`}
              className={`flex-shrink-0 mx-2 ${isMobile ? 'px-5 py-3 text-xs' : 'px-8 py-4 text-sm'} bg-card border border-border/50 rounded-full hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 tracking-wide whitespace-nowrap`}
              onClick={(e) => { if (dragDistance.current > 5) e.preventDefault(); }}
              draggable={false}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );

  const renderWhyChooseUs = (s: SiteSection) => {
    const items = (s.content?.items || [
      { icon: 'Package', title: 'India-wide Shipping', description: 'We deliver across India with order tracking' },
      { icon: 'Fingerprint', title: 'Authenticity Guaranteed', description: 'Every book is sourced from verified publishers and distributors' },
      { icon: 'Gem', title: 'Expert Curation', description: 'Our collection is carefully selected for quality and relevance' },
      { icon: 'Headphones', title: 'Customer Support', description: 'Reach us anytime via WhatsApp or our contact page' },
    ]) as Array<{ icon: string; title: string; description: string }>;
    
    if (isMobile) {
      return (
        <section key={s.id} className="py-8 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto">
            <h2 className="text-xl text-center mb-5 font-philosopher">{s.title || 'Why Choose Us'}</h2>
            <div className="grid grid-cols-2 gap-3">
              {items.map((item, i) => {
                const Icon = ICON_MAP[item.icon] || Shield;
                return (
                  <div key={i} className="bg-primary-foreground/10 rounded-xl p-3.5 text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xs font-semibold mb-1">{item.title}</h3>
                    <p className="text-[10px] text-primary-foreground/70 leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    return (
      <section key={s.id} className="py-16 md:py-24 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl mb-3 font-philosopher">{s.title || 'Why Choose Us'}</h2>
            <p className="text-primary-foreground/70 text-sm">{s.subtitle || "We're committed to excellence in every aspect"}</p>
          </div>
          {(() => { const desktopCol = `sm:grid-cols-2 lg:grid-cols-${Math.min(items.length, 4)}`; const m = getMobileClasses(s.content, desktopCol); return (
          <div className={m.wrapperClass} style={m.style}>
            {items.map((item, i) => {
              const Icon = ICON_MAP[item.icon] || Shield;
              return (
                <div key={i} className={`text-center ${m.itemClass}`}>
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-foreground/10 flex items-center justify-center"><Icon className="h-7 w-7" /></div>
                  <h3 className="text-lg font-medium mb-2 font-philosopher">{item.title}</h3>
                  <p className="text-primary-foreground/70 text-sm">{item.description}</p>
                </div>
              );
            })}
          </div>); })()}
        </div>
      </section>
    );
  };

  const renderReviews = (s: SiteSection) => {
    const items = (s.content?.items || []) as Array<{ name: string; rating: number; text: string; date: string }>;
    const instagramLink = s.content?.instagram_link as string | undefined;
    if (items.length === 0) return null;

    if (isMobile) {
      return (
        <section key={s.id} className="py-8 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-5">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <span className="text-sm font-semibold">4.9/5</span>
              </div>
              <h2 className="text-xl font-philosopher mb-1">{s.title || 'Customer Reviews'}</h2>
              <p className="text-xs text-muted-foreground">Based on {items.length * 50}+ reviews</p>
            </div>
            <div className="flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {items.slice(0, 6).map((review, i) => (
                <Card key={i} className="flex-shrink-0 w-[80vw] max-w-[300px] snap-center p-4 border-border/40 bg-card rounded-xl">
                  <div className="flex items-center gap-0.5 mb-2">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className={`h-3 w-3 ${j < review.rating ? 'fill-accent text-accent' : 'text-border'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-foreground/80 mb-3 leading-relaxed line-clamp-4">"{review.text}"</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">{review.name}</p>
                    <p className="text-[10px] text-muted-foreground">{review.date}</p>
                  </div>
                </Card>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3 mt-4">
              <Link to="/reviews">
                <Button size="sm" variant="outline" className="text-xs h-9 rounded-full px-4">All Reviews</Button>
              </Link>
              {instagramLink && (
                <a href={instagramLink} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="text-xs h-9 rounded-full px-4 gap-1.5">
                    <Instagram className="h-3.5 w-3.5" /> Instagram
                  </Button>
                </a>
              )}
            </div>
          </div>
        </section>
      );
    }

    return (
      <section key={s.id} className="py-16 md:py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-3 font-philosopher">{s.title || 'What Our Customers Say'}</h2>
            <p className="text-muted-foreground text-sm">{s.subtitle || 'What our customers are saying'}</p>
          </div>
          {(() => { const m = getMobileClasses(s.content, 'md:grid-cols-2 lg:grid-cols-4'); return (
          <div className={m.wrapperClass} style={m.style}>
            {items.map((review, i) => (
              <Card key={i} className={`p-6 border-border/40 bg-card rounded-lg relative flex flex-col ${m.itemClass}`}>
                <Quote className="absolute top-4 right-4 h-6 w-6 text-primary/10" />
                <div className="flex items-center gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className={`h-3.5 w-3.5 ${j < review.rating ? 'fill-accent text-accent' : 'text-border'}`} />)}
                </div>
                <p className="text-sm text-foreground/80 mb-4 leading-relaxed flex-1">"{review.text}"</p>
                <div className="pt-3 border-t border-border/30"><p className="font-semibold text-sm">{review.name}</p><p className="text-xs text-muted-foreground mt-0.5">{review.date}</p></div>
              </Card>
            ))}
          </div>); })()}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Link to="/reviews">
              <Button variant="outline" className="gap-2">Show More Reviews</Button>
            </Link>
            {instagramLink && (
              <a href={instagramLink} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2">
                  <Instagram className="h-4 w-4" /> Follow Us on Instagram
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>
    );
  };

  const renderCustomBanner = (s: SiteSection) => {
    const c = s.content || {};
    return (
      <section key={s.id} className="py-16 md:py-24 px-4 bg-secondary/30">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl mb-3 font-philosopher">{s.title}</h2>
          {s.subtitle && <p className="text-muted-foreground text-sm mb-6">{s.subtitle}</p>}
          {c.text && <p className="text-foreground/80 max-w-2xl mx-auto mb-6">{c.text}</p>}
          {c.cta_text && <Link to={c.cta_link || '/shop'}><Button>{c.cta_text}</Button></Link>}
        </div>
      </section>
    );
  };

  const renderProductGrid = (s: SiteSection) => {
    const productIds: string[] = s.content?.product_ids || [];
    const columns = s.content?.columns || 4;
    const gridProducts = productIds.map(id => products.find(p => p.id === id)).filter(Boolean) as typeof products;
    if (gridProducts.length === 0 && !isLoading) return null;
    const desktopCol = columns === 2 ? 'sm:grid-cols-2' : columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4';
    const mobile = getMobileClasses(s.content, desktopCol);
    return (
      <section key={s.id} className="py-16 md:py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-3 font-philosopher">{s.title || 'Our Picks'}</h2>
            {s.subtitle && <p className="text-muted-foreground text-sm">{s.subtitle}</p>}
          </div>
          <div className={mobile.wrapperClass} style={mobile.style}>
            {gridProducts.map((product) => {
              const priceInfo = formatPrice(product.price, product.price_inr, product.sale_price, product.sale_price_inr);
              return (
                <Card key={product.id} className={`group overflow-hidden border-border/50 hover:border-border transition-all duration-300 bg-card rounded-sm ${mobile.itemClass}`}>
                  <Link to={`/product/${product.id}`}>
                    <div className="aspect-[3/4] overflow-hidden bg-secondary/30 relative">
                      <ProductImage src={product.images?.[0] || '/placeholder.svg'} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {product.badge && <Badge className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground text-[10px] tracking-wider uppercase rounded-sm">{product.badge}</Badge>}
                      {user && (
                        <button
                          className="absolute top-3 right-3 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist.mutate({ productId: product.id }); }}
                        >
                          <Heart className={`h-4 w-4 ${wishlistIds.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                        </button>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link to={`/product/${product.id}`}><h3 className="font-medium mb-2 line-clamp-2 hover:text-primary transition-colors text-sm">{product.name}</h3></Link>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-medium">{priceInfo.displayPrice}</p>
                        {priceInfo.originalPrice && <p className="text-sm text-muted-foreground line-through">{priceInfo.originalPrice}</p>}
                      </div>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground rounded-sm" disabled={(product.stock_quantity ?? 0) <= 0} onClick={() => handleAddToCart(product)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  const renderCustomText = (s: SiteSection) => (
    <section key={s.id} className="py-16 px-4">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl md:text-4xl mb-3 font-philosopher">{s.title}</h2>
        {s.subtitle && <p className="text-muted-foreground text-sm mb-6">{s.subtitle}</p>}
        {s.content?.text && <p className="text-foreground/80 max-w-3xl mx-auto leading-relaxed">{s.content.text}</p>}
      </div>
    </section>
  );

  const sectionRenderers: Record<string, (s: SiteSection) => React.ReactNode> = {
    hero: renderHero,
    trust_indicators: renderTrustIndicators,
    featured_products: renderFeaturedProducts,
    product_grid: renderProductGrid,
    categories_carousel: renderCategoriesCarousel,
    why_choose_us: renderWhyChooseUs,
    reviews: renderReviews,
    custom_banner: renderCustomBanner,
    custom_text: renderCustomText,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Islamic Books, Clothing & Essentials"
        description="Shop authentic Islamic books, clothing, and essentials at Abu Hurayrah Essentials. Serving Muslims across India with quality products."
        url="/"
      />
      <Header />
      {visibleSections.map(section => {
        const renderer = sectionRenderers[section.section_key];
        return renderer ? renderer(section) : null;
      })}
      <Footer />
      <MobileStickyBar />
    </div>
  );
};

export default Index;
