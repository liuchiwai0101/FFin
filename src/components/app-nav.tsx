"use client";

import Link from "next/link";
import { LangToggle } from "@/components/lang-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { useDepositData } from "@/components/deposit-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { isAdmin, type AppUser } from "@/lib/users";

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

  const syncLabel =
    ready && store.syncedAt
      ? t("nav.excelUpdated", {
          date: new Date(store.syncedAt).toLocaleString(locale === "zh" ? "zh-HK" : "en-US"),
        })
      : ready
        ? t("nav.excelNotLoaded")
        : null;

  return (
    <header className="app-topbar">
      <div className="app-topbar-container">
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/app" className="flex items-center gap-2 text-decoration-none">
            <span className="h-7 w-7 rounded-lg bg-teal-700 flex items-center justify-center text-white font-black text-xs shadow-sm">
              FF
            </span>
            <span className="text-sm font-extrabold tracking-tight text-slate-950 uppercase">
              {t("common.familyFinance")}
            </span>
          </Link>
          <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md">
            {user.name}
            {admin ? ` · ${t("common.admin")}` : ""}
          </span>
          {syncLabel && (
            <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
              {syncLabel}
            </span>
          )}
        </div>

        <nav className="flex items-center flex-wrap gap-1">
          {links.map(({ label, href }) => (
            <Link key={href} className="top-nav-item" href={href}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {syncLabel && (
            <span className="text-[11px] font-medium text-slate-500 sm:hidden">{syncLabel}</span>
          )}
          <LangToggle />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
