import { describe, expect, it } from "vitest";
import { endedYear, monthStart, toMinorUnits } from "./finance";

describe("money utilities", () => {
  it("stores decimals as integer minor units", () => {
    expect(toMinorUnits("12.345")).toBe(1235);
    expect(toMinorUnits(0.1)).toBe(10);
  });

  it("returns the first day of the UTC month", () => {
    expect(monthStart(new Date("2026-08-24T12:00:00Z")).toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });
});

describe("endedYear", () => {
  it("reads the year from an ISO date string", () => {
    expect(endedYear("2024-12-31")).toBe(2024);
  });

  it("reads the year from a UTC Date", () => {
    expect(endedYear(new Date("2025-01-02T00:00:00.000Z"))).toBe(2025);
  });

  it("returns null when the ended date is missing", () => {
    expect(endedYear(null)).toBeNull();
    expect(endedYear(undefined)).toBeNull();
  });
});
