"use client";

import { useT } from "@/lib/i18n/locale-provider";

export function SignOutButton() {
  const t = useT();

  return (
    <form action="/api/logout" method="post">
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 cursor-pointer shadow-sm"
      >
        {t("common.signOut")}
      </button>
    </form>
  );
}
