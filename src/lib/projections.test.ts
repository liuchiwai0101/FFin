import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONSERVATIVE_RATES,
  SHEET_BASE_CAPITAL,
  buildProjectionRows,
  percentToRate,
} from "./projections";

describe("projections", () => {
  it("matches sheet year-1 target at 7%", () => {
    const rows = buildProjectionRows(
      SHEET_BASE_CAPITAL,
      DEFAULT_CONSERVATIVE_RATES,
      [0.07, 0.07, 0.07, 0.07, 0.07, 0.07],
    );
    expect(Math.round(rows[0].tBase)).toBe(7_720_612);
    expect(Math.round(rows[0].tInterest)).toBe(540_443);
  });

  it("uses 5% default target for year 1", () => {
    const rows = buildProjectionRows(SHEET_BASE_CAPITAL, DEFAULT_CONSERVATIVE_RATES, [0.05]);
    expect(Math.round(rows[0].tBase)).toBe(7_576_302);
    expect(Math.round(rows[0].tInterest)).toBe(378_815);
  });

  it("parses percent inputs", () => {
    expect(percentToRate("5")).toBe(0.05);
    expect(percentToRate("2.48")).toBe(0.0248);
    expect(percentToRate("0.05")).toBe(0.05);
  });
});
