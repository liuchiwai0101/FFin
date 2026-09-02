import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { APP_USERS } from "./users";
import { clearAdminLoginLog, readAdminLoginLog, recordAdminLogin } from "./admin-login-log";

const storage = new Map<string, string>();

describe("admin-login-log", () => {
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
    const entry = recordAdminLogin(admin, "Vin");

    expect(entry).not.toBeNull();
    expect(entry?.username).toBe("Vin");
    expect(entry?.accountEntered).toBe("Vin");
    expect(entry?.userAgent).toBe("vitest");
    expect(readAdminLoginLog()).toHaveLength(1);
    expect(console.info).toHaveBeenCalled();
  });

  it("ignores non-admin users", () => {
    const member = APP_USERS.find((user) => user.username === "Miki")!;
    expect(recordAdminLogin(member, "Miki")).toBeNull();
    expect(readAdminLoginLog()).toHaveLength(0);
  });

  it("clears stored admin login history", () => {
    const admin = APP_USERS.find((user) => user.username === "Vin")!;
    recordAdminLogin(admin, "Vin");
    clearAdminLoginLog();
    expect(readAdminLoginLog()).toHaveLength(0);
  });
});
