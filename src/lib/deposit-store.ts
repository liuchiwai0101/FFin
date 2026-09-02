import fs from "fs";
import path from "path";
import type { DepositItem } from "@/lib/excel-parse";
import type { DepositRecord, DepositStore } from "@/lib/deposit-types";

export type { DepositItem, DepositRecord, DepositStore } from "@/lib/deposit-types";

const EMPTY: DepositStore = {
  syncedAt: null,
  activeItems: [],
  historyItems: [],
};

function dataFilePath() {
  return path.join(process.cwd(), "data", "latest.json");
}

function ensureDataDir() {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) {
    fs.mkdirSync(/*turbopackIgnore: true*/ dir, { recursive: true });
  }
}

export function loadDepositStore(): DepositStore {
  const filePath = dataFilePath();
  try {
    if (!fs.existsSync(/*turbopackIgnore: true*/ filePath)) return { ...EMPTY };
    const raw = JSON.parse(fs.readFileSync(/*turbopackIgnore: true*/ filePath, "utf8")) as DepositStore;
    return {
      syncedAt: raw.syncedAt ?? null,
      activeItems: raw.activeItems ?? [],
      historyItems: raw.historyItems ?? [],
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveDepositStore(items: {
  activeItems: DepositItem[];
  historyItems: DepositItem[];
}): DepositStore {
  ensureDataDir();
  const withIds: DepositStore = {
    syncedAt: new Date().toISOString(),
    activeItems: items.activeItems.map((item, i) => ({
      ...item,
      id: item.id || `active-${i}-${item.ownerName}-${item.bank}-${item.amount}`,
    })),
    historyItems: items.historyItems.map((item, i) => ({
      ...item,
      id: item.id || `history-${i}-${item.ownerName}-${item.bank}-${item.amount}`,
    })),
  };
  fs.writeFileSync(/*turbopackIgnore: true*/ dataFilePath(), JSON.stringify(withIds, null, 2), "utf8");
  return withIds;
}

function toRecord(item: DepositItem, fallbackId: string): DepositRecord {
  return {
    ...item,
    id: item.id || fallbackId,
    fromDate: item.fromDate ? new Date(`${item.fromDate}T00:00:00.000Z`) : null,
    toDate: item.toDate ? new Date(`${item.toDate}T00:00:00.000Z`) : null,
  };
}

export function loadDepositRecords(options?: { isCurrent?: boolean }): DepositRecord[] {
  const store = loadDepositStore();
  const active = store.activeItems.map((item, i) => toRecord(item, `active-${i}`));
  const history = store.historyItems.map((item, i) => toRecord(item, `history-${i}`));
  if (options?.isCurrent === true) return active;
  if (options?.isCurrent === false) return history;
  return [...active, ...history];
}

export function upsertDepositRecord(record: DepositItem & { id?: string; isCurrent: boolean }) {
  const store = loadDepositStore();
  const id =
    record.id ||
    `${record.isCurrent ? "active" : "history"}-${Date.now()}-${record.ownerName}-${record.bank}`;
  const item: DepositItem = { ...record, id };

  if (record.isCurrent) {
    store.activeItems = [...store.activeItems.filter((r) => r.id !== id), item];
  } else {
    store.historyItems = [...store.historyItems.filter((r) => r.id !== id), item];
  }
  return saveDepositStore(store);
}

export function deleteDepositById(id: string) {
  const store = loadDepositStore();
  const next = {
    activeItems: store.activeItems.filter((r) => r.id !== id),
    historyItems: store.historyItems.filter((r) => r.id !== id),
  };
  const removed =
    store.activeItems.length + store.historyItems.length !==
    next.activeItems.length + next.historyItems.length;
  if (!removed) throw new Error("Record was not found.");
  return saveDepositStore(next);
}
