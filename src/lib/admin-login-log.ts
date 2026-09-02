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

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeAdminLoginLog(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function parseLog(raw: string | null): AdminLoginEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as AdminLoginEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readAdminLoginLog(): AdminLoginEntry[] {
  if (typeof window === "undefined") return [];
  return parseLog(window.localStorage.getItem(STORAGE_KEY));
}

export function clearAdminLoginLog() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
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
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  notify();

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
