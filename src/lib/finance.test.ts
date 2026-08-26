import { describe, expect, it } from "vitest";
import { monthStart, toMinorUnits } from "./finance";

describe("money utilities", () => {
  it("stores decimals as integer minor units", () => {
    expect(toMinorUnits("12.345")).toBe(1235);
    expect(toMinorUnits(0.1)).toBe(10);
  });

  it("returns the first day of the UTC month", () => {
    expect(monthStart(new Date("2026-08-24T12:00:00Z")).toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });
});
