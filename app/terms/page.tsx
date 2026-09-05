import Navbar from "@/components/Navbar";

export const metadata = { title: "Terms of Service" };

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-display font-semibold text-lg mt-8 mb-2">{children}</h2>
);

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen px-5 py-12">
        <article className="mx-auto max-w-2xl text-[15px] leading-relaxed text-ink/80">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-saffron">
            Legal
          </p>
          <h1 className="font-display font-bold text-3xl mt-1 text-ink">
            Terms of Service
          </h1>
          <p className="font-mono text-[11px] text-ink/45 mt-2">
            Last updated: 8 July 2026
          </p>

          <H>1. Who we are and what this platform is</H>
          <p>
            GassDi Caravan (&quot;the platform&quot;, &quot;we&quot;) operates a
            marketplace that connects shippers with freight forwarders. We are a venue:
            we host listings, requests for quotation (RFQs), quotes, reviews, and
            messages. We are not a freight forwarder, carrier, customs broker, or party
            to any contract of carriage. Any agreement to move cargo is made directly
            between a shipper and a forwarder, on their own terms.
          </p>

          <H>2. Accounts</H>
          <p>
            You must provide accurate information when creating an account and keep your
            credentials secure. You are responsible for activity under your account. You
            must be at least 18 years old and legally able to enter contracts. We may
            suspend or close accounts that breach these terms.
          </p>

          <H>3. Forwarder listings</H>
          <p>
            Forwarders are responsible for the accuracy of their listings — company
            details, services, trade lanes, licences, and contact information. Listing a
            company you are not authorised to represent is prohibited. We may edit,
            unpublish, or remove listings that are inaccurate, misleading, or in breach
            of these terms.
          </p>

          <H>4. The verified badge</H>
          <p>
            The ✓ verified badge indicates that we have carried out reasonable checks on
            a company at a point in time. It is not a guarantee of performance,
            solvency, licensing status, or the outcome of any shipment. Shippers must
            carry out their own due diligence before contracting.
          </p>

          <H>5. RFQs, quotes, and shipments</H>
          <p>
            Quotes submitted through the platform are commercial offers made by
            forwarders, not by us. Prices, transit times, validity, inclusions, and
            exclusions are the quoting forwarder&apos;s responsibility. Accepting a
            quote on the platform signals intent; the resulting contract, documentation,
            insurance, and performance of carriage sit entirely between shipper and
            forwarder. We are not liable for loss, damage, delay, demurrage, customs
            penalties, or any other outcome of a shipment.
          </p>

          <H>6. Premium membership and payments</H>
          <p>
            Premium membership is charged per 30-day period (KES 2,500 via M-Pesa, or
            the stated USD price by card). Memberships do not auto-renew and we never
            charge you without a payment you initiate. Renewing while a period is still
            active extends it from the end of the current period. Fees are
            non-refundable once a period has started, except where the law requires
            otherwise. If a period lapses, your listing remains free in the directory
            but lead notifications and quoting are paused.
          </p>

          <H>7. Reviews and messages</H>
          <p>
            Reviews must reflect genuine experiences. Fake, incentivised, or retaliatory
            reviews are prohibited and may be removed. Messages sent through the
            platform are private to the participants, but we may access them to
            investigate fraud, abuse, or breaches of these terms.
          </p>

          <H>8. Prohibited use</H>
          <p>
            You may not use the platform to ship prohibited or sanctioned goods, to
            misdeclare cargo (including dangerous goods), to defraud or harass others,
            to scrape or resell platform data, to send spam, or to interfere with the
            platform&apos;s operation or security.
          </p>

          <H>9. Liability</H>
          <p>
            The platform is provided &quot;as is&quot;. To the fullest extent permitted
            by law, our total liability to you for any claim arising from the platform
            is limited to the membership fees you paid to us in the three months before
            the claim arose. We are not liable for indirect or consequential loss, or
            for the acts or omissions of shippers, forwarders, or payment providers.
          </p>

          <H>10. Changes and termination</H>
          <p>
            We may update these terms; material changes will be announced on the
            platform, and continued use after a change constitutes acceptance. You may
            close your account at any time. Sections that by their nature should
            survive (liability, disputes) survive termination.
          </p>

          <H>11. Governing law</H>
          <p>
            These terms are governed by the laws of the Republic of Kenya, and disputes
            are subject to the jurisdiction of the Kenyan courts, without prejudice to
            mandatory consumer protections in your country of residence.
          </p>

          <p className="mt-8 text-ink/60">
            Questions about these terms? Reach us via the{" "}
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
