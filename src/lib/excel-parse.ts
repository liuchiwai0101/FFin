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
  let active: ColumnMap = { ...DEFAULT_ACTIVE_COLUMNS };
  let history: ColumnMap = { ...DEFAULT_HISTORY_COLUMNS };

  for (const row of rows) {
    if (!row || !isHeaderRow(row)) continue;
    const map = buildColumnMap(row);
    if (map.id !== undefined) {
      history = { ...DEFAULT_HISTORY_COLUMNS, ...map };
    } else {
      active = { ...DEFAULT_ACTIVE_COLUMNS, ...map };
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

function cellNumber(row: unknown[], index: number | undefined): number {
  if (index === undefined) return 0;
  const value = Number(row[index]);
  return Number.isFinite(value) ? value : 0;
}

function cellOptionalNumber(row: unknown[], index: number | undefined): number | null {
  if (index === undefined) return null;
  const raw = row[index];
  if (raw === null || raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function isSkippableBank(bank: string): boolean {
  const normalized = bank.toLowerCase();
  return normalized === "total" || normalized === "origianl" || normalized === "original";
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

function isHistoryId(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  const text = String(value).trim();
  if (!text) return false;
  if (KNOWN_OWNERS.has(text)) return false;
  if (/^\d+$/.test(text)) return true;
  return text.length > 0;
}

export function parseWorkbook(wb: xlsx.WorkBook) {
  const sheet = wb.Sheets["Bank interest"] || wb.Sheets[wb.SheetNames[0]];
  const rows: unknown[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  const { active, history } = detectColumnMaps(rows);

  const activeItems: DepositItem[] = [];
  const historyItems: DepositItem[] = [];

  for (const row of rows) {
    if (!row || isHeaderRow(row)) continue;

    const ownerFromActive = cellString(row, active.owner);
    if (KNOWN_OWNERS.has(ownerFromActive)) {
      const item = parseDepositRow(row, active, ownerFromActive, true);
      if (item) activeItems.push(item);
      continue;
    }

    const historyId = row[history.id ?? 0];
    const ownerFromHistory = cellString(row, history.owner);
    if (isHistoryId(historyId) && KNOWN_OWNERS.has(ownerFromHistory)) {
      const item = parseDepositRow(row, history, ownerFromHistory, false, historyId);
      if (item) historyItems.push(item);
    }
  }

  return { activeItems, historyItems };
}

export function parseExcelArrayBuffer(data: ArrayBuffer) {
  const wb = xlsx.read(data, { type: "array" });
  return parseWorkbook(wb);
}
