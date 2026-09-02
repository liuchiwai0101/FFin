"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { LoginLogTable } from "@/components/login-log-table";
import { useLocale } from "@/lib/i18n/locale-provider";
import {
  filterLoginEntries,
  loginLogHref,
  LOGIN_LOG_ROLES,
} from "@/lib/login-log-filters";
import {
  readLoginLog,
  subscribeLoginLog,
  uniqueLoginAccounts,
} from "@/lib/login-log";
import { refreshLoginLogFromGitHub } from "@/lib/login-log-sync";

export default function LoginLogPageClient() {
  const params = useSearchParams();
  const { t, locale } = useLocale();
  const loginLog = useSyncExternalStore(subscribeLoginLog, readLoginLog, () => []);
  const accountFilter = params.get("account") || "All";
  const roleFilter = params.get("role") || "All";
  const filtered = filterLoginEntries(loginLog, { account: accountFilter, role: roleFilter });
  const accounts = ["All", ...uniqueLoginAccounts(loginLog)];

  useEffect(() => {
    void refreshLoginLogFromGitHub();
  }, []);

  const labels = {
    when: t("sync.loginLogWhen"),
    account: t("sync.loginLogAccount"),
    role: t("sync.loginLogRole"),
    device: t("sync.loginLogDevice"),
    admin: t("common.admin"),
    member: t("sync.loginLogMember"),
  };

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString(locale === "zh" ? "zh-HK" : "en-US");
  }

  function roleLabel(role: string) {
    if (role === "ADMIN") return t("common.admin");
    if (role === "MEMBER") return t("sync.loginLogMember");
    return t("sync.loginLogFilterAll");
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-slate-200/80 pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-700">{t("sync.eyebrow")}</span>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">{t("sync.loginLogPageTitle")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("sync.loginLogDesc")}</p>
        {loginLog.length > 0 && (
          <p className="text-[11px] font-semibold text-teal-800 mt-2">
            {t("sync.loginLogShowing", { filtered: filtered.length, total: loginLog.length })}
          </p>
        )}
      </div>

      <div className="card space-y-4 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-16">
            {t("sync.loginLogFilterAccount")}:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {accounts.map((account) => (
              <Link
                key={account}
                href={loginLogHref(account, roleFilter)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  accountFilter === account
                    ? "bg-teal-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {account}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-16">
            {t("sync.loginLogFilterRole")}:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {LOGIN_LOG_ROLES.map((role) => (
              <Link
                key={role}
                href={loginLogHref(accountFilter, role)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  roleFilter === role
                    ? "bg-teal-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {roleLabel(role)}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6 shadow-sm border-slate-200">
        {loginLog.length === 0 ? (
          <p className="text-xs text-slate-500">{t("sync.loginLogEmpty")}</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-slate-500">{t("sync.loginLogNoMatches")}</p>
        ) : (
          <LoginLogTable entries={filtered} formatTime={formatTime} labels={labels} />
        )}
      </div>

      <p className="text-center text-xs text-slate-400">
        <Link href="/app/sync" className="text-teal-700 font-semibold hover:underline">
          {t("sync.loginLogBackSync")}
        </Link>
      </p>
    </div>
  );
}
