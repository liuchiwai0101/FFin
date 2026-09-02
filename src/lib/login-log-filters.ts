import type { LoginEntry } from "@/lib/login-log";
import type { UserRole } from "@/lib/users";

export type LoginLogFilters = {
  account: string;
  role: string;
};

export function filterLoginEntries(entries: LoginEntry[], filters: LoginLogFilters): LoginEntry[] {
  return entries.filter((entry) => {
    if (filters.account !== "All" && entry.username !== filters.account) return false;
    if (filters.role !== "All" && entry.role !== filters.role) return false;
    return true;
  });
}

export function loginLogHref(account: string, role: string): string {
  const query = new URLSearchParams({ account, role });
  return `/app/login-log?${query.toString()}`;
}

export const LOGIN_LOG_ROLES: Array<UserRole | "All"> = ["All", "ADMIN", "MEMBER"];
