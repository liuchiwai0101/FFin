"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/locale-provider";

function getExportRoot(): HTMLElement {
  return (
    document.querySelector<HTMLElement>(".app-main") ??
    document.querySelector<HTMLElement>("main") ??
    document.body
  );
}

function downloadFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `family-finance-${date}.jpg`;
}

export function ExportJpgButton({ className = "" }: { className?: string }) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    if (busy) return;
    setBusy(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const root = getExportRoot();

      const canvas = await html2canvas(root, {
        useCORS: true,
        scale: 2,
        backgroundColor: "#f8fafc",
        logging: false,
        width: root.scrollWidth,
        height: root.scrollHeight,
        windowWidth: root.scrollWidth,
        windowHeight: root.scrollHeight,
        onclone: (doc) => {
          doc.querySelectorAll(".no-print").forEach((el) => {
            (el as HTMLElement).style.display = "none";
          });
        },
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/jpeg", 0.92);
      link.download = downloadFilename();
      link.click();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`no-print inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer disabled:cursor-wait disabled:opacity-60 ${className}`}
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
  );
}
