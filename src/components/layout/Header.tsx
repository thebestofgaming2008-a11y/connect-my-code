import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Search, User, Menu, X, LogOut, Package, Settings, ChevronDown, Heart, Globe } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrencyContext, POPULAR_CURRENCIES } from "@/contexts/CurrencyContext";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BOOK_SUBCATEGORIES = [
  { name: 'Aqeedah', slug: 'aqeedah' },
  { name: 'Hadith', slug: 'hadith' },
  { name: 'Tafsir', slug: 'tafsir' },
  { name: 'Fiqh', slug: 'fiqh' },
  { name: 'Seerah', slug: 'seerah' },
  { name: 'Purification & Spirituality', slug: 'purification' },
  { name: 'Women', slug: 'women' },
  { name: 'Children', slug: 'children' },
  { name: 'Arabic', slug: 'arabic' },
  { name: 'Urdu', slug: 'urdu' },
];

const Header = () => {
  const navigate = useNavigate();
  const { getItemCount } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const { currency, currencySymbol, isIndia, setCurrency } = useCurrencyContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [booksMenuOpen, setBooksMenuOpen] = useState(false);
  const itemCount = getItemCount();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-background shadow-sm">
      {/* Shipping notice + currency selector */}
      <div className="bg-muted text-muted-foreground text-xs py-1.5 px-4 border-b border-border/30">
        <div className="container mx-auto flex items-center justify-center relative">
          <span className="text-center">
            {isIndia ? 'We ship across India · Fast & reliable delivery' : 'We ship worldwide · International orders via WhatsApp'}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="absolute right-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                aria-label="Change currency"
              >
                <Globe className="h-3 w-3" />
                {currencySymbol} {currency}
                <ChevronDown className="h-2.5 w-2.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 max-h-72 overflow-y-auto">
              {POPULAR_CURRENCIES.map((c) => (
                <DropdownMenuItem
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className={`cursor-pointer text-xs ${currency === c.code ? 'bg-accent font-semibold' : ''}`}
                >
                  <span className="w-10 font-medium">{c.code}</span>
                  <span className="text-muted-foreground">{c.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Logo Row */}
      <div className="border-b border-border/30">
        <div className="container mx-auto px-4 py-2">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            {/* Left */}
            <div className="justify-self-start">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>

            {/* Logo — always true center column */}
            <Link to="/" className="justify-self-center">
              <img
                src="/images/logo versions/Abu Hurayrah LOGO OFFICIAL(2) for real.png"
                alt="Hurayrah Essentials"
                className="h-12 sm:h-14 w-auto object-contain"
              />
            </Link>

            {/* Right */}
            <div className="justify-self-end flex items-center gap-0.5 sm:gap-1">
              {/* User */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium truncate">{user.user_metadata?.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="flex items-center cursor-pointer">
                        <User className="h-4 w-4 mr-2" /> My Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-orders" className="flex items-center cursor-pointer">
                        <Package className="h-4 w-4 mr-2" /> My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/wishlist" className="flex items-center cursor-pointer">
                        <Heart className="h-4 w-4 mr-2" /> Wishlist
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="flex items-center cursor-pointer text-primary">
                            <Settings className="h-4 w-4 mr-2" /> Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                      <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button variant="ghost" size="icon" className="h-9 w-9 sm:w-auto sm:px-3">
                    <User className="h-5 w-5 sm:hidden" />
                    <span className="hidden sm:inline text-sm">Sign In</span>
                  </Button>
                </Link>
              )}

              {/* Cart */}
              <Link to="/cart" className="relative">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-primary text-primary-foreground rounded-full">
                      {itemCount > 99 ? '99+' : itemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>

          {/* Search Bar — below logo */}
          <form onSubmit={handleSearch} className="mt-2 max-w-lg mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title, author, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-9 bg-muted/40 border-border/50 focus:border-primary/50 rounded-full text-sm"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden lg:block border-b border-border/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-8 h-10">
            <Link to="/shop" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              All Products
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors h-full">
                  Books <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/shop?category=Books" className="cursor-pointer">All Books</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {BOOK_SUBCATEGORIES.map((cat) => (
                  <DropdownMenuItem key={cat.slug} asChild>
                    <Link to={`/shop?category=${cat.slug}`} className="cursor-pointer">{cat.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/shop?category=clothing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Clothing
            </Link>
            <Link to="/track-order" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Track Order
            </Link>
            <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border/30 bg-background">
          <nav className="container px-4 py-3 flex flex-col">
            <Link to="/shop" className="py-3 text-sm font-medium border-b border-border/20 hover:text-primary" onClick={closeMobile}>
              All Products
            </Link>

            <div className="border-b border-border/20">
              <button
                onClick={() => setBooksMenuOpen(!booksMenuOpen)}
                className="flex items-center justify-between w-full text-sm font-medium py-3 hover:text-primary"
              >
                Books
                <ChevronDown className={`h-4 w-4 transition-transform ${booksMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {booksMenuOpen && (
                <div className="pl-4 pb-3 space-y-0.5">
                  <Link to="/shop?category=Books" className="block text-sm py-2 text-muted-foreground hover:text-primary" onClick={closeMobile}>All Books</Link>
                  {BOOK_SUBCATEGORIES.map((cat) => (
                    <Link key={cat.slug} to={`/shop?category=${cat.slug}`} className="block text-sm py-2 text-muted-foreground hover:text-primary" onClick={closeMobile}>
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/shop?category=clothing" className="py-3 text-sm font-medium border-b border-border/20 hover:text-primary" onClick={closeMobile}>
              Clothing
            </Link>
            <Link to="/contact" className="py-3 text-sm font-medium border-b border-border/20 hover:text-primary" onClick={closeMobile}>
              Contact
            </Link>

            {/* Account */}
            <div className="pt-4 mt-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Account</p>
              {user ? (
                <div className="space-y-0.5">
                  <Link to="/my-orders" className="block text-sm py-2 hover:text-primary" onClick={closeMobile}>My Orders</Link>
                  <Link to="/wishlist" className="block text-sm py-2 hover:text-primary" onClick={closeMobile}>Wishlist</Link>
                  {isAdmin && (
                    <Link to="/admin" className="block text-sm py-2 text-primary font-medium" onClick={closeMobile}>Admin Dashboard</Link>
                  )}
                  <button onClick={() => { handleSignOut(); closeMobile(); }} className="text-sm py-2 text-destructive text-left w-full">
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link to="/auth" className="block text-sm py-2 hover:text-primary" onClick={closeMobile}>Sign In / Register</Link>
              )}
            </div>

            {/* Policies */}
            <div className="pt-3 mt-3 border-t border-border/20">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <Link to="/shipping-policy" className="text-xs text-muted-foreground hover:text-primary" onClick={closeMobile}>Shipping</Link>
                <Link to="/cancellations-refunds" className="text-xs text-muted-foreground hover:text-primary" onClick={closeMobile}>Returns</Link>
                <Link to="/privacy-policy" className="text-xs text-muted-foreground hover:text-primary" onClick={closeMobile}>Privacy</Link>
                <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary" onClick={closeMobile}>Terms</Link>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
