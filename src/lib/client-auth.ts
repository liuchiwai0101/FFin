import { findUserById, type AppUser } from "@/lib/users";
import { findUserByCredentials } from "@/lib/users-auth";
import { recordLogin } from "@/lib/login-log";
import { refreshLoginLogFromGitHub, syncLoginLogToGitHub } from "@/lib/login-log-sync";

export { findUserByCredentials };

const AUTH_KEY = "ffin_auth_user";

export function readSessionUser(): AppUser | null {
  if (typeof window === "undefined") return null;
  return findUserById(window.localStorage.getItem(AUTH_KEY) ?? "");
}

export function writeSessionUser(user: AppUser, options?: { accountEntered?: string }) {
  window.localStorage.setItem(AUTH_KEY, user.id);
  recordLogin(user, options?.accountEntered ?? user.username);
  void refreshLoginLogFromGitHub().then(() => syncLoginLogToGitHub());
}

export function clearSessionUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const user = readSessionUser();
  return user ? { "X-FFin-User-Id": user.id } : {};
}
