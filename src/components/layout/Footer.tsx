import { Link } from "react-router-dom";
import { Instagram, MessageCircle, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 py-12 md:py-16 px-4 bg-card/50">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 mb-10">
          {/* About Section */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3">
              <img src="/images/logo versions/HURAYRAH logo for footer.png" alt="Hurayrah Essentials" className="h-20 w-auto object-contain" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Your trusted source for authentic Islamic books, clothing, and essentials. Serving Muslims across India with quality products.
            </p>
            <div className="flex gap-3">
              <a 
                href="https://www.instagram.com/hurayrah_essentials" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a 
                href="https://wa.me/918491943437" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-green-600 hover:text-white transition-colors"
                aria-label="Contact us on WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-sm font-semibold mb-4 text-foreground">Quick Links</h5>
            <div className="space-y-2.5 text-sm">
              <Link to="/shop" className="block text-muted-foreground hover:text-primary transition">
                All Products
              </Link>
              <Link to="/shop?category=books" className="block text-muted-foreground hover:text-primary transition">
                Books
              </Link>
              <Link to="/shop?category=clothing" className="block text-muted-foreground hover:text-primary transition">
                Clothing
              </Link>
              <Link to="/reviews" className="block text-muted-foreground hover:text-primary transition">
                Reviews
              </Link>
              <Link to="/contact" className="block text-muted-foreground hover:text-primary transition">
                Contact
              </Link>
            </div>
          </div>

          {/* Policies */}
          <div>
            <h5 className="text-sm font-semibold mb-4 text-foreground">Policies</h5>
            <div className="space-y-2.5 text-sm">
              <Link to="/shipping-policy" className="block text-muted-foreground hover:text-primary transition">
                Shipping Policy
              </Link>
              <Link to="/cancellations-refunds" className="block text-muted-foreground hover:text-primary transition">
                Cancellation Policy
              </Link>
              <Link to="/privacy-policy" className="block text-muted-foreground hover:text-primary transition">
                Privacy Policy
              </Link>
              <Link to="/terms" className="block text-muted-foreground hover:text-primary transition">
                Terms of Service
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h5 className="text-sm font-semibold mb-4 text-foreground">Contact Us</h5>
            <div className="space-y-3 text-sm">
              <a 
                href="mailto:abuhurayrahessentials@gmail.com" 
                className="flex items-start gap-2 text-muted-foreground hover:text-primary transition"
              >
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="break-all">abuhurayrahessentials@gmail.com</span>
              </a>
              <a 
                href="tel:+918491943437" 
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition"
              >
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+91 84919 43437</span>
              </a>
              <a 
                href="https://wa.me/918491943437" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-green-600 transition"
              >
                <MessageCircle className="h-4 w-4 flex-shrink-0" />
                <span>WhatsApp Chat</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Abu Hurayrah Essentials. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <Link to="/privacy-policy" className="hover:text-primary transition">Privacy</Link>
            <Link to="/terms" className="hover:text-primary transition">Terms</Link>
            <Link to="/shipping-policy" className="hover:text-primary transition">Shipping</Link>
            <Link to="/contact" className="hover:text-primary transition">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
