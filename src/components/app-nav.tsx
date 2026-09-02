"use client";

import Link from "next/link";
import { ExportJpgButton } from "@/components/export-jpg-button";
import { LangToggle } from "@/components/lang-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { useDepositData } from "@/components/deposit-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { excelClearAt } from "@/lib/excel-retention";
import { isAdmin, type AppUser } from "@/lib/users";

function formatNavDate(iso: string, locale: "en" | "zh") {
  return new Date(iso).toLocaleString(locale === "zh" ? "zh-HK" : "en-US");
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
      ? `${t("nav.excelUpdated", { date: formatNavDate(store.syncedAt, locale) })} · ${t("nav.excelClearAt", { date: formatNavDate(clearAt.toISOString(), locale) })}`
      : ready
        ? t("nav.excelNotLoaded")
        : null;

  return (
    <header className="app-topbar">
      <div className="app-topbar-container">
        <div className="app-topbar-primary">
          <div className="app-topbar-brand">
            <Link href="/app" className="flex items-center gap-2 text-decoration-none shrink-0">
              <span className="h-7 w-7 rounded-lg bg-teal-700 flex items-center justify-center text-white font-black text-xs shadow-sm">
                FF
              </span>
              <span className="text-sm font-extrabold tracking-tight text-slate-950 uppercase">
                {t("common.familyFinance")}
              </span>
            </Link>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md shrink-0">
              {user.name}
              {admin ? ` · ${t("common.admin")}` : ""}
            </span>
            {syncLabel && <span className="app-topbar-meta">{syncLabel}</span>}
          </div>

          <div className="app-topbar-actions">
            <ExportJpgButton />
            <LangToggle />
            <SignOutButton />
          </div>
        </div>

        <nav className="no-print app-topbar-nav">
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
