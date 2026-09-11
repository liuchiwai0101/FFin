import { describe, expect, it } from "vitest";
import * as xlsx from "xlsx";
import { parseWorkbook } from "./excel-parse";

function workbookFromRows(rows: unknown[][]) {
  const sheet = xlsx.utils.aoa_to_sheet(rows);
  return {
    Sheets: { "Bank interest": sheet },
    SheetNames: ["Bank interest"],
  } as xlsx.WorkBook;
}

describe("parseWorkbook", () => {
  it("parses active rows by owner column instead of hardcoded row ranges", () => {
    const rows = [
      ["Member", "", "Bank", "Amount", "Rate", "From", "To", "Month", "total", "Interest", "Note"],
      ["Miki", "", "HS", 460684, 0.03, "2026-08-29", "2027-03-01", 6, 467651, 6967],
      ["Miki", "", "MA HSBC", 160000, 0.0385, "2025-09-28", "2028-09-28", 36, 178497, 18497, "Bond"],
      ["Miki", "", "HSBC", 222893],
    ];

    const parsed = parseWorkbook(workbookFromRows(rows));
    const miki = parsed.activeItems.filter((item) => item.ownerName === "Miki");

    expect(miki).toHaveLength(3);
    expect(miki.reduce((sum, item) => sum + item.amount, 0)).toBe(843577);
    expect(miki.reduce((sum, item) => sum + item.interest, 0)).toBeCloseTo(25464, 0);
  });

  it("detects history rows by id and owner header columns", () => {
    const rows = [
      ["ID", "Member", "Bank", "Amount", "Rate", "From", "To", "Month", "total", "Interest", "Remark"],
      [101, "Miki", "SC", 100000, 0.02, "2024-01-01", "2025-01-01", 12, 102000, 2000, "Matured"],
    ];

    const parsed = parseWorkbook(workbookFromRows(rows));

    expect(parsed.historyItems).toHaveLength(1);
    expect(parsed.historyItems[0]?.ownerName).toBe("Miki");
    expect(parsed.historyItems[0]?.amount).toBe(100000);
    expect(parsed.historyItems[0]?.notes).toContain("ID: 101");
  });

  it("skips total rows regardless of position", () => {
    const rows = [
      ["Miki", "", "HS", 460684, 0.03, "2026-08-29", "2027-03-01", 6, 467651, 6967],
      ["Miki", "", "total", 843577, "", "", "", "", 646148, 25464],
    ];

    const parsed = parseWorkbook(workbookFromRows(rows));

    expect(parsed.activeItems).toHaveLength(1);
    expect(parsed.activeItems[0]?.amount).toBe(460684);
  });
});
