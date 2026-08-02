import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with NLA Fabrication — ask about fitment, suggest a part for the pipeline, or follow up on an order.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <section className="blueprint-grid border-b border-line">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Contact</p>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Fitment question, order issue, or a part suggestion — all welcome.
          </h1>
          <p className="mt-4 max-w-xl text-ink-secondary">
            This is a one-person shop, so replies come from the person who actually
            modeled and printed the part. Expect a response within a day or two.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
        <ContactForm />
        <p className="mt-10 border-t border-line pt-6 text-sm text-ink-muted">
          Prefer email?{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:text-accent-bright">
            {CONTACT_EMAIL}
          </a>
        </p>
      </section>
    </>
  );
}
