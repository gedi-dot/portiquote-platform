import Navbar from "@/components/Navbar";
import ContactForm from "@/components/ContactForm";

export const metadata = { title: "Contact — FreightPair" };

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen px-5 py-12">
        <div className="mx-auto max-w-lg">
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-tide">Contact</p>
          <h1 className="font-display font-bold text-3xl mt-1">Talk to us</h1>
          <p className="text-ink/60 mt-2 text-sm">
            Questions about listing your company, membership, or a shipment? Send a message —
            we read everything.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
          <p className="font-mono text-[11px] text-ink/45 mt-5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-saffron inline-block" />
            Nairobi, Kenya · Indian Ocean coast · worldwide
          </p>
        </div>
      </main>
    </>
  );
}
