import * as xlsx from "xlsx";
import { APP_USERS, DEMO_OWNER_KEYS } from "@/lib/users";

export interface DepositItem {
  id?: string;
  ownerName: string;
  bank: string;
  product: string;
  amount: number;
  rate: number | null;
  fromDate: string | null;
  toDate: string | null;
  months: number | null;
  totalAmount: number;
  interest: number;
  currency: string;
  isCurrent: boolean;
  notes?: string | null;
}

type ColumnMap = {
  id?: number;
  owner?: number;
  bank?: number;
  amount?: number;
  rate?: number;
  fromDate?: number;
  toDate?: number;
  months?: number;
  totalAmount?: number;
  interest?: number;
  note?: number;
};

const KNOWN_OWNERS = new Set([...APP_USERS.map((user) => user.ownerKey), ...DEMO_OWNER_KEYS]);

/**
 * Family Summary.xlsx layout: current holdings sit in fixed row blocks with bank in
 * column C and amount in column D. Owner names are NOT repeated on each data row.
 */
const LEGACY_ACTIVE_SECTIONS: Array<{ owner: string; start: number; end: number }> = [
  { owner: "MA", start: 2, end: 7 },
  { owner: "BABA", start: 8, end: 12 },
  { owner: "Vin", start: 13, end: 23 },
  { owner: "Miki", start: 28, end: 36 },
];

const DEFAULT_ACTIVE_COLUMNS: ColumnMap = {
  owner: 0,
  bank: 2,
  amount: 3,
  rate: 4,
  fromDate: 5,
  toDate: 6,
  months: 7,
  totalAmount: 8,
  interest: 9,
  note: 10,
};

const DEFAULT_HISTORY_COLUMNS: ColumnMap = {
  id: 0,
  owner: 1,
  bank: 2,
  amount: 3,
  rate: 4,
  fromDate: 5,
  toDate: 6,
  months: 7,
  totalAmount: 8,
  interest: 9,
  note: 10,
};

const COLUMN_ALIASES: Array<{ key: keyof ColumnMap; patterns: string[] }> = [
  { key: "id", patterns: ["id", "#", "編號", "编号"] },
  { key: "owner", patterns: ["owner", "member", "name", "account", "person", "持有人", "成員", "成员", "帳戶", "账户"] },
  { key: "bank", patterns: ["bank", "銀行", "银行"] },
  { key: "amount", patterns: ["amount", "principal", "本金", "金額", "金额"] },
  { key: "rate", patterns: ["rate", "利率", "息率"] },
  { key: "fromDate", patterns: ["from", "from date", "start", "開始", "开始", "起息"] },
  { key: "toDate", patterns: ["to", "to date", "end", "到期", "結束", "结束"] },
  { key: "months", patterns: ["month", "months", "tenor", "期", "月數", "月数"] },
  { key: "totalAmount", patterns: ["total", "maturity", "payout", "總額", "总额", "本息"] },
  { key: "interest", patterns: ["interest", "利息", "息"] },
  { key: "note", patterns: ["note", "notes", "remark", "remarks", "product", "備註", "备注", "說明", "说明"] },
];

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function matchesHeader(cell: string, pattern: string): boolean {
  if (!cell || !pattern) return false;
  if (cell === pattern) return true;
  if (pattern.includes(" ")) return cell === pattern;
  return cell === pattern || cell.startsWith(`${pattern} `) || cell.endsWith(` ${pattern}`);
}

function buildColumnMap(row: unknown[]): ColumnMap {
  const map: ColumnMap = {};
  row.forEach((cell, index) => {
    const header = normalizeHeader(cell);
    if (!header) return;
    for (const alias of COLUMN_ALIASES) {
      if (alias.patterns.some((pattern) => matchesHeader(header, pattern))) {
        map[alias.key] = index;
        break;
      }
    }
  });
  return map;
}

function isHeaderRow(row: unknown[]): boolean {
  const map = buildColumnMap(row);
  const hasBank = map.bank !== undefined;
  const hasAmount = map.amount !== undefined;
  const hasOwnerOrId = map.owner !== undefined || map.id !== undefined;
  return hasBank && hasAmount && hasOwnerOrId;
}

