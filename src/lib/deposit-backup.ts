import type { DepositItem, DepositStore } from "@/lib/deposit-types";

export const BACKUP_VERSION = 1;
export const BACKUP_FILENAME = "ffin-data-backup.json";

export type DepositBackup = {
  version: number;
  exportedAt: string;
  store: DepositStore;
};

function isDepositItem(value: unknown): value is DepositItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.ownerName === "string" &&
    typeof item.bank === "string" &&
    typeof item.product === "string" &&
    typeof item.amount === "number"
  );
}

function isDepositStore(value: unknown): value is DepositStore {
  if (!value || typeof value !== "object") return false;
  const store = value as Record<string, unknown>;
  if (store.syncedAt !== null && typeof store.syncedAt !== "string") return false;
  if (!Array.isArray(store.activeItems) || !Array.isArray(store.historyItems)) return false;
  return store.activeItems.every(isDepositItem) && store.historyItems.every(isDepositItem);
}

export function parseDepositBackup(raw: string): DepositStore {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("invalid_json");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("invalid_shape");
  }

  const record = parsed as Record<string, unknown>;
  if (isDepositStore(record)) {
    return record;
  }

  if (isDepositStore(record.store)) {
    return record.store;
  }

  throw new Error("invalid_shape");
}

export function createDepositBackup(store: DepositStore): DepositBackup {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    store,
  };
}

export function downloadDepositBackup(store: DepositStore) {
  const backup = createDepositBackup(store);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = BACKUP_FILENAME;
  anchor.click();
  URL.revokeObjectURL(url);
}
