import { cookies } from "next/headers";

export const SESSION_COOKIE = "ffin_session";

/** Hardcoded login — no database. */
export const HARDCODED_USER = {
  id: "local",
  name: "Vin",
  email: "vin@family.local",
  systemRole: "ADMIN" as const,
  username: "Vin",
  password: "admin123",
};

function authSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "ffin-dev-secret-change-me";
}

/** Edge-safe session token (no Node crypto). */
export function createSessionToken() {
  return `ok.${authSecret()}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  return Boolean(token) && token === createSessionToken();
}

export function credentialsMatch(account: string, password: string) {
  const normalized = account.trim().toLowerCase();
  const okAccount =
    normalized === HARDCODED_USER.username.toLowerCase() ||
    normalized === HARDCODED_USER.email.toLowerCase();
  return okAccount && password === HARDCODED_USER.password;
}

export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!verifySessionToken(token)) return null;
  return HARDCODED_USER;
}
