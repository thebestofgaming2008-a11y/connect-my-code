import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import useDocumentTitle from "@/hooks/useDocumentTitle";

const CancellationsRefunds = () => {
  useDocumentTitle('Cancellations & Refunds');
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 text-primary">Cancellations & Refunds</h1>
          
          <div className="space-y-8 text-foreground/90">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Order Cancellation</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Orders can be cancelled within 24 hours of placement. Once an order has been 
                shipped, it cannot be cancelled but may be returned according to our return policy.
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Contact us immediately if you wish to cancel an order</li>
                <li>Provide your order number and reason for cancellation</li>
                <li>Cancelled orders will be refunded within 5-7 business days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Return Policy</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We accept returns within 14 days of delivery for items in their original condition.
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Items must be unused and in original packaging</li>
                <li>Books must not have any writing, highlights, or damage</li>
                <li>Customer is responsible for return shipping costs</li>
                <li>Items on sale or clearance are final sale</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Refund Process</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Once we receive your returned item, we will inspect it and notify you of the 
                approval or rejection of your refund.
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Approved refunds will be processed within 5-7 business days</li>
                <li>Refunds will be credited to your original payment method</li>
                <li>Shipping costs are non-refundable</li>
                <li>Partial refunds may be given for items not in original condition</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Damaged or Defective Items</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you receive a damaged or defective item, please contact us within 48 hours 
                of delivery with photos of the damage. We will arrange a replacement or full 
                refund including shipping costs at no charge to you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">How to Request a Refund</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To initiate a return or refund request:
              </p>
              <ol className="list-decimal list-inside text-muted-foreground space-y-2 ml-4">
                <li>Contact us via our contact page or email</li>
                <li>Provide your order number and reason for return</li>
                <li>Wait for return authorization and shipping instructions</li>
                <li>Ship the item back using a trackable shipping method</li>
                <li>Provide us with the tracking number</li>
              </ol>
            </section>

            <section className="border-t border-border pt-8">
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CancellationsRefunds;