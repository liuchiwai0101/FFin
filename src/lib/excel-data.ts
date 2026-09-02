import fs from "fs";
import path from "path";
import * as xlsx from "xlsx";
import { saveDepositStore } from "@/lib/deposit-store";
import { parseWorkbook, type DepositItem } from "@/lib/excel-parse";

export type { DepositItem } from "@/lib/excel-parse";
export { parseWorkbook } from "@/lib/excel-parse";

export function parseExcelBuffer(buffer: Buffer) {
  const wb = xlsx.read(buffer, { type: "buffer" });
  return parseWorkbook(wb);
}

export function getDefaultExcelPath() {
  if (process.env.EXCEL_PATH) {
    return process.env.EXCEL_PATH;
  }
  return path.join(process.cwd(), "data", "Summary.xlsx");
}

export function parseExcelFile(filePath?: string) {
  const targetPath = filePath || getDefaultExcelPath();

  if (!fs.existsSync(/*turbopackIgnore: true*/ targetPath)) {
    return null;
  }

  const wb = xlsx.readFile(/*turbopackIgnore: true*/ targetPath);
  return parseWorkbook(wb);
}

export function syncItemsToStore(items: { activeItems: DepositItem[]; historyItems: DepositItem[] }) {
  const saved = saveDepositStore(items);
  return {
    count: saved.activeItems.length + saved.historyItems.length,
    activeCount: saved.activeItems.length,
    historyCount: saved.historyItems.length,
  };
}

export function syncExcelToStore(filePath?: string) {
  const parsed = parseExcelFile(filePath);
  if (!parsed) return { count: 0, error: "Summary.xlsx not found" as const };
  return syncItemsToStore(parsed);
}

/** @deprecated Use syncItemsToStore */
export const syncItemsToDatabase = syncItemsToStore;
/** @deprecated Use syncExcelToStore */
export const syncExcelToDatabase = syncExcelToStore;
