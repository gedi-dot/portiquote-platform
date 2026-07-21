import JsonLd from "@/components/JsonLd";

export type Faq = { q: string; a: string };

// Renders a visible FAQ section AND the matching FAQPage structured data.
//
// This is the highest-value format for AI answer engines: a direct question
// paired with a short, self-contained answer is exactly what gets quoted when
// someone asks an assistant "how much does it cost to import a car to Kenya".
// Keep answers factual, standalone, and under about 60 words.
export default function FaqBlock({
  faqs,
  heading = "Common questions",
}: {
  faqs: Faq[];
  heading?: string;
}) {
  return (
    <section className="mt-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      <h2 className="font-display font-semibold text-2xl">{heading}</h2>
      <div className="mt-5 divide-y divide-ink/10 border-t border-ink/10">
        {faqs.map((f) => (
          <div key={f.q} className="py-5">
            <h3 className="font-display font-semibold text-[16px] text-ink">{f.q}</h3>
            <p className="text-ink/65 text-[15px] mt-1.5 leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
