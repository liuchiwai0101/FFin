export function formatAmount(
  amount: number | null | undefined,
  currency = "HKD",
  options?: { decimals?: number; compact?: boolean }
): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "—";

  const decimals = options?.decimals !== undefined ? options.decimals : 0; // Default to whole numbers for clean readability

  return new Intl.NumberFormat("en-US", {
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

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-CA"); // YYYY-MM-DD
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
