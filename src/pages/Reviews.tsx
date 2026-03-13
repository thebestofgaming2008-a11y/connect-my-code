import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Instagram, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useSiteSections } from '@/hooks/useSiteSections';

const REVIEW_IMAGES = [
  'Screenshot_20251206_151754_Instagram.jpg',
  'Screenshot_20251206_172234_Instagram.jpg',
  'Screenshot_20251206_172241_Instagram.jpg',
  'Screenshot_20251206_172246_Instagram.jpg',
  'Screenshot_20251206_172250_Instagram.jpg',
  'Screenshot_20251206_172256_Instagram.jpg',
  'Screenshot_20251206_172302_Instagram.jpg',
  'Screenshot_20251206_172307_Instagram.jpg',
  'Screenshot_20251206_172324_Instagram.jpg',
  'Screenshot_20251206_172440_Instagram.jpg',
  'Screenshot_20251206_172445_Instagram.jpg',
  'Screenshot_20251206_172448_Instagram.jpg',
  'Screenshot_20251206_172451_Instagram.jpg',
  'Screenshot_20251206_172455_Instagram.jpg',
  'Screenshot_20251206_172458_Instagram.jpg',
  'Screenshot_20251206_172502_Instagram.jpg',
  'Screenshot_20251206_172507_Instagram.jpg',
  'Screenshot_20251206_172511_Instagram.jpg',
  'Screenshot_20251206_172516_Instagram.jpg',
  'Screenshot_20251206_172520_Instagram.jpg',
  'Screenshot_20251206_172525_Instagram.jpg',
  'Screenshot_20251206_172530_Instagram.jpg',
  'Screenshot_20251206_172533_Instagram.jpg',
  'Screenshot_20251206_172536_Instagram.jpg',
  'Screenshot_20251206_172540_Instagram.jpg',
  'Screenshot_20251206_172544_Instagram.jpg',
  'Screenshot_20251206_172549_Instagram.jpg',
  'Screenshot_20251206_172552_Instagram.jpg',
  'Screenshot_20251206_172555_Instagram.jpg',
  'Screenshot_20251206_172559_Instagram.jpg',
  'Screenshot_20251206_172612_Instagram.jpg',
  'Screenshot_20251206_172617_Instagram.jpg',
  'Screenshot_20251206_172622_Instagram.jpg',
  'Screenshot_20251206_172625_Instagram.jpg',
  'Screenshot_20251206_172629_Instagram.jpg',
  'Screenshot_20251206_172632_Instagram.jpg',
  'Screenshot_20251206_172637_Instagram.jpg',
  'Screenshot_20251206_172640_Instagram.jpg',
  'Screenshot_20251206_172645_Instagram.jpg',
  'Screenshot_20251206_172648_Instagram.jpg',
  'Screenshot_20251206_172653_Instagram.jpg',
  'Screenshot_20251206_172658_Instagram.jpg',
  'Screenshot_20251206_172713_Instagram.jpg',
  'Screenshot_20251206_172717_Instagram.jpg',
  'Screenshot_20251206_172722_Instagram.jpg',
  'Screenshot_20251206_172814_Instagram.jpg',
  'Screenshot_20251206_172817_Instagram.jpg',
  'Screenshot_20251206_172823_Instagram.jpg',
  'Screenshot_20251206_172827_Instagram.jpg',
  'Screenshot_20251206_172838_Instagram.jpg',
  'Screenshot_20251206_172847_Instagram.jpg',
  'Screenshot_20251206_172850_Instagram.jpg',
  'Screenshot_20251206_172854_Instagram.jpg',
  'Screenshot_20251206_172858_Instagram.jpg',
  'Screenshot_20251206_172902_Instagram.jpg',
  'Screenshot_20251206_172906_Instagram.jpg',
  'Screenshot_20251206_172913_Instagram.jpg',
  'Screenshot_20251206_172917_Instagram.jpg',
  'Screenshot_20251206_172923_Instagram.jpg',
  'Screenshot_20251206_172926_Instagram.jpg',
  'Screenshot_20251206_172930_Instagram.jpg',
  'Screenshot_20251206_172938_Instagram.jpg',
  'Screenshot_20251206_172948_Instagram.jpg',
  'Screenshot_20251206_172953_Instagram.jpg',
  'Screenshot_20251206_172957_Instagram.jpg',
];

const INITIAL_COUNT = 12;

const Reviews = () => {
  const [showAll, setShowAll] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const { data: sections } = useSiteSections();
  const reviewSection = sections?.find(s => s.section_key === 'reviews');
  const instagramLink = reviewSection?.content?.instagram_link as string | undefined;

  const visible = showAll ? REVIEW_IMAGES : REVIEW_IMAGES.slice(0, INITIAL_COUNT);

  return (
    <>
      <Helmet>
        <title>Customer Reviews — Abu Hurayrah Essentials</title>
        <meta name="description" content="See what our customers are saying about their orders from Abu Hurayrah Essentials." />
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-philosopher mb-3">Customer Reviews</h1>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              Real feedback from our customers — screenshots from our Instagram stories and messages.
            </p>
          </div>

          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
            {visible.map((img, i) => (
              <button
                key={img}
                onClick={() => setLightboxIdx(i)}
                className="block w-full overflow-hidden rounded-md border border-border/40 hover:border-primary/50 transition-all duration-200 break-inside-avoid"
              >
                <div className="overflow-hidden">
                  <img
                    src={`/images/Extra images/${img}`}
                    alt={`Customer review ${i + 1}`}
                    className="w-full h-auto object-cover"
                    style={{ clipPath: 'inset(6% 0 14% 0)' }}
                    loading="lazy"
                  />
                </div>
              </button>
            ))}
          </div>

          {!showAll && REVIEW_IMAGES.length > INITIAL_COUNT && (
            <div className="text-center mt-8">
              <Button variant="outline" onClick={() => setShowAll(true)} className="gap-2">
                Show All Reviews ({REVIEW_IMAGES.length})
              </Button>
            </div>
          )}

          {instagramLink && (
            <div className="text-center mt-8">
              <a href={instagramLink} target="_blank" rel="noopener noreferrer">
                <Button className="gap-2">
                  <Instagram className="h-4 w-4" />
                  See More on Instagram
                </Button>
              </a>
            </div>
          )}

          {/* Shop CTA — conversion nudge after social proof */}
          <div className="text-center mt-10 py-8 border-t border-border/40">
            <h2 className="text-xl md:text-2xl font-philosopher mb-2">Ready to Start Reading?</h2>
            <p className="text-sm text-muted-foreground mb-4">Browse our full collection of authentic Islamic books</p>
            <Link to="/shop">
              <Button size="lg" className="gap-2">
                Shop Now
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </Link>
          </div>
        </div>

        {lightboxIdx !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxIdx(null)}
          >
            <button
              className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl font-light"
              onClick={() => setLightboxIdx(null)}
            >
              &times;
            </button>
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl font-light px-2"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(Math.max(0, lightboxIdx - 1)); }}
            >
              &#8249;
            </button>
            <img
              src={`/images/Extra images/${REVIEW_IMAGES[lightboxIdx]}`}
              alt={`Review ${lightboxIdx + 1}`}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-md"
              style={{ clipPath: 'inset(6% 0 14% 0)' }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl font-light px-2"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(Math.min(REVIEW_IMAGES.length - 1, lightboxIdx + 1)); }}
            >
              &#8250;
            </button>
            <div className="absolute bottom-4 text-white/60 text-sm">
              {lightboxIdx + 1} / {REVIEW_IMAGES.length}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default Reviews;
