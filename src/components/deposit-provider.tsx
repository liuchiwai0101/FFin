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
import {
  clearSharedDepositStore,
  fetchSharedDepositStore,
  getLastGitHubSyncError,
  isGitHubSyncConfigured,
  pushSharedDepositStore,
} from "@/lib/github-sync";
import { useViewer } from "@/components/user-context";
import { isExcelExpired, msUntilExcelClear } from "@/lib/excel-retention";
import {
  DEMO_DEPOSIT_STORAGE_KEY,
  FAMILY_DEPOSIT_STORAGE_KEY,
  depositStorageKey,
} from "@/lib/storage-keys";
import { canViewOwner, isAdmin, isDemoUser } from "@/lib/users";

let activeStorageKey = FAMILY_DEPOSIT_STORAGE_KEY;
const SYNC_POLL_MS = 30_000;

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
  replaceStore: (next: DepositStore) => Promise<void>;
  clearStore: () => Promise<void>;
  upsertRecord: (record: DepositItem & { isCurrent: boolean; id?: string }) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
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

function parseStore(raw: string | null, skipExpiry = false): { store: DepositStore; expired: boolean } {
  if (!raw) return { store: EMPTY, expired: false };
  try {
    const store = normalizeStore(JSON.parse(raw) as DepositStore);
    if (!skipExpiry && isExcelExpired(store.syncedAt)) {
      return { store: EMPTY, expired: true };
    }
    return { store, expired: false };
  } catch {
    return { store: EMPTY, expired: false };
  }
}

