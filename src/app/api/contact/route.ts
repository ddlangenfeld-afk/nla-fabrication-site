import { NextResponse } from "next/server";
import { Resend } from "resend";
import { CONTACT_EMAIL } from "@/lib/site";

type ContactBody = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: ContactBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || !EMAIL_RE.test(email) || message.length < 10) {
    return NextResponse.json({ ok: false, reason: "invalid_fields" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // No email service configured on this deployment — the client falls back to a mailto: link.
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 200 });
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL ?? "NLA Fabrication <onboarding@resend.dev>",
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `Website contact form — ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });

    if (error) {
      return NextResponse.json({ ok: false, reason: "send_failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, reason: "send_failed" }, { status: 502 });
  }
}
