"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { ExportJpgButton } from "@/components/export-jpg-button";
import { LangToggle } from "@/components/lang-toggle";
import { findUserByCredentials, writeSessionUser } from "@/lib/client-auth";
import { useT } from "@/lib/i18n/locale-provider";

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const t = useT();
  const next = params.get("next") || "/app";
  const [error, setError] = useState(params.get("error") === "1");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const user = findUserByCredentials(
      String(form.get("email") ?? ""),
      String(form.get("password") ?? ""),
    );
    if (!user) {
      setError(true);
      return;
    }
    writeSessionUser(user, { accountEntered: String(form.get("email") ?? "") });
    router.replace(next.startsWith("/") ? next : "/app");
  }

  return (
    <main className="auth-page">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ExportJpgButton />
        <LangToggle />
      </div>
      <form onSubmit={onSubmit} className="auth-card">
        <p className="eyebrow">{t("login.eyebrow")}</p>
        <h1>{t("login.title")}</h1>
        <p className="subtitle">{t("login.subtitle")}</p>
        {error && (
          <p className="error" role="alert">
            {t("login.error")}
          </p>
        )}
        <label>
          {t("login.username")}
          <input
            required
            name="email"
            type="text"
            autoComplete="username"
          />
        </label>
        <label>
          {t("login.password")}
          <input
            required
            name="password"
            type="password"
            autoComplete="current-password"
          />
        </label>
        <button className="button w-full">{t("login.submit")}</button>
        <p className="form-note">
          <Link href="/">{t("common.backHome")}</Link>
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
