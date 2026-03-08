import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, BookOpen } from "lucide-react";
import Header from "@/components/layout/Header";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import Footer from "@/components/layout/Footer";

const NotFound = () => {
  useDocumentTitle('Page Not Found');
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) console.warn("404: Non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="text-center animate-fade-in max-w-lg">
          {/* Decorative Element */}
          <div className="mb-8">
            <div className="relative inline-block">
              <BookOpen className="h-24 w-24 text-primary/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl font-bold text-primary font-philosopher">
                  404
                </span>
              </div>
            </div>
          </div>

          {/* Message */}
          <h1 className="text-3xl md:text-4xl font-bold mb-4 font-philosopher">
            Page Not Found
          </h1>
          <p className="text-muted-foreground mb-8 text-lg">
            The page you're looking for doesn't exist or has been moved.
            Perhaps the knowledge you seek is elsewhere.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="btn-hover">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="btn-hover">
              <Link to="/shop">
                <Search className="h-4 w-4 mr-2" />
                Browse Books
              </Link>
            </Button>
          </div>

          {/* Back Link */}
          <div className="mt-8">
            <button
              onClick={() => window.history.back()}
              className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go back to previous page
            </button>
          </div>

          {/* Path Info */}
          <p className="mt-8 text-xs text-muted-foreground">
            Requested path: <code className="bg-muted px-2 py-1 rounded">{location.pathname}</code>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
