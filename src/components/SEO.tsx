import { Helmet } from 'react-helmet-async';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  breadcrumbs?: BreadcrumbItem[];
  product?: {
    price: number;
    currency: string;
    availability: 'InStock' | 'OutOfStock';
    name: string;
    image?: string;
    description?: string;
    rating?: number;
    reviewCount?: number;
    brand?: string;
    sku?: string;
    isbn?: string;
    author?: string;
    language?: string;
    pages?: number;
  };
}

const SITE_NAME = 'Abu Hurayrah Essentials';
const DEFAULT_DESCRIPTION = 'Your trusted source for authentic Islamic books, clothing, and essentials. Serving Muslims worldwide with quality products.';
const SITE_URL = 'https://abuhurayrahessentials.com';

const SEO = ({ title, description, image, url, type = 'website', breadcrumbs, product }: SEOProps) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const desc = description || DEFAULT_DESCRIPTION;
  const pageUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  const ogImage = image || `${SITE_URL}/og-image.png`;

  // Build breadcrumb JSON-LD
  const breadcrumbSchema = breadcrumbs && breadcrumbs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.url}`,
    })),
  } : null;

  // Build rich product JSON-LD
  const productSchema = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || desc,
    image: product.image ? [product.image] : [ogImage],
    ...(product.brand && {
      brand: {
        '@type': 'Brand',
        name: product.brand,
      },
    }),
    ...(product.sku && { sku: product.sku }),
    ...(product.isbn && { gtin13: product.isbn }),
    ...(product.author && {
      author: {
        '@type': 'Person',
        name: product.author,
      },
    }),
    ...(product.language && { inLanguage: product.language }),
    ...(product.pages && { numberOfPages: product.pages }),
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: product.currency,
      availability: `https://schema.org/${product.availability}`,
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    },
    ...(product.rating && product.reviewCount ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
  } : null;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={pageUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type === 'product' ? 'product' : 'website'} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {/* Product-specific OG tags */}
      {product && (
        <>
          <meta property="product:price:amount" content={product.price.toFixed(2)} />
          <meta property="product:price:currency" content={product.currency} />
          <meta property="product:availability" content={product.availability === 'InStock' ? 'in stock' : 'out of stock'} />
        </>
      )}

      {/* Breadcrumb JSON-LD */}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}

      {/* Product JSON-LD */}
      {productSchema && (
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
