import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items?: BreadcrumbItem[];
    className?: string;
}

const routeLabels: Record<string, string> = {
    shop: "Shop",
    product: "Product",
    cart: "Cart",
    checkout: "Checkout",
    auth: "Sign In",
    admin: "Admin",
    contact: "Contact",
    "my-orders": "My Orders",
    "shipping-policy": "Shipping Policy",
    "privacy-policy": "Privacy Policy",
    terms: "Terms of Service",
    "cancellations-refunds": "Cancellations & Refunds",
    reviews: "Customer Reviews",
};

const Breadcrumbs = ({ items, className = "" }: BreadcrumbsProps) => {
    const location = useLocation();

    // Auto-generate breadcrumbs from URL if items not provided
    const breadcrumbs: BreadcrumbItem[] = items || (() => {
        const paths = location.pathname.split("/").filter(Boolean);
        return paths.map((path, index) => {
            const href = "/" + paths.slice(0, index + 1).join("/");
            const label = routeLabels[path] || path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");
            return {
                label,
                href: index === paths.length - 1 ? undefined : href,
            };
        });
    })();

    if (breadcrumbs.length === 0) return null;

    return (
        <nav aria-label="Breadcrumb" className={`flex items-center text-sm ${className}`}>
            <ol className="flex items-center gap-1">
                <li>
                    <Link
                        to="/"
                        className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                        <Home className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only">Home</span>
                    </Link>
                </li>

                {breadcrumbs.map((item, index) => (
                    <Fragment key={index}>
                        <li>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </li>
                        <li>
                            {item.href ? (
                                <Link
                                    to={item.href}
                                    className="text-muted-foreground hover:text-foreground transition-colors link-underline"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="text-foreground font-medium">{item.label}</span>
                            )}
                        </li>
                    </Fragment>
                ))}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
