import type { Locale } from "@/lib/i18n/messages";

/** Fixed FX used when Excel marks a deposit as USD (e.g. bank `SC(USD)`). */
export const USD_TO_HKD_RATE = 7.78;

export function isUsdLabeled(bank: string, currency?: string | null): boolean {
  if (currency === "USD") return true;
  return /USD/i.test(bank) || /US\$/i.test(bank);
}

/** Strip currency markers like `(USD)` from bank labels after converting to HKD. */
export function stripUsdBankMarker(bank: string): string {
  const cleaned = bank
    .replace(/\s*\(\s*USD\s*\)/gi, "")
    .replace(/\s*\（\s*USD\s*\）/gi, "")
    .replace(/\s+USD\b/gi, "")
    .replace(/\s+US\$/gi, "")
    .trim();
  return cleaned || bank;
}

export function convertUsdToHkd(amount: number, rate = USD_TO_HKD_RATE): number {
  return amount * rate;
}

function intlLocale(locale?: Locale) {
  return locale === "zh" ? "zh-HK" : "en-US";
}

function dateLocale(locale?: Locale) {
  return locale === "zh" ? "zh-HK" : "en-CA";
}

export function formatAmount(
  amount: number | null | undefined,
  currency = "HKD",
  options?: { decimals?: number; compact?: boolean; locale?: Locale }
): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "—";

  const decimals = options?.decimals !== undefined ? options.decimals : 0;

  return new Intl.NumberFormat(intlLocale(options?.locale), {
    style: "currency",
    currency: currency === "RMB" ? "CNY" : currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    notation: options?.compact ? "compact" : "standard",
  }).format(amount);
}

export function formatRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || rate === 0) return "—";
  return (rate * 100).toFixed(2) + "%";
}

export function formatDate(
  date: Date | string | null | undefined,
  locale?: Locale,
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(dateLocale(locale));
}

/** Calendar year of a matured/ended date (`toDate`). */
export function endedYear(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  if (typeof date === "string") {
    const match = date.match(/^(\d{4})/);
    if (match) return Number(match[1]);
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getUTCFullYear();
  }
  return Number.isNaN(date.getTime()) ? null : date.getUTCFullYear();
}

export function formatMoney(minorUnits: number, currency = "HKD") {
  return formatAmount(minorUnits / 100, currency, { decimals: 2 });
}

export function toMinorUnits(value: string | number) {
  const normalized = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(normalized)) throw new Error("Enter a valid amount.");
  return Math.round(normalized * 100);
}

export function monthStart(value = new Date()) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}
