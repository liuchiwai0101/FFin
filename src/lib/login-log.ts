import type { AppUser, UserRole } from "@/lib/users";

export type LoginEntry = {
  loggedAt: string;
  userId: string;
  username: string;
  name: string;
  role: UserRole;
  accountEntered: string;
  userAgent: string;
  language: string;
  timezone: string;
  pageUrl: string;
};

export type SharedLoginLogPayload = {
  version: 1;
  entries: LoginEntry[];
};

const STORAGE_KEY = "ffin_login_log";
const LEGACY_STORAGE_KEY = "ffin_admin_login_log";
export const MAX_LOGIN_LOG_ENTRIES = 100;
const EMPTY_LOG: LoginEntry[] = [];

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedLog: LoginEntry[] = EMPTY_LOG;

function notify() {
  listeners.forEach((listener) => listener());
}

function invalidateCache() {
  cachedRaw = undefined;
}

function parseLog(raw: string | null): LoginEntry[] {
  if (!raw) return EMPTY_LOG;
  try {
    const parsed = JSON.parse(raw) as LoginEntry[];
    return Array.isArray(parsed) ? parsed : EMPTY_LOG;
  } catch {
    return EMPTY_LOG;
  }
}

function entryKey(entry: LoginEntry): string {
  return `${entry.loggedAt}:${entry.userId}:${entry.accountEntered}`;
}

export function mergeLoginEntries(...groups: LoginEntry[][]): LoginEntry[] {
  const merged = new Map<string, LoginEntry>();
  for (const group of groups) {
    for (const entry of group) {
      merged.set(entryKey(entry), entry);
    }
  }
  return [...merged.values()]
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))
    .slice(0, MAX_LOGIN_LOG_ENTRIES);
}

function persistLog(entries: LoginEntry[]) {
  const serialized = JSON.stringify(entries);
  window.localStorage.setItem(STORAGE_KEY, serialized);
  cachedRaw = serialized;
  cachedLog = entries;
  notify();
}

function migrateLegacyLog() {
  const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacy) return;
  const current = window.localStorage.getItem(STORAGE_KEY);
  if (!current) {
    window.localStorage.setItem(STORAGE_KEY, legacy);
  }
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  invalidateCache();
}

export function subscribeLoginLog(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === LEGACY_STORAGE_KEY || event.key === null) {
      invalidateCache();
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** @deprecated Use subscribeLoginLog */
export const subscribeAdminLoginLog = subscribeLoginLog;

export function readLoginLog(): LoginEntry[] {
  if (typeof window === "undefined") return EMPTY_LOG;
  migrateLegacyLog();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedLog;
  cachedRaw = raw;
  cachedLog = parseLog(raw);
  return cachedLog;
}

/** @deprecated Use readLoginLog */
export const readAdminLoginLog = readLoginLog;

export function clearLoginLog() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  cachedRaw = null;
  cachedLog = EMPTY_LOG;
  notify();
}

/** @deprecated Use clearLoginLog */
export const clearAdminLoginLog = clearLoginLog;

export function recordLogin(user: AppUser, accountEntered: string): LoginEntry {
  if (typeof window === "undefined") {
    throw new Error("recordLogin requires a browser environment");
  }

  const entry: LoginEntry = {
    loggedAt: new Date().toISOString(),
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    accountEntered: accountEntered.trim(),
    userAgent: window.navigator.userAgent,
    language: window.navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    pageUrl: window.location.href,
  };

  const next = mergeLoginEntries([entry], readLoginLog());
  persistLog(next);

  console.info("[FFin login]", {
    loggedAt: entry.loggedAt,
    username: entry.username,
    role: entry.role,
    accountEntered: entry.accountEntered,
    language: entry.language,
    timezone: entry.timezone,
    pageUrl: entry.pageUrl,
  });

  return entry;
}

/** @deprecated Use recordLogin */
export function recordAdminLogin(user: AppUser, accountEntered: string): LoginEntry | null {
  return recordLogin(user, accountEntered);
}

export function applyRemoteLoginLog(remote: LoginEntry[]) {
  if (typeof window === "undefined") return readLoginLog();
  const merged = mergeLoginEntries(readLoginLog(), remote);
  persistLog(merged);
  return merged;
}
