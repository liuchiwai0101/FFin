"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { formatAmount as fmtAmount, formatDate as fmtDate, formatRate } from "@/lib/finance";
import {
  detectLocale,
  LOCALE_STORAGE_KEY,
  translate,
  type Locale,
  type MessageKey,
} from "@/lib/i18n/messages";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  formatAmount: typeof fmtAmount;
  formatDate: typeof fmtDate;
  formatRate: typeof formatRate;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readLocale(): Locale {
  if (typeof window === "undefined") return "en";
  return detectLocale();
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readLocale);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-HK" : "en";
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );

  const formatAmount = useCallback(
    (
      amount: Parameters<typeof fmtAmount>[0],
      currency?: Parameters<typeof fmtAmount>[1],
      options?: Parameters<typeof fmtAmount>[2],
    ) => fmtAmount(amount, currency, { ...options, locale }),
    [locale],
  );

  const formatDate = useCallback(
    (date: Parameters<typeof fmtDate>[0]) => fmtDate(date, locale),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, formatAmount, formatDate, formatRate }),
    [locale, setLocale, t, formatAmount, formatDate],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useT() {
  return useLocale().t;
}
