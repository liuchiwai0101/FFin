import { findUserById, type AppUser } from "@/lib/users";
import { findUserByCredentials } from "@/lib/users-auth";

export { findUserByCredentials };

const AUTH_KEY = "ffin_auth_user";

export function readSessionUser(): AppUser | null {
  if (typeof window === "undefined") return null;
  return findUserById(window.localStorage.getItem(AUTH_KEY) ?? "");
}

export function writeSessionUser(user: AppUser) {
  window.localStorage.setItem(AUTH_KEY, user.id);
}

export function clearSessionUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const user = readSessionUser();
  return user ? { "X-FFin-User-Id": user.id } : {};
}
