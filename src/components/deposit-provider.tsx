"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { DepositItem, DepositRecord, DepositStore } from "@/lib/deposit-types";
import { useViewer } from "@/components/user-context";
import { isExcelExpired, msUntilExcelClear } from "@/lib/excel-retention";
import { canViewOwner, isAdmin } from "@/lib/users";

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
    syncedAt: raw.syncedAt ?? null,
    activeItems: withIds(raw.activeItems ?? [], "active"),
    historyItems: withIds(raw.historyItems ?? [], "history"),
  };
}

const listeners = new Set<() => void>();
let cachedJson: string | null | undefined;
let cachedStore: DepositStore = EMPTY;

function parseStore(raw: string | null): { store: DepositStore; expired: boolean } {
  if (!raw) return { store: EMPTY, expired: false };
  try {
    const store = normalizeStore(JSON.parse(raw) as DepositStore);
    if (isExcelExpired(store.syncedAt)) {
      return { store: EMPTY, expired: true };
    }
    return { store, expired: false };
  } catch {
    return { store: EMPTY, expired: false };
  }
}

function getClientSnapshot(): DepositStore {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedJson) return cachedStore;
  const { store, expired } = parseStore(raw);
  if (expired) {
    window.localStorage.removeItem(STORAGE_KEY);
    cachedJson = null;
    cachedStore = EMPTY;
    listeners.forEach((listener) => listener());
    return cachedStore;
  }
  cachedJson = raw;
  cachedStore = store;
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
  const viewer = useViewer();
  const store = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(subscribeNoop, () => true, () => false);

  useEffect(() => {
    if (!store.syncedAt || isExcelExpired(store.syncedAt)) return;
    const remaining = msUntilExcelClear(store.syncedAt);
    if (remaining === null || remaining <= 0) {
      clearUploadedExcelData();
      return;
    }
    const timer = window.setTimeout(() => clearUploadedExcelData(), remaining);
    return () => window.clearTimeout(timer);
  }, [store.syncedAt]);

  const visibleStore = useMemo<DepositStore>(() => {
    if (isAdmin(viewer)) return store;
    return {
      syncedAt: store.syncedAt,
      activeItems: store.activeItems.filter((item) => canViewOwner(viewer, item.ownerName)),
      historyItems: store.historyItems.filter((item) => canViewOwner(viewer, item.ownerName)),
    };
  }, [store, viewer]);

  const replaceStore = useCallback((next: DepositStore) => {
    if (!isAdmin(viewer)) return;
    persist(normalizeStore(next));
  }, [viewer]);

  const clearStore = useCallback(() => {
    if (!isAdmin(viewer)) return;
    clearUploadedExcelData();
  }, [viewer]);

  const upsertRecord = useCallback((record: DepositItem & { isCurrent: boolean; id?: string }) => {
    if (!isAdmin(viewer)) return;
    const prev = getClientSnapshot();
    const ownerName = record.ownerName;
    const id =
      record.id ||
      `${record.isCurrent ? "active" : "history"}-${Date.now()}-${ownerName}-${record.bank}`;
    const item: DepositItem = { ...record, id, ownerName };
    if (!canViewOwner(viewer, ownerName)) return;
    persist({
      syncedAt: prev.syncedAt,
      activeItems: record.isCurrent
        ? [...prev.activeItems.filter((r) => r.id !== id), item]
        : prev.activeItems,
      historyItems: !record.isCurrent
        ? [...prev.historyItems.filter((r) => r.id !== id), item]
        : prev.historyItems,
    });
  }, [viewer]);

  const deleteRecord = useCallback((id: string) => {
    if (!isAdmin(viewer)) return;
    const prev = getClientSnapshot();
    const target = [...prev.activeItems, ...prev.historyItems].find((r) => r.id === id);
    if (!target || !canViewOwner(viewer, target.ownerName)) return;
    persist({
      syncedAt: prev.syncedAt,
      activeItems: prev.activeItems.filter((r) => r.id !== id),
      historyItems: prev.historyItems.filter((r) => r.id !== id),
    });
  }, [viewer]);

  const activeRecords = useMemo(
    () => visibleStore.activeItems.map((item, i) => toRecord(item, `active-${i}`)),
    [visibleStore.activeItems],
  );
  const historyRecords = useMemo(
    () => visibleStore.historyItems.map((item, i) => toRecord(item, `history-${i}`)),
    [visibleStore.historyItems],
  );

  const value = useMemo(
    () => ({
      ready,
      store: visibleStore,
      activeRecords,
      historyRecords,
      replaceStore,
      clearStore,
      upsertRecord,
      deleteRecord,
    }),
    [ready, visibleStore, activeRecords, historyRecords, replaceStore, clearStore, upsertRecord, deleteRecord],
  );

  return <DepositContext.Provider value={value}>{children}</DepositContext.Provider>;
}

export function useDepositData() {
  const ctx = useContext(DepositContext);
  if (!ctx) throw new Error("useDepositData must be used within DepositProvider");
  return ctx;
}
