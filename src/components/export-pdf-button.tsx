"use client";

import { useLocale } from "@/lib/i18n/locale-provider";

export function ExportPdfButton({ className = "" }: { className?: string }) {
  const { t } = useLocale();

  return (
    <button
      type="button"
      className={`no-print inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer ${className}`}
      onClick={() => window.print()}
      title={t("common.exportPdfHint")}
      aria-label={t("common.exportPdf")}
    >
      <svg
        aria-hidden="true"
        className="h-3.5 w-3.5 text-slate-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <polyline points="9 15 12 18 15 15" />
      </svg>
      {t("common.exportPdf")}
    </button>
  );
}
