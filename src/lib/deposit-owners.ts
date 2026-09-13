import type { DepositStore } from "@/lib/deposit-types";

export function ownerNamesFromStore(store: DepositStore): string[] {
  const names = new Set<string>();
  for (const item of store.activeItems) names.add(item.ownerName);
  for (const item of store.historyItems) names.add(item.ownerName);
  return [...names].sort();
}

export function initOwnerTotals(ownerNames: string[]): Record<string, number> {
  return Object.fromEntries(ownerNames.map((name) => [name, 0]));
}
