import { endedYear } from "@/lib/finance";
import type { DepositRecord } from "@/lib/deposit-types";

export const KNOWN_BANK_CODES = ["BOC", "HS", "SC", "HSBC", "ICBC"] as const;

export type ProductTypeId = "TimeDeposit" | "Bond" | "RMB" | "Demand";

export function normalizeBankCode(bank: string): string {
  if (bank.includes("HSBC") || bank.includes("MA HSBC")) return "HSBC";
  if (bank.includes("ICBC")) return "ICBC";
  if (bank.includes("BOC")) return "BOC";
  if (bank.includes("SC")) return "SC";
  if (bank.includes("HS")) return "HS";
  return bank;
}

export function matchesBankFilter(recordBank: string, bankFilter: string): boolean {
  if (bankFilter === "All") return true;
  return normalizeBankCode(recordBank) === normalizeBankCode(bankFilter);
}

export function productTypeId(product: string): ProductTypeId | null {
  if (product.includes("Bond") || product.includes("債券")) return "Bond";
  if (product.includes("Time Deposit") || product.includes("定存")) return "TimeDeposit";
  if (product.includes("Demand") || product.includes("Savings")) return "Demand";
  if (product.includes("RMB")) return "RMB";
  return null;
}

export function matchesProductTypeFilter(product: string, typeFilter: string): boolean {
  if (typeFilter === "All") return true;
  return productTypeId(product) === typeFilter;
}

function scopeByUser(records: DepositRecord[], userFilter: string): DepositRecord[] {
  if (userFilter === "All") return records;
  return records.filter((r) => r.ownerName === userFilter);
}

export function uniqueBankFilters(records: DepositRecord[], userFilter: string): string[] {
  const scoped = scopeByUser(records, userFilter);
  const found = new Set(scoped.map((r) => normalizeBankCode(r.bank)));
  const ordered = KNOWN_BANK_CODES.filter((code) => found.has(code));
  const extra = [...found]
    .filter((code) => !KNOWN_BANK_CODES.includes(code as (typeof KNOWN_BANK_CODES)[number]))
    .sort();
  return ["All", ...ordered, ...extra];
}

export function uniqueYearFilters(records: DepositRecord[], userFilter: string): string[] {
  const scoped = scopeByUser(records, userFilter);
  const years = [
    ...new Set(
      scoped
        .map((r) => endedYear(r.toDate))
        .filter((year): year is number => year !== null),
    ),
  ].sort((a, b) => b - a);
  return ["All", ...years.map(String)];
}

export function uniqueProductTypeFilters(records: DepositRecord[], userFilter: string): ProductTypeId[] {
  const scoped = scopeByUser(records, userFilter);
  const order: ProductTypeId[] = ["TimeDeposit", "Bond", "RMB", "Demand"];
  const found = new Set(
    scoped.map((r) => productTypeId(r.product)).filter((id): id is ProductTypeId => id !== null),
  );
  return order.filter((id) => found.has(id));
}
