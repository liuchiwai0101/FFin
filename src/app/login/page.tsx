"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const params = useSearchParams();
  const error = params.get("error");
  const next = params.get("next") || "/app";

  return (
    <main className="auth-page">
      <form action="/api/login" method="post" className="auth-card">
        <p className="eyebrow">Family finance</p>
        <h1>Welcome back</h1>
        <p className="subtitle">Sign in with your family account. Default password is your username plus 123.</p>
        {error && (
          <p className="error" role="alert">
            That account or password was not recognized.
          </p>
        )}
        <input type="hidden" name="next" value={next} />
        <label>
          Username
          <input
            required
            name="email"
            type="text"
            autoComplete="username"
            placeholder="Vin, MA, Miki, or BABA"
          />
        </label>
        <label>
          Password
          <input
            required
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Username + 123"
          />
        </label>
        <button className="button w-full">Sign in</button>
        <p className="form-note text-slate-500">
          Example: <strong>Vin</strong> / <strong>Vin123</strong> (admin, can upload Excel)
        </p>
        <p className="form-note">
          <Link href="/">Back to home</Link>
        </p>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="auth-page"><div className="auth-card">Loading…</div></main>}>
      <LoginForm />
    </Suspense>
  );
}
