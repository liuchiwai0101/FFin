import { describe, expect, it } from "vitest";
import { filterLoginEntries } from "./login-log-filters";
import type { LoginEntry } from "./login-log";
import { previewLoginLog } from "./login-log";

function entry(username: string, role: "ADMIN" | "MEMBER"): LoginEntry {
  return {
    loggedAt: "2026-09-02T10:00:00.000Z",
    userId: username.toLowerCase(),
    username,
    name: username,
    role,
    accountEntered: username,
    userAgent: "test",
    language: "en-US",
    timezone: "Asia/Hong_Kong",
    pageUrl: "https://example.com/login",
  };
}

describe("filterLoginEntries", () => {
  const entries = [entry("Vin", "ADMIN"), entry("Miki", "MEMBER"), entry("MA", "MEMBER")];

  it("filters by account", () => {
    expect(filterLoginEntries(entries, { account: "Miki", role: "All" })).toHaveLength(1);
  });

  it("filters by role", () => {
    expect(filterLoginEntries(entries, { account: "All", role: "MEMBER" })).toHaveLength(2);
  });
});

describe("previewLoginLog", () => {
  it("returns only the latest entries", () => {
    const entries = Array.from({ length: 15 }, (_, index) => ({
      ...entry("Vin", "ADMIN"),
      loggedAt: new Date(Date.UTC(2026, 0, 1, index)).toISOString(),
    }));

    expect(previewLoginLog(entries, 10)).toHaveLength(10);
    expect(previewLoginLog(entries, 10)[0].loggedAt).toBe(entries[0].loggedAt);
  });
});
