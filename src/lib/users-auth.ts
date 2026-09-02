import { createHash, timingSafeEqual } from "crypto";
import { APP_USERS, type AppUser } from "./users";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function parseJsonMap(raw: string | undefined): Record<string, string> {
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" && value.length > 0) out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

/** SHA-256 hex for a username, from FFIN_PASSWORD_HASHES or FFIN_PASSWORDS. Never hardcode secrets. */
export function passwordHashFor(username: string): string | null {
  const hashes = parseJsonMap(process.env.FFIN_PASSWORD_HASHES);
  if (hashes[username]) return hashes[username];
  const passwords = parseJsonMap(process.env.FFIN_PASSWORDS);
  const plaintext = passwords[username];
  return plaintext ? sha256Hex(plaintext) : null;
}

function hashesMatch(expected: string, actual: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function findUserByCredentials(account: string, password: string): AppUser | null {
  const normalized = account.trim().toLowerCase();
  const user = APP_USERS.find(
    (u) =>
      u.username.toLowerCase() === normalized ||
      `${u.username.toLowerCase()}@family.local` === normalized,
  );
  if (!user) return null;
  const expected = passwordHashFor(user.username);
  if (!expected) return null;
  if (!hashesMatch(expected, sha256Hex(password))) return null;
  return user;
}
