import { isAdmin, type AppUser } from "@/lib/users";

export type AdminLoginEntry = {
  loggedAt: string;
  userId: string;
  username: string;
  name: string;
  accountEntered: string;
  userAgent: string;
  language: string;
  timezone: string;
  pageUrl: string;
};

const STORAGE_KEY = "ffin_admin_login_log";
const MAX_ENTRIES = 50;
const EMPTY_LOG: AdminLoginEntry[] = [];

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedLog: AdminLoginEntry[] = EMPTY_LOG;

function notify() {
  listeners.forEach((listener) => listener());
}

function invalidateCache() {
  cachedRaw = undefined;
}

function parseLog(raw: string | null): AdminLoginEntry[] {
  if (!raw) return EMPTY_LOG;
  try {
    const parsed = JSON.parse(raw) as AdminLoginEntry[];
    return Array.isArray(parsed) ? parsed : EMPTY_LOG;
  } catch {
    return EMPTY_LOG;
  }
}

function persistLog(entries: AdminLoginEntry[]) {
  const serialized = JSON.stringify(entries);
  window.localStorage.setItem(STORAGE_KEY, serialized);
  cachedRaw = serialized;
  cachedLog = entries;
  notify();
}

export function subscribeAdminLoginLog(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
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

export function readAdminLoginLog(): AdminLoginEntry[] {
  if (typeof window === "undefined") return EMPTY_LOG;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedLog;
  cachedRaw = raw;
  cachedLog = parseLog(raw);
  return cachedLog;
}

export function clearAdminLoginLog() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  cachedRaw = null;
  cachedLog = EMPTY_LOG;
  notify();
}

export function recordAdminLogin(user: AppUser, accountEntered: string): AdminLoginEntry | null {
  if (!isAdmin(user) || typeof window === "undefined") return null;

  const entry: AdminLoginEntry = {
    loggedAt: new Date().toISOString(),
    userId: user.id,
    username: user.username,
    name: user.name,
    accountEntered: accountEntered.trim(),
    userAgent: window.navigator.userAgent,
    language: window.navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    pageUrl: window.location.href,
  };

  const next = [entry, ...readAdminLoginLog()].slice(0, MAX_ENTRIES);
  persistLog(next);

  console.info("[FFin admin login]", {
    loggedAt: entry.loggedAt,
    username: entry.username,
    name: entry.name,
    accountEntered: entry.accountEntered,
    language: entry.language,
    timezone: entry.timezone,
    pageUrl: entry.pageUrl,
  });

  return entry;
}
