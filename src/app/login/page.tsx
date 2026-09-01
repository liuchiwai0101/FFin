"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ExportJpgButton } from "@/components/export-jpg-button";
import { LangToggle } from "@/components/lang-toggle";
import { useT } from "@/lib/i18n/locale-provider";

function LoginForm() {
  const params = useSearchParams();
  const t = useT();
  const error = params.get("error");
  const next = params.get("next") || "/app";

  return (
    <main className="auth-page">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ExportJpgButton />
        <LangToggle />
      </div>
      <form action="/api/login" method="post" className="auth-card">
        <p className="eyebrow">{t("login.eyebrow")}</p>
        <h1>{t("login.title")}</h1>
        <p className="subtitle">{t("login.subtitle")}</p>
        {error && (
          <p className="error" role="alert">
            {t("login.error")}
          </p>
        )}
        <input type="hidden" name="next" value={next} />
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
