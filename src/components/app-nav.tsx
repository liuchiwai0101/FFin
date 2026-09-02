"use client";

import Link from "next/link";
import { ExportJpgButton } from "@/components/export-jpg-button";
import { LangToggle } from "@/components/lang-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { useDepositData } from "@/components/deposit-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { excelClearAt } from "@/lib/excel-retention";
import { isAdmin, type AppUser } from "@/lib/users";

function formatNavDate(iso: string, locale: "en" | "zh", compact: boolean) {
  const date = new Date(iso);
  if (compact) {
    return date.toLocaleString(locale === "zh" ? "zh-HK" : "en-US", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleString(locale === "zh" ? "zh-HK" : "en-US");
}

export function AppNav({ user }: { user: AppUser }) {
  const { t, locale } = useLocale();
  const { store, ready } = useDepositData();
  const admin = isAdmin(user);

  const links = [
    { label: t("nav.overview"), href: "/app" },
    { label: t("nav.current"), href: "/app/current" },
    { label: t("nav.history"), href: "/app/history" },
    ...(admin ? [{ label: t("nav.sync"), href: "/app/sync" }] : []),
  ];

  const clearAt = store.syncedAt ? excelClearAt(store.syncedAt) : null;
  const syncLabel =
    ready && store.syncedAt && clearAt
      ? `${t("nav.excelUpdated", { date: formatNavDate(store.syncedAt, locale, true) })} · ${t("nav.excelClearAt", { date: formatNavDate(clearAt.toISOString(), locale, true) })}`
      : ready
        ? t("nav.excelNotLoaded")
        : null;

  return (
    <header className="app-topbar">
      <div className="app-topbar-container">
        <div className="app-topbar-primary">
          <div className="app-topbar-brand">
            <Link href="/app" className="app-topbar-logo">
              <span className="app-topbar-logo-mark">FF</span>
              <span className="app-topbar-logo-text">{t("common.familyFinance")}</span>
            </Link>
            <span className="app-topbar-user">
              {user.name}
              {admin ? ` · ${t("common.admin")}` : ""}
            </span>
          </div>

          <div className="app-topbar-actions">
            <ExportJpgButton />
            <LangToggle />
            <SignOutButton />
          </div>
        </div>

        {syncLabel && <p className="app-topbar-meta">{syncLabel}</p>}

        <nav className="no-print app-topbar-nav" aria-label="Main">
          {links.map(({ label, href }) => (
            <Link key={href} className="top-nav-item" href={href}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
