import { MessageCircle, Mail, Phone, MapPin, Clock, Instagram } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import useDocumentTitle from "@/hooks/useDocumentTitle";

const WHATSAPP_NUMBER = "918491943437";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Assalamu Alaikum, I have a question about")}`;

const Contact = () => {
  useDocumentTitle('Contact Us');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-3">Contact Us</h1>
        <p className="text-center text-muted-foreground mb-10 max-w-lg mx-auto">
          Have questions about your order or need assistance? We're here to help!
        </p>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* WhatsApp — primary CTA */}
          <div className="bg-card border border-border rounded-lg p-8 flex flex-col items-center text-center space-y-5">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold">Chat with us on WhatsApp</h2>
            <p className="text-muted-foreground text-sm">
              Fastest way to reach us. Get instant replies about orders, products, or any questions.
            </p>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="w-full">
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white gap-2" size="lg">
                <MessageCircle className="h-5 w-5" />
                Open WhatsApp
              </Button>
            </a>
            <p className="text-xs text-muted-foreground">+91 84919 43437</p>
          </div>

          {/* Contact info */}
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Email</h3>
                <a href="mailto:abuhurayrahessentials@gmail.com" className="text-muted-foreground hover:text-primary transition-colors">
                  abuhurayrahessentials@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Phone</h3>
                <a href="tel:+918491943437" className="text-muted-foreground hover:text-primary transition-colors">
                  +91 84919 43437
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                <Instagram className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Instagram</h3>
                <a
                  href="https://www.instagram.com/hurayrah_essentials/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  @hurayrah_essentials
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Location</h3>
                <p className="text-muted-foreground">Kursoo Bund Road, Srinagar, Kashmir</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Business Hours</h3>
                <p className="text-muted-foreground">
                  Monday – Saturday: 10:00 AM – 7:00 PM<br />
                  Sunday: Closed
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
