import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import useDocumentTitle from "@/hooks/useDocumentTitle";

const Terms = () => {
  useDocumentTitle('Terms and Conditions');
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Terms and Conditions</h1>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <p className="text-muted-foreground">
              Last updated: February 2026
            </p>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p className="text-muted-foreground">
                Welcome to Abu Hurayrah Essentials. By accessing and using our website, you agree 
                to be bound by these Terms and Conditions. Please read them carefully before making 
                any purchase.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">2. Products and Pricing</h2>
              <p className="text-muted-foreground">
                All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes. 
                We reserve the right to change prices at any time without prior notice. Product 
                availability is subject to stock.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">3. Orders and Payment</h2>
              <p className="text-muted-foreground">
                By placing an order, you confirm that you are legally capable of entering into 
                binding contracts. All payments are processed securely through our payment partner 
                Razorpay. We accept UPI, credit/debit cards, net banking, and wallets.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">4. Shipping and Delivery</h2>
              <p className="text-muted-foreground">
                Please refer to our Shipping Policy for detailed information about shipping methods, 
                delivery times, and costs. Delivery times are estimates and may vary based on your 
                location.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">5. Returns and Refunds</h2>
              <p className="text-muted-foreground">
                We accept returns within 7 days of delivery for damaged or defective products. 
                Books must be returned in their original condition. Refunds will be processed 
                within 5-7 business days after we receive the returned item.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">6. Cancellation Policy</h2>
              <p className="text-muted-foreground">
                Orders can be cancelled before they are shipped. Once shipped, cancellation requests 
                will be treated as returns. Refunds for cancelled orders will be processed within 
                5-7 business days.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">7. Intellectual Property</h2>
              <p className="text-muted-foreground">
                All content on this website, including images, text, and logos, is protected by 
                copyright laws. You may not reproduce, distribute, or use any content without 
                our written permission.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">8. Privacy</h2>
              <p className="text-muted-foreground">
                We are committed to protecting your privacy. Please refer to our Privacy Policy 
                for information on how we collect, use, and protect your personal data.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                We are not liable for any indirect, incidental, or consequential damages arising 
                from your use of our website or products. Our maximum liability is limited to the 
                amount paid for the product.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">10. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms and Conditions are governed by the laws of India. Any disputes shall 
                be subject to the exclusive jurisdiction of the courts in Kashmir, India.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">11. Contact Information</h2>
              <p className="text-muted-foreground">
                For any questions regarding these Terms and Conditions, please contact us 
                through our <a href="/contact" className="text-primary hover:underline">Contact page</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
