"use client";

import { useId, useState } from "react";
import { CONTACT_EMAIL } from "@/lib/site";

type Status = "idle" | "submitting" | "success" | "error" | "not-configured";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: { ok: boolean; reason?: string } = await res.json();

      if (data.ok) {
        setStatus("success");
        setValues({ name: "", email: "", message: "" });
      } else if (data.reason === "not_configured") {
        setStatus("not-configured");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="border border-success/40 bg-success/10 p-6" role="status">
        <p className="font-display text-lg font-semibold text-ink">Message sent.</p>
        <p className="mt-2 text-sm text-ink-secondary">
          Thanks — this shop is one person, so expect a reply within a day or two.
        </p>
      </div>
    );
  }

  if (status === "not-configured") {
    const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      "Message from the site"
    )}&body=${encodeURIComponent(
      `Name: ${values.name}\n\n${values.message}`
    )}`;
    return (
      <div className="border border-line-strong bg-bg-raised p-6" role="status">
        <p className="font-display text-lg font-semibold text-ink">
          The contact form isn&rsquo;t wired up to an inbox yet.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
          No email service is configured on this deployment. Send the message directly
          instead — it&rsquo;ll open your email client with what you wrote already
          filled in.
        </p>
        <a
          href={mailtoHref}
          className="mt-5 inline-block bg-accent px-6 py-3 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-bright"
        >
          Email {CONTACT_EMAIL}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor={nameId} className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
          Name
        </label>
        <input
          id={nameId}
          name="name"
          type="text"
          required
          autoComplete="name"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          className="mt-2 w-full border border-line bg-bg-raised px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent"
        />
      </div>
      <div>
        <label htmlFor={emailId} className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
          Email
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          className="mt-2 w-full border border-line bg-bg-raised px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent"
        />
      </div>
      <div>
        <label htmlFor={messageId} className="font-mono text-2xs uppercase tracking-widest text-ink-muted">
          Message
        </label>
        <textarea
          id={messageId}
          name="message"
          required
          minLength={10}
          rows={6}
          value={values.message}
          onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
          className="mt-2 w-full resize-y border border-line bg-bg-raised px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent"
        />
      </div>

      {status === "error" && (
        <p role="alert" className="border border-error/40 bg-error/10 px-4 py-3 text-sm text-ink">
          Something went wrong sending that. Try again, or email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="link-inline">
            {CONTACT_EMAIL}
          </a>{" "}
          directly.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full bg-accent px-6 py-4 font-medium text-accent-ink transition-all hover:bg-accent-bright disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {status === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
