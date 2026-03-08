import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  product?: {
    price: number;
    currency: string;
    availability: 'InStock' | 'OutOfStock';
    name: string;
    image?: string;
    description?: string;
    rating?: number;
    reviewCount?: number;
  };
}

const SITE_NAME = 'Abu Hurayrah Essentials';
const DEFAULT_DESCRIPTION = 'Your trusted source for authentic Islamic books, clothing, and essentials. Serving Muslims worldwide with quality products.';
const SITE_URL = 'https://hurayrahessentials.netlify.app';

const SEO = ({ title, description, image, url, type = 'website', product }: SEOProps) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const desc = description || DEFAULT_DESCRIPTION;
  const pageUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  const ogImage = image || `${SITE_URL}/og-image.png`;

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
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {/* Product structured data (JSON-LD) */}
      {product && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description || desc,
            image: product.image || ogImage,
            offers: {
              '@type': 'Offer',
              price: product.price,
              priceCurrency: product.currency,
              availability: `https://schema.org/${product.availability}`,
            },
            ...(product.rating && product.reviewCount ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: product.rating,
                reviewCount: product.reviewCount,
              },
            } : {}),
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
