import { describe, expect, it } from "vitest";
import { EXCEL_RETENTION_MS, excelClearAt, isExcelExpired, msUntilExcelClear } from "./excel-retention";

describe("excel-retention", () => {
  const imported = "2026-09-01T10:00:00.000Z";

  it("computes clear time 6 hours after import", () => {
    const clearAt = excelClearAt(imported);
    expect(clearAt?.toISOString()).toBe("2026-09-01T16:00:00.000Z");
  });

  it("detects expired data", () => {
    const after = new Date(imported).getTime() + EXCEL_RETENTION_MS + 1;
    expect(isExcelExpired(imported, after)).toBe(true);
    expect(isExcelExpired(imported, after - 2)).toBe(false);
  });

  it("returns remaining ms until clear", () => {
    const now = new Date(imported).getTime() + 60_000;
    expect(msUntilExcelClear(imported, now)).toBe(EXCEL_RETENTION_MS - 60_000);
  });
});
