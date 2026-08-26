import { Resend } from "resend";

const from = process.env.EMAIL_FROM ?? "Family Finance <onboarding@resend.dev>";
const appUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

async function deliver(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.info(JSON.stringify({ event: "email_skipped", to, subject, reason: "RESEND_API_KEY is not configured" }));
    return { delivered: false };
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({ from, to, subject, html });
  return { delivered: true };
}

function emailLayout(title: string, body: string, href: string, action: string) {
  return `<main style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a"><h1>${title}</h1><p>${body}</p><p><a href="${href}" style="display:inline-block;background:#0f766e;color:white;padding:12px 18px;border-radius:8px;text-decoration:none">${action}</a></p><p style="color:#64748b;font-size:12px">If you did not request this, you can ignore this email.</p></main>`;
}

export function sendVerificationEmail(email: string, token: string) {
  const href = `${appUrl}/verify/${token}`;
  return deliver(email, "Verify your Family Finance email", emailLayout("Verify your email", "Confirm your email to access your finances.", href, "Verify email"));
}

export function sendPasswordResetEmail(email: string, token: string) {
  const href = `${appUrl}/reset-password/${token}`;
  return deliver(email, "Reset your Family Finance password", emailLayout("Reset your password", "Use this link to choose a new password. It expires in one hour.", href, "Reset password"));
}
