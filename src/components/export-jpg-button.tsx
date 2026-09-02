"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/locale-provider";
import {
  captureFullPageJpeg,
  downloadDataUrl,
  exportFilename,
  getExportRoot,
} from "@/lib/page-screenshot";

export function ExportJpgButton({ className = "" }: { className?: string }) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const root = getExportRoot();
      const dataUrl = await captureFullPageJpeg(root);

      if (!dataUrl.startsWith("data:image/jpeg")) {
        throw new Error("Failed to create JPEG");
      }

      downloadDataUrl(dataUrl, exportFilename());
    } catch (err) {
      console.error("Export JPG failed:", err);
      setError(t("common.exportFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`no-print flex flex-col items-end gap-0.5 ${className}`}>
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer disabled:cursor-wait disabled:opacity-60"
        onClick={handleExport}
        disabled={busy}
        title={t("common.exportJpgHint")}
        aria-label={t("common.exportJpg")}
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
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        {busy ? t("common.exporting") : t("common.exportJpg")}
      </button>
      {error && (
        <span className="text-[10px] font-semibold text-rose-600 max-w-[10rem] text-right">
          {error}
        </span>
      )}
    </div>
  );
}
