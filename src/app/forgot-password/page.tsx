"use client";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  async function submit(form: FormData) { await fetch("/api/auth/forgot-password", { method: "POST", body: form }); setSent(true); }
  return <main className="auth-page"><form action={submit} className="auth-card"><p className="eyebrow">Account recovery</p><h1>Reset your password</h1><p className="subtitle">{sent ? "If an account exists, a reset link has been sent." : "Enter your email and we will send a reset link."}</p>{!sent && <><label>Email<input required name="email" type="email" autoComplete="email" /></label><button className="button w-full">Send reset link</button></>}<p className="form-note"><Link href="/login">Back to sign in</Link></p></form></main>;
}
