import { Link } from "react-router-dom";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const MobileStickyBar = () => {
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      // Show after scrolling past the hero (roughly 300px)
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  if (!isMobile || !isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] safe-area-pb">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">Browse our collection</p>
          <p className="text-xs text-muted-foreground">Free shipping on orders above ₹999</p>
        </div>
        <Link to="/shop" className="flex-shrink-0">
          <Button 
            size="lg" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 rounded-full font-medium shadow-lg flex items-center gap-2"
          >
            <ShoppingBag className="h-4 w-4" />
            Shop Now
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default MobileStickyBar;
