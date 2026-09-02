import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { APP_USERS } from "./users";
import {
  clearLoginLog,
  mergeLoginEntries,
  readLoginLog,
  recordLogin,
} from "./login-log";

const storage = new Map<string, string>();

describe("login-log", () => {
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
      },
      navigator: {
        userAgent: "vitest",
        language: "en-US",
      },
      location: {
        href: "https://example.com/login",
      },
    });
    vi.stubGlobal("Intl", {
      DateTimeFormat: () => ({
        resolvedOptions: () => ({ timeZone: "Asia/Hong_Kong" }),
      }),
    });
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("records admin login details without password", () => {
    const admin = APP_USERS.find((user) => user.username === "Vin")!;
    const entry = recordLogin(admin, "Vin");

    expect(entry.username).toBe("Vin");
    expect(entry.role).toBe("ADMIN");
    expect(entry.accountEntered).toBe("Vin");
    expect(readLoginLog()).toHaveLength(1);
  });

  it("records member login details", () => {
    const member = APP_USERS.find((user) => user.username === "Miki")!;
    const entry = recordLogin(member, "Miki");

    expect(entry.username).toBe("Miki");
    expect(entry.role).toBe("MEMBER");
    expect(readLoginLog()).toHaveLength(1);
  });

  it("clears stored login history", () => {
    const admin = APP_USERS.find((user) => user.username === "Vin")!;
    recordLogin(admin, "Vin");
    clearLoginLog();
    expect(readLoginLog()).toHaveLength(0);
  });

  it("keeps every merged entry without trimming", () => {
    const entries = Array.from({ length: 120 }, (_, index) => ({
      loggedAt: new Date(Date.UTC(2026, 0, 1, index)).toISOString(),
      userId: `user-${index}`,
      username: "Vin",
      name: "Vin",
      role: "ADMIN" as const,
      accountEntered: "Vin",
      userAgent: "vitest",
      language: "en-US",
      timezone: "Asia/Hong_Kong",
      pageUrl: "https://example.com/login",
    }));

    expect(mergeLoginEntries(entries)).toHaveLength(120);
  });
});
