"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState("");
  async function submit(formData: FormData) {
    setError("");
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      callbackUrl: "/app",
      redirect: false,
    });
    if (result?.error) setError("That email or password was not recognized.");
    else window.location.assign(result?.url ?? "/app");
  }
  return (
    <main className="auth-page">
      <form action={submit} className="auth-card">
        <p className="eyebrow">Family finance</p>
        <h1>Welcome back</h1>
        <p className="subtitle">Sign in to your private financial dashboard.</p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <label>
          Account / Email
          <input
            required
            name="email"
            type="text"
            autoComplete="username"
            placeholder="e.g. Vin"
          />
        </label>
        <label>
          Password
          <input
            required
            name="password"
            type="password"
            autoComplete="current-password"
          />
        </label>
        <button className="button w-full">Sign in</button>
        <p className="form-note">
          <Link href="/forgot-password">Forgot password?</Link>
        </p>
      </form>
    </main>
  );
}
