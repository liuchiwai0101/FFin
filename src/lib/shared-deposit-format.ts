import type { DepositItem } from "@/lib/deposit-types";
import { EXCEL_RETENTION_MS, excelClearAt, isExcelExpired } from "@/lib/excel-retention";
import type { DepositStore } from "@/lib/deposit-types";

export const SHARED_DEPOSIT_VERSION = 1;
export const SHARED_DEPOSIT_FILENAME = "latest.json";

export type SharedDepositPayload = {
  version: typeof SHARED_DEPOSIT_VERSION;
  syncedAt: string | null;
  expiresAt: string | null;
  activeItems: DepositItem[];
  historyItems: DepositItem[];
};

export const EMPTY_SHARED_PAYLOAD: SharedDepositPayload = {
  version: SHARED_DEPOSIT_VERSION,
  syncedAt: null,
  expiresAt: null,
  activeItems: [],
  historyItems: [],
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

export function isSharedDepositPayload(value: unknown): value is SharedDepositPayload {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record.version !== SHARED_DEPOSIT_VERSION) return false;
  if (record.syncedAt !== null && typeof record.syncedAt !== "string") return false;
  if (record.expiresAt !== null && typeof record.expiresAt !== "string") return false;
  if (!Array.isArray(record.activeItems) || !Array.isArray(record.historyItems)) return false;
  return record.activeItems.every(isDepositItem) && record.historyItems.every(isDepositItem);
}

export function createSharedPayload(store: DepositStore): SharedDepositPayload {
  const syncedAt = new Date().toISOString();
  const clearAt = excelClearAt(syncedAt);
  return {
    version: SHARED_DEPOSIT_VERSION,
    syncedAt,
    expiresAt: clearAt ? clearAt.toISOString() : new Date(Date.now() + EXCEL_RETENTION_MS).toISOString(),
    activeItems: store.activeItems,
    historyItems: store.historyItems,
  };
}

export function createEmptySharedPayload(): SharedDepositPayload {
  return { ...EMPTY_SHARED_PAYLOAD };
}

export function isSharedPayloadExpired(payload: SharedDepositPayload, now = Date.now()): boolean {
  if (!payload.syncedAt) return true;
  if (payload.expiresAt) {
    const expires = new Date(payload.expiresAt).getTime();
    if (!Number.isNaN(expires) && now >= expires) return true;
  }
  return isExcelExpired(payload.syncedAt, now);
}

export function payloadToDepositStore(payload: SharedDepositPayload): DepositStore {
  if (isSharedPayloadExpired(payload)) {
    return { syncedAt: null, activeItems: [], historyItems: [] };
  }
  return {
    syncedAt: payload.syncedAt,
    activeItems: payload.activeItems,
    historyItems: payload.historyItems,
  };
}

export function parseSharedDepositJson(raw: string): DepositStore {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { syncedAt: null, activeItems: [], historyItems: [] };
  }

  if (isSharedDepositPayload(parsed)) {
    return payloadToDepositStore(parsed);
  }

  if (parsed && typeof parsed === "object") {
    const legacy = parsed as Record<string, unknown>;
    if (Array.isArray(legacy.activeItems) && Array.isArray(legacy.historyItems)) {
      const syncedAt = typeof legacy.syncedAt === "string" ? legacy.syncedAt : null;
      if (isExcelExpired(syncedAt)) {
        return { syncedAt: null, activeItems: [], historyItems: [] };
      }
      return {
        syncedAt,
        activeItems: legacy.activeItems as DepositItem[],
        historyItems: legacy.historyItems as DepositItem[],
      };
    }
  }

  return { syncedAt: null, activeItems: [], historyItems: [] };
}

export function serializeSharedPayload(payload: SharedDepositPayload): string {
  return `${JSON.stringify(payload, null, 2)}\n`;
}
