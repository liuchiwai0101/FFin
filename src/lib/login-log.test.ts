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

  it("returns a stable snapshot reference until the log changes", () => {
    const admin = APP_USERS.find((user) => user.username === "Vin")!;
    recordLogin(admin, "Vin");
    expect(readLoginLog()).toBe(readLoginLog());
  });

  it("merges remote and local entries without duplicates", () => {
    const admin = APP_USERS.find((user) => user.username === "Vin")!;
    const member = APP_USERS.find((user) => user.username === "Miki")!;
    const vinEntry = recordLogin(admin, "Vin");
    const mikiEntry = recordLogin(member, "Miki");

    const merged = mergeLoginEntries(readLoginLog(), [vinEntry, mikiEntry]);
    expect(merged).toHaveLength(2);
  });
});
