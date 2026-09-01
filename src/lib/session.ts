import { cookies } from "next/headers";
import { findUserByCredentials, findUserById, type AppUser } from "@/lib/users";

export const SESSION_COOKIE = "ffin_session";

function authSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "ffin-dev-secret-change-me";
}

function toBase64Url(value: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf8").toString("base64url");
  }
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/** Per-user session token (Edge-safe verify). */
export function createSessionToken(userId: string) {
  const sig = toBase64Url(`${userId}:${authSecret()}`);
  return `${userId}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const userId = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (sig !== toBase64Url(`${userId}:${authSecret()}`)) return null;
  return userId;
}

export function credentialsMatch(account: string, password: string) {
  return Boolean(findUserByCredentials(account, password));
}

export async function getSessionUser(): Promise<AppUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const userId = verifySessionToken(token);
  if (!userId) return null;
  return findUserById(userId);
}
