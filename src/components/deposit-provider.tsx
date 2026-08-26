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

function readStorage(): DepositStore {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    return normalizeStore(JSON.parse(raw) as DepositStore);
  } catch {
    return { ...EMPTY };
  }
}

function writeStorage(store: DepositStore) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function DepositProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [store, setStore] = useState<DepositStore>(EMPTY);

  useEffect(() => {
    setStore(readStorage());
    setReady(true);
  }, []);

  const replaceStore = useCallback((next: DepositStore) => {
    const normalized = normalizeStore(next);
    setStore(normalized);
    writeStorage(normalized);
  }, []);

  const clearStore = useCallback(() => {
    setStore({ ...EMPTY });
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const upsertRecord = useCallback((record: DepositItem & { isCurrent: boolean; id?: string }) => {
    setStore((prev) => {
      const id =
        record.id ||
        `${record.isCurrent ? "active" : "history"}-${Date.now()}-${record.ownerName}-${record.bank}`;
      const item: DepositItem = { ...record, id };
      const next: DepositStore = {
        syncedAt: new Date().toISOString(),
        activeItems: record.isCurrent
          ? [...prev.activeItems.filter((r) => r.id !== id), item]
          : prev.activeItems,
        historyItems: !record.isCurrent
          ? [...prev.historyItems.filter((r) => r.id !== id), item]
          : prev.historyItems,
      };
      writeStorage(next);
      return next;
    });
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setStore((prev) => {
      const next: DepositStore = {
        syncedAt: new Date().toISOString(),
        activeItems: prev.activeItems.filter((r) => r.id !== id),
        historyItems: prev.historyItems.filter((r) => r.id !== id),
      };
      writeStorage(next);
      return next;
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
