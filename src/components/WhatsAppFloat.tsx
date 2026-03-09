import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const WHATSAPP_URL = 'https://wa.me/918491943437?text=' + encodeURIComponent('Assalamu Alaikum, I have a question about');

const WhatsAppFloat = () => {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  if (pathname.startsWith('/admin')) return null;

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className={`fixed z-40 flex items-center justify-center rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 hover:scale-105 transition-all duration-300 hover:shadow-xl ${
        isMobile
          ? 'bottom-20 right-4 h-11 w-11'
          : 'bottom-6 right-6 h-12 gap-2 px-4'
      }`}
    >
      <MessageCircle className="h-5 w-5 flex-shrink-0" />
      {!isMobile && <span className="text-sm font-medium whitespace-nowrap">Chat with us</span>}
    </a>
  );
};

export default WhatsAppFloat;
