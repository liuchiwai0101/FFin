"use client";

import { useLocale } from "@/lib/i18n/locale-provider";
import type { Locale } from "@/lib/i18n/messages";

const options: Locale[] = ["en", "zh"];

const labels = { en: "En", zh: "中文" } as const;

export function LangToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className={`inline-flex items-center rounded-md border border-slate-200 bg-white p-0.5 text-[11px] font-bold shadow-sm ${className}`}
      role="group"
      aria-label="Language"
    >
      {options.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`rounded px-2 py-1 transition-colors cursor-pointer ${
            locale === code
              ? "bg-teal-700 text-white"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
          aria-pressed={locale === code}
        >
          {labels[code]}
        </button>
      ))}
    </div>
  );
}
