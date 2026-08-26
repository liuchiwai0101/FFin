"use client";
import Link from "next/link";
import { useState } from "react";

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const [message, setMessage] = useState("");
  async function submit(form: FormData) {
    form.set("token", params.token);
    const response = await fetch("/api/auth/reset-password", { method: "POST", body: form });
    const data = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Password updated. You can now sign in." : data.error ?? "Unable to reset your password.");
  }
  return <main className="auth-page"><form action={submit} className="auth-card"><p className="eyebrow">Account recovery</p><h1>Choose a new password</h1><label>New password<input required name="password" type="password" minLength={12} autoComplete="new-password" /></label><button className="button w-full">Update password</button>{message && <p className="form-note" role="alert">{message}</p>}<p className="form-note"><Link href="/login">Back to sign in</Link></p></form></main>;
}
