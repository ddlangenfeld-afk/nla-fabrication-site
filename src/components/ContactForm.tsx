"use client";

import { useId, useRef, useState } from "react";
import { CONTACT_EMAIL } from "@/lib/site";

type Status = "idle" | "submitting" | "success" | "error" | "not-configured";
type Field = "name" | "email" | "message";
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_MESSAGE = 10;

function validate(values: Values): Errors {
  const errors: Errors = {};

  if (!values.name.trim()) {
    errors.name = "Add a name so there's something to reply to.";
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = "An email address is needed to send a reply.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "That doesn't look like an email address — check for a typo.";
  }

  const message = values.message.trim();
  if (!message) {
    errors.message = "Tell us what you need — a part, a fitment question, an order.";
  } else if (message.length < MIN_MESSAGE) {
    errors.message = `A few more words would help — ${MIN_MESSAGE - message.length} more character${
      MIN_MESSAGE - message.length === 1 ? "" : "s"
    } minimum.`;
  }

  return errors;
}

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [values, setValues] = useState<Values>({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  // A field only starts showing errors once it has been left or submitted —
  // flagging "invalid email" on the first keystroke is hostile.
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const ids = {
    name: useId(),
    email: useId(),
    message: useId(),
  };

  function setField(field: Field, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    // Re-validate as they type, but only for fields already showing an error,
    // so the message clears as soon as it's fixed.
    if (touched[field]) setErrors(validate(next));
  }

  function blurField(field: Field) {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate(values));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const found = validate(values);
    setErrors(found);
    setTouched({ name: true, email: true, message: true });

    if (Object.keys(found).length > 0) {
      // Move focus to the first problem so keyboard and screen-reader users
      // land on it instead of hunting.
      const first = (["name", "email", "message"] as Field[]).find((f) => found[f]);
      if (first) formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(ids[first])}`)?.focus();
      return;
    }

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
        setTouched({});
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
    )}&body=${encodeURIComponent(`Name: ${values.name}\n\n${values.message}`)}`;
    return (
      <div className="border border-line-strong bg-bg-raised p-6" role="status">
        <p className="font-display text-lg font-semibold text-ink">
          The contact form isn&rsquo;t wired up to an inbox yet.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
          No email service is configured on this deployment. Send the message directly
          instead — it&rsquo;ll open your email client with what you wrote already filled
          in.
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

  const fieldClass = (field: Field) =>
    `mt-2 w-full border bg-bg-raised px-4 py-3 text-sm text-ink outline-none transition-colors ${
      errors[field] && touched[field]
        ? "border-error focus:border-error"
        : "border-line focus:border-accent"
    }`;

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Name and email are short fields — pairing them keeps them at a
          sensible width instead of stretching a first name across the column. */}
      <div className="grid gap-5 sm:grid-cols-2">
        {(["name", "email"] as Field[]).map((field) => renderField(field))}
      </div>
      {renderField("message")}

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
        className="w-full bg-accent px-6 py-4 font-medium text-accent-ink transition-all hover:bg-accent-bright active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {status === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );

  function renderField(field: Field) {
        const showError = Boolean(errors[field] && touched[field]);
        const label =
          field === "name" ? "Name" : field === "email" ? "Email" : "Message";

        return (
          <div key={field}>
            <label
              htmlFor={ids[field]}
              className="font-mono text-2xs uppercase tracking-widest text-ink-muted"
            >
              {label}
            </label>

            {field === "message" ? (
              <textarea
                id={ids[field]}
                name={field}
                rows={6}
                value={values[field]}
                onChange={(e) => setField(field, e.target.value)}
                onBlur={() => blurField(field)}
                aria-invalid={showError}
                aria-describedby={showError ? `${ids[field]}-error` : undefined}
                className={`${fieldClass(field)} resize-y`}
              />
            ) : (
              <input
                id={ids[field]}
                name={field}
                type={field === "email" ? "email" : "text"}
                autoComplete={field === "email" ? "email" : "name"}
                value={values[field]}
                onChange={(e) => setField(field, e.target.value)}
                onBlur={() => blurField(field)}
                aria-invalid={showError}
                aria-describedby={showError ? `${ids[field]}-error` : undefined}
                className={fieldClass(field)}
              />
            )}

            {showError && (
              <p id={`${ids[field]}-error`} className="mt-2 text-sm text-error">
                {errors[field]}
              </p>
            )}
          </div>
        );
  }
}
