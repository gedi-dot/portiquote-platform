import Navbar from "@/components/Navbar";

export const metadata = { title: "Privacy Policy" };

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-display font-semibold text-lg mt-8 mb-2">{children}</h2>
);

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen px-5 py-12">
        <article className="mx-auto max-w-2xl text-[15px] leading-relaxed text-ink/80">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-saffron">
            Legal
          </p>
          <h1 className="font-display font-bold text-3xl mt-1 text-ink">
            Privacy Policy
          </h1>
          <p className="font-mono text-[11px] text-ink/45 mt-2">
            Last updated: 8 July 2026
          </p>

          <H>1. What we collect</H>
          <p>
            Account data: name, email, and password (stored as a hash by our
            authentication provider). Listing data: the company details, services,
            lanes, and contact information forwarders choose to publish. Marketplace
            activity: RFQs, quotes, reviews, and messages you create. Payment metadata:
            for M-Pesa, the phone number you enter, the transaction reference, and the
            receipt number returned by Safaricom; for card payments, the payment
            reference returned by Stripe. We never see or store card numbers, CVVs, or
            M-Pesa PINs — those go directly to Stripe and Safaricom.
          </p>

          <H>2. How we use it</H>
          <p>
            To run the marketplace: showing listings, matching RFQs to forwarders&apos;
            lanes, delivering quotes and messages, and processing membership payments.
            To send transactional email: lead alerts, quote notifications, acceptance
            confirmations, renewal reminders, and replies to your contact messages. We
            do not sell personal data, and we do not send marketing email without a
            separate opt-in.
          </p>

          <H>3. What is public</H>
          <p>
            Published forwarder listings — including the business contact details a
            forwarder adds — are public by design. Reviews are public with the name the
            reviewer provides. Your account email and phone number are never public;
            other signed-in users can see only your display name when you message them.
          </p>

          <H>4. Who processes data for us</H>
          <p>
            We use a small set of processors to run the platform: Supabase (database and
            authentication hosting), Vercel (application hosting), Safaricom Daraja
            (M-Pesa payments), Stripe (card payments), and Resend (transactional email).
            Each receives only what it needs for its function. Data may be processed
            outside your country; our processors maintain industry-standard safeguards.
          </p>

          <H>5. Messages</H>
          <p>
            Messages are private to their participants. Our staff may access message
            content only to investigate fraud, abuse, disputes about platform use, or
            legal requests — not for marketing.
          </p>

          <H>6. Cookies</H>
          <p>
            We use essential cookies to keep you signed in. We do not run third-party
            advertising or tracking cookies.
          </p>

          <H>7. Retention</H>
          <p>
            Account and marketplace data is kept while your account is active.
            Transaction records are retained as required by tax and financial
            regulations. When you close your account, we delete or anonymise personal
            data that we are not legally required to keep.
          </p>

          <H>8. Your rights</H>
          <p>
            Subject to applicable law — including Kenya&apos;s Data Protection Act, 2019
            — you may request access to, correction of, or deletion of your personal
            data, and object to certain processing. Contact us and we will respond
            within a reasonable time. You may also complain to your data protection
            authority; in Kenya, the Office of the Data Protection Commissioner.
          </p>

          <H>9. Children</H>
          <p>
            The platform is a business tool for adults. It is not directed at anyone
            under 18, and we do not knowingly collect their data.
          </p>

          <H>10. Changes</H>
          <p>
            We will announce material changes to this policy on the platform. The
            &quot;last updated&quot; date above always reflects the current version.
          </p>

          <p className="mt-8 text-ink/60">
            Privacy questions or requests? Reach us via the{" "}
            <a href="/contact" className="text-sea hover:underline">
              contact page
            </a>
            .
          </p>
        </article>
      </main>
    </>
  );
}
