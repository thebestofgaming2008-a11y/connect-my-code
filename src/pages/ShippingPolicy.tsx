import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import useDocumentTitle from "@/hooks/useDocumentTitle";

const ShippingPolicy = () => {
  useDocumentTitle('Shipping Policy');
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Shipping Policy</h1>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">Processing Time</h2>
              <p className="text-muted-foreground">
                All orders are processed within 1–3 business days. Orders placed on weekends or 
                holidays will be processed on the next business day.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">Delivery Time</h2>
              <p className="text-muted-foreground">
                Estimated delivery times after dispatch vary by location within India. Most orders 
                are delivered within 5–10 business days. Remote or rural areas may require 
                additional time.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">Shipping Costs</h2>
              <p className="text-muted-foreground">
                Shipping charges are calculated based on the delivery location and the weight of 
                your order. The applicable shipping cost will be shown at checkout. We do not 
                offer free shipping at this time.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">Delivery Areas</h2>
              <p className="text-muted-foreground">
                We currently ship across India only. We are working on expanding to international 
                destinations in the future.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">Order Confirmation & Tracking</h2>
              <p className="text-muted-foreground">
                Once your order is confirmed and dispatched, you will receive a tracking number 
                and courier details. You can use this information to track your package on the 
                courier's website or through your account on our site.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">Damaged or Lost Packages</h2>
              <p className="text-muted-foreground">
                If your package arrives damaged or is lost during transit, please contact us 
                immediately through our Contact page. We will work with the courier to resolve 
                the issue and ensure you receive your order.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
              <p className="text-muted-foreground">
                For any shipping-related queries, please reach out to us through our{' '}
                <a href="/contact" className="text-primary hover:underline">Contact page</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ShippingPolicy;