function getClientSnapshot(): DepositStore {
  const raw = window.localStorage.getItem(activeStorageKey);
  if (raw === cachedJson) return cachedStore;
  const skipExpiry = activeStorageKey === DEMO_DEPOSIT_STORAGE_KEY;
  const { store, expired } = parseStore(raw, skipExpiry);
  if (expired) {
    window.localStorage.removeItem(activeStorageKey);
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
    if (
      event.key === activeStorageKey ||
      event.key === FAMILY_DEPOSIT_STORAGE_KEY ||
      event.key === DEMO_DEPOSIT_STORAGE_KEY ||
      event.key === null
    ) {
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

function persistLocal(store: DepositStore) {
  window.localStorage.setItem(activeStorageKey, JSON.stringify(store));
  cachedJson = window.localStorage.getItem(activeStorageKey);
  cachedStore = store;
  listeners.forEach((listener) => listener());
}

export function clearUploadedExcelData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(activeStorageKey);
  cachedJson = null;
  cachedStore = EMPTY;
  listeners.forEach((listener) => listener());
}

function subscribeNoop() {
  return () => {};
}

export function DepositProvider({ children }: { children: ReactNode }) {
  const viewer = useViewer();
  const demoMode = isDemoUser(viewer);
  const storageKey = depositStorageKey(viewer.id);
  const store = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const applyRemoteStore = useCallback((remote: DepositStore | null) => {
    if (!remote) return;
    const normalized = normalizeStore(remote);
    if (!demoMode && isExcelExpired(normalized.syncedAt)) {
      clearUploadedExcelData();
      return;
    }
    const isEmptyRemote =
      !normalized.syncedAt &&
      normalized.activeItems.length === 0 &&
      normalized.historyItems.length === 0;
    if (isEmptyRemote) {
      const local = getClientSnapshot();
      // Demo sample data never expires; keep a healthy local cache if remote is empty.
      if (local.syncedAt && (demoMode || !isExcelExpired(local.syncedAt))) return;
    }
    persistLocal(normalized);
  }, [demoMode]);

  const refreshFromServer = useCallback(async () => {
    const remote = await fetchSharedDepositStore({ demo: demoMode });
    applyRemoteStore(remote);
    return remote;
  }, [applyRemoteStore, demoMode]);

  useEffect(() => {
    if (activeStorageKey === storageKey) return;
    activeStorageKey = storageKey;
    cachedJson = undefined;
    listeners.forEach((listener) => listener());
    void refreshFromServer();
  }, [storageKey, refreshFromServer]);

  useEffect(() => {
    void refreshFromServer();
    if (demoMode) return;
    const timer = window.setInterval(() => {
      void refreshFromServer();
    }, SYNC_POLL_MS);
    return () => window.clearInterval(timer);
  }, [refreshFromServer, demoMode]);

  useEffect(() => {
    if (demoMode || !store.syncedAt || isExcelExpired(store.syncedAt)) return;
    const remaining = msUntilExcelClear(store.syncedAt);
    if (remaining === null || remaining <= 0) {
      clearUploadedExcelData();
      void refreshFromServer();
      return;
    }
    const timer = window.setTimeout(() => {
      clearUploadedExcelData();
      void refreshFromServer();
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [store.syncedAt, refreshFromServer, demoMode]);

  const visibleStore = useMemo<DepositStore>(() => {
    if (isAdmin(viewer)) return store;
    return {
      syncedAt: store.syncedAt,
      activeItems: store.activeItems.filter((item) => canViewOwner(viewer, item.ownerName)),
      historyItems: store.historyItems.filter((item) => canViewOwner(viewer, item.ownerName)),
    };
  }, [store, viewer]);

  const replaceStore = useCallback(
    async (next: DepositStore) => {
      if (!isAdmin(viewer)) return;
      const normalized = normalizeStore(next);
      if (demoMode) {
        persistLocal(normalized);
        return;
      }
      const remote = await pushSharedDepositStore({
        activeItems: normalized.activeItems,
        historyItems: normalized.historyItems,
        syncedAt: normalized.syncedAt,
      });
      if (isGitHubSyncConfigured() && !remote) {
        const detail = getLastGitHubSyncError();
        throw new Error(detail ? `github_sync_failed:${detail.status}:${detail.message}` : "github_sync_failed");
      }
      persistLocal(remote ? normalizeStore(remote) : normalized);
    },
    [viewer, demoMode],
  );

  const clearStore = useCallback(async () => {
    if (!isAdmin(viewer)) return;
    if (!demoMode && isGitHubSyncConfigured()) {
      const ok = await clearSharedDepositStore();
      if (!ok) {
        const detail = getLastGitHubSyncError();
        throw new Error(
          detail ? `github_sync_failed:${detail.status}:${detail.message}` : "github_sync_failed",
        );
      }
    }
    clearUploadedExcelData();
  }, [viewer, demoMode]);

  const upsertRecord = useCallback(
    async (record: DepositItem & { isCurrent: boolean; id?: string }) => {
      if (!isAdmin(viewer)) return;
      const prev = getClientSnapshot();
      const ownerName = record.ownerName;
      const id =
        record.id ||
        `${record.isCurrent ? "active" : "history"}-${Date.now()}-${ownerName}-${record.bank}`;
      const item: DepositItem = { ...record, id, ownerName };
      if (!canViewOwner(viewer, ownerName)) return;
      const next = normalizeStore({
        syncedAt: prev.syncedAt,
        activeItems: record.isCurrent
          ? [...prev.activeItems.filter((r) => r.id !== id), item]
          : prev.activeItems,
        historyItems: !record.isCurrent
          ? [...prev.historyItems.filter((r) => r.id !== id), item]
          : prev.historyItems,
      });
      await replaceStore(next);
    },
    [viewer, replaceStore],
  );

  const deleteRecord = useCallback(
    async (id: string) => {
      if (!isAdmin(viewer)) return;
      const prev = getClientSnapshot();
      const target = [...prev.activeItems, ...prev.historyItems].find((r) => r.id === id);
      if (!target || !canViewOwner(viewer, target.ownerName)) return;
      const next = normalizeStore({
        syncedAt: prev.syncedAt,
        activeItems: prev.activeItems.filter((r) => r.id !== id),
        historyItems: prev.historyItems.filter((r) => r.id !== id),
      });
      await replaceStore(next);
    },
    [viewer, replaceStore],
  );

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
