"use client";

import Link from "next/link";
import { LangToggle } from "@/components/lang-toggle";
import { useT } from "@/lib/i18n/locale-provider";

export default function Home() {
  const t = useT();

  return (
    <main className="landing">
      <nav>
        <span className="brand">{t("common.familyFinance")}</span>
        <div className="flex items-center gap-3">
          <LangToggle />
          <Link href="/login">{t("common.signIn")}</Link>
        </div>
      </nav>
      <section className="hero">
        <p className="eyebrow">{t("landing.eyebrow")}</p>
        <h1>{t("landing.title")}</h1>
        <p className="hero-copy">{t("landing.copy")}</p>
        <div className="flex gap-3">
          <Link className="button" href="/login">
            {t("landing.cta")}
          </Link>
        </div>
      </section>
      <section className="feature-grid">
        <div>
          <strong>{t("landing.excelTitle")}</strong>
          <p>{t("landing.excelDesc")}</p>
        </div>
        <div>
          <strong>{t("landing.noDbTitle")}</strong>
          <p>{t("landing.noDbDesc")}</p>
        </div>
      </section>
    </main>
  );
}
