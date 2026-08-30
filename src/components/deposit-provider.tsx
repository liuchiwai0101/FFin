"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { DepositItem } from "@/lib/excel-data";
import type { DepositRecord, DepositStore } from "@/lib/deposit-store";

const STORAGE_KEY = "ffin_deposit_store_v1";

const EMPTY: DepositStore = {
  syncedAt: null,
  activeItems: [],
  historyItems: [],
};

type DepositContextValue = {
  ready: boolean;
  store: DepositStore;
  activeRecords: DepositRecord[];
  historyRecords: DepositRecord[];
  replaceStore: (next: DepositStore) => void;
  clearStore: () => void;
  upsertRecord: (record: DepositItem & { isCurrent: boolean; id?: string }) => void;
  deleteRecord: (id: string) => void;
};

const DepositContext = createContext<DepositContextValue | null>(null);

function withIds(items: DepositItem[], prefix: string): DepositItem[] {
  return items.map((item, i) => ({
    ...item,
    id: item.id || `${prefix}-${i}-${item.ownerName}-${item.bank}-${item.amount}`,
  }));
}

function toRecord(item: DepositItem, fallbackId: string): DepositRecord {
  return {
    ...item,
    id: item.id || fallbackId,
    fromDate: item.fromDate ? new Date(`${item.fromDate}T00:00:00.000Z`) : null,
    toDate: item.toDate ? new Date(`${item.toDate}T00:00:00.000Z`) : null,
  };
}

function normalizeStore(raw: DepositStore): DepositStore {
  return {
    syncedAt: raw.syncedAt ?? new Date().toISOString(),
    activeItems: withIds(raw.activeItems ?? [], "active"),
    historyItems: withIds(raw.historyItems ?? [], "history"),
  };
}

const listeners = new Set<() => void>();
let cachedJson: string | null | undefined;
let cachedStore: DepositStore = EMPTY;

function parseStore(raw: string | null): DepositStore {
  if (!raw) return EMPTY;
  try {
    return normalizeStore(JSON.parse(raw) as DepositStore);
  } catch {
    return EMPTY;
  }
}

function getClientSnapshot(): DepositStore {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedJson) return cachedStore;
  cachedJson = raw;
  cachedStore = parseStore(raw);
  return cachedStore;
}

function getServerSnapshot(): DepositStore {
  return EMPTY;
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      cachedJson = undefined;
      onStoreChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function persist(store: DepositStore) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  cachedJson = window.localStorage.getItem(STORAGE_KEY);
  cachedStore = store;
  listeners.forEach((listener) => listener());
}

export function clearUploadedExcelData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  cachedJson = null;
  cachedStore = EMPTY;
  listeners.forEach((listener) => listener());
}

function subscribeNoop() {
  return () => {};
}

export function DepositProvider({ children }: { children: ReactNode }) {
  const store = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const replaceStore = useCallback((next: DepositStore) => {
    persist(normalizeStore(next));
  }, []);

  const clearStore = useCallback(() => {
    clearUploadedExcelData();
  }, []);

  const upsertRecord = useCallback((record: DepositItem & { isCurrent: boolean; id?: string }) => {
    const prev = getClientSnapshot();
    const id =
      record.id ||
      `${record.isCurrent ? "active" : "history"}-${Date.now()}-${record.ownerName}-${record.bank}`;
    const item: DepositItem = { ...record, id };
    persist({
      syncedAt: new Date().toISOString(),
      activeItems: record.isCurrent
        ? [...prev.activeItems.filter((r) => r.id !== id), item]
        : prev.activeItems,
      historyItems: !record.isCurrent
        ? [...prev.historyItems.filter((r) => r.id !== id), item]
        : prev.historyItems,
    });
  }, []);

  const deleteRecord = useCallback((id: string) => {
    const prev = getClientSnapshot();
    persist({
      syncedAt: new Date().toISOString(),
      activeItems: prev.activeItems.filter((r) => r.id !== id),
      historyItems: prev.historyItems.filter((r) => r.id !== id),
    });
  }, []);

  const activeRecords = useMemo(
    () => store.activeItems.map((item, i) => toRecord(item, `active-${i}`)),
    [store.activeItems],
  );
  const historyRecords = useMemo(
    () => store.historyItems.map((item, i) => toRecord(item, `history-${i}`)),
    [store.historyItems],
  );

  const value = useMemo(
    () => ({
      ready,
      store,
      activeRecords,
      historyRecords,
      replaceStore,
      clearStore,
      upsertRecord,
      deleteRecord,
    }),
    [ready, store, activeRecords, historyRecords, replaceStore, clearStore, upsertRecord, deleteRecord],
  );

  return <DepositContext.Provider value={value}>{children}</DepositContext.Provider>;
}

export function useDepositData() {
  const ctx = useContext(DepositContext);
  if (!ctx) throw new Error("useDepositData must be used within DepositProvider");
  return ctx;
}