function detectColumnMaps(rows: unknown[][]): { active: ColumnMap; history: ColumnMap } {
  // Keep active columns fixed — remapping from a partial header row shifts bank/amount
  // off columns C/D and drops every current holding.
  const active: ColumnMap = { ...DEFAULT_ACTIVE_COLUMNS };
  let history: ColumnMap = { ...DEFAULT_HISTORY_COLUMNS };

  for (const row of rows) {
    if (!row || !isHeaderRow(row)) continue;
    const map = buildColumnMap(row);
    if (map.id !== undefined) {
      history = { ...DEFAULT_HISTORY_COLUMNS, ...map };
    }
  }

  return { active, history };
}

function excelDateToDate(serial: unknown): string | null {
  if (serial === null || serial === undefined || isNaN(Number(serial))) return null;
  const num = Number(serial);
  if (num < 1000) return null;
  const utcDays = Math.floor(num - 25569);
  const utcValue = utcDays * 86400;
  const dateInfo = new Date(utcValue * 1000);
  return isNaN(dateInfo.getTime()) ? null : dateInfo.toISOString().slice(0, 10);
}

function cellString(row: unknown[], index: number | undefined): string {
  if (index === undefined) return "";
  return String(row[index] ?? "").trim();
}

function parseNumericCell(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const text = String(raw)
    .replace(/,/g, "")
    .replace(/HK\$/gi, "")
    .replace(/\$/g, "")
    .trim();
  if (!text) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function cellNumber(row: unknown[], index: number | undefined): number {
  if (index === undefined) return 0;
  return parseNumericCell(row[index]) ?? 0;
}

function cellOptionalNumber(row: unknown[], index: number | undefined): number | null {
  if (index === undefined) return null;
  return parseNumericCell(row[index]);
}

function isSkippableBank(bank: string): boolean {
  const normalized = bank.toLowerCase();
  return normalized === "total" || normalized === "origianl" || normalized === "original";
}

function looksLikeDepositRow(row: unknown[], columns: ColumnMap): boolean {
  const bank = cellString(row, columns.bank);
  if (!bank || isSkippableBank(bank)) return false;
  return cellNumber(row, columns.amount) > 0;
}

function matchKnownOwner(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (KNOWN_OWNERS.has(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  for (const owner of KNOWN_OWNERS) {
    if (owner.toLowerCase() === lower) return owner;
    if (lower.startsWith(`${owner.toLowerCase()} `) || lower.startsWith(`${owner.toLowerCase()}-`)) {
      return owner;
    }
  }
  return null;
}

/** Owner label on a section header row (no deposit data on the same row). */
function findSectionOwner(row: unknown[]): string | null {
  for (let i = 0; i <= 3; i++) {
    const matched = matchKnownOwner(cellString(row, i));
    if (matched) return matched;
  }
  return null;
}

function productFromNote(productNote: string, rate: number | null): string {
  let product = "Time Deposit (定存)";
  if (productNote.includes("零售債券")) product = "零售債券 (Retail Bond)";
  else if (productNote.includes("綠色債券")) product = "綠色債券 (Green Bond)";
  else if (productNote.includes("機場債券")) product = "機場債券 (Airport Bond)";
  else if (productNote.includes("Bond") || productNote.includes("債券")) product = "Bond (債券)";
  else if (productNote.includes("RMB")) product = "RMB Deposit (人民幣定存)";
  else if (productNote.includes("馬拉松")) product = "Marathon Deposit (馬拉松定存)";
  else if (rate === null || rate === 0) product = "Demand / Savings (活期)";
  return product;
}

function parseDepositRow(
  row: unknown[],
  columns: ColumnMap,
  ownerName: string,
  isCurrent: boolean,
  historyId?: unknown,
): DepositItem | null {
  const bank = cellString(row, columns.bank);
  if (!bank || isSkippableBank(bank)) return null;

  const amount = cellNumber(row, columns.amount);
  if (amount <= 0) return null;

  const rateRaw = cellOptionalNumber(row, columns.rate);
  const rate = rateRaw === null ? null : rateRaw;
  const fromDate = excelDateToDate(row[columns.fromDate ?? -1]);
  const toDate = excelDateToDate(row[columns.toDate ?? -1]);
  const months = cellOptionalNumber(row, columns.months);
  const totalAmount = cellOptionalNumber(row, columns.totalAmount) ?? amount;
  const interest =
    cellOptionalNumber(row, columns.interest) ?? Math.max(0, totalAmount - amount);
  const productNote = cellString(row, columns.note);
  const product = productFromNote(productNote, rate);

  return {
    ownerName,
    bank,
    product,
    amount,
    rate,
    fromDate,
    toDate,
    months,
    totalAmount,
    interest,
    currency: isCurrent && productNote.includes("RMB") ? "RMB" : "HKD",
    isCurrent,
    notes: isCurrent
      ? productNote || null
      : productNote
        ? `ID: ${historyId} · ${productNote}`
        : `ID: ${historyId}`,
  };
}

/** History IDs are numeric only — never treat bank codes / labels as IDs. */
function isHistoryId(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  const text = String(value).trim();
  if (!text) return false;
  if (KNOWN_OWNERS.has(text)) return false;
  return /^\d+$/.test(text);
}

function looksLikeHistoryRow(row: unknown[], history: ColumnMap): boolean {
  const historyId = row[history.id ?? 0];
  const ownerFromHistory = matchKnownOwner(cellString(row, history.owner));
  return isHistoryId(historyId) && ownerFromHistory !== null;
}

function sheetToRows(sheet: xlsx.WorkSheet): unknown[][] {
  // Force the read range to start at A1 so legacy active row indexes match Excel
  // row numbers even when the workbook's stored !ref starts mid-sheet.
  if (sheet["!ref"]) {
    const decoded = xlsx.utils.decode_range(sheet["!ref"]);
    decoded.s.r = 0;
    decoded.s.c = 0;
    sheet["!ref"] = xlsx.utils.encode_range(decoded);
  }
  return xlsx.utils.sheet_to_json(sheet, { header: 1, blankrows: true, defval: "" });
}

function parseLegacyActiveSections(rows: unknown[][], history: ColumnMap): DepositItem[] {
  const items: DepositItem[] = [];
  for (const section of LEGACY_ACTIVE_SECTIONS) {
    for (let r = section.start; r <= section.end; r++) {
      const row = rows[r];
      if (!row || isHeaderRow(row) || looksLikeHistoryRow(row, history)) continue;
      const item = parseDepositRow(row, DEFAULT_ACTIVE_COLUMNS, section.owner, true);
      if (item) items.push(item);
    }
  }
  return items;
}

export function parseWorkbook(wb: xlsx.WorkBook) {
  const sheet = wb.Sheets["Bank interest"] || wb.Sheets[wb.SheetNames[0]];
  const rows = sheetToRows(sheet);
  const { active, history } = detectColumnMaps(rows);

  const activeItems: DepositItem[] = [];
  const historyItems: DepositItem[] = [];
  let currentActiveOwner: string | null = null;

  for (const row of rows) {
    if (!row || isHeaderRow(row)) continue;

    const historyId = row[history.id ?? 0];
    const ownerFromHistory = matchKnownOwner(cellString(row, history.owner));
    if (isHistoryId(historyId) && ownerFromHistory) {
      const item = parseDepositRow(row, history, ownerFromHistory, false, historyId);
      if (item) historyItems.push(item);
      continue;
    }

    const ownerFromActive = matchKnownOwner(cellString(row, active.owner));
    if (ownerFromActive && looksLikeDepositRow(row, active)) {
      const item = parseDepositRow(row, active, ownerFromActive, true);
      if (item) {
        activeItems.push(item);
        currentActiveOwner = ownerFromActive;
      }
      continue;
    }

    const sectionOwner = findSectionOwner(row);
    if (sectionOwner && !looksLikeDepositRow(row, active)) {
      currentActiveOwner = sectionOwner;
      continue;
    }

    if (currentActiveOwner && looksLikeDepositRow(row, active)) {
      const item = parseDepositRow(row, active, currentActiveOwner, true);
      if (item) activeItems.push(item);
    }
  }

  // Summary.xlsx current blocks omit per-row owners; fall back to known row ranges.
  if (activeItems.length === 0) {
    activeItems.push(...parseLegacyActiveSections(rows, history));
  }

  return { activeItems, historyItems };
}

export function parseExcelArrayBuffer(data: ArrayBuffer) {
  const wb = xlsx.read(data, { type: "array" });
  return parseWorkbook(wb);
}
