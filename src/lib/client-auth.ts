import { findUserById, isAdmin, type AppUser } from "@/lib/users";
import { findUserByCredentials } from "@/lib/users-auth";
import { recordAdminLogin } from "@/lib/admin-login-log";

export { findUserByCredentials };

const AUTH_KEY = "ffin_auth_user";

export function readSessionUser(): AppUser | null {
  if (typeof window === "undefined") return null;
  return findUserById(window.localStorage.getItem(AUTH_KEY) ?? "");
}

export function writeSessionUser(user: AppUser, options?: { accountEntered?: string }) {
  window.localStorage.setItem(AUTH_KEY, user.id);
  if (isAdmin(user)) {
    recordAdminLogin(user, options?.accountEntered ?? user.username);
  }
}

export function clearSessionUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const user = readSessionUser();
  return user ? { "X-FFin-User-Id": user.id } : {};
}
