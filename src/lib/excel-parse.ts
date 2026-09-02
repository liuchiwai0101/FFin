import * as xlsx from "xlsx";

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

function excelDateToDate(serial: unknown): string | null {
  if (serial === null || serial === undefined || isNaN(Number(serial))) return null;
  const num = Number(serial);
  if (num < 1000) return null; // not a date serial
  const utc_days = Math.floor(num - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return isNaN(date_info.getTime()) ? null : date_info.toISOString().slice(0, 10);
}

export function parseWorkbook(wb: xlsx.WorkBook) {
  const sheet = wb.Sheets["Bank interest"] || wb.Sheets[wb.SheetNames[0]];
  const rows: (string | number | null | undefined)[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  const activeItems: DepositItem[] = [];
  const historyItems: DepositItem[] = [];

  // Helper to extract active block
  function parseActiveSection(owner: string, startRow: number, endRow: number) {
    for (let r = startRow; r <= endRow; r++) {
      const row = rows[r];
      if (!row || !row[2]) continue; // needs bank
      const bank = String(row[2]).trim();
      if (bank.toLowerCase() === "total" || bank.toLowerCase() === "origianl") continue;

      const amount = Number(row[3]) || 0;
      if (amount <= 0) continue;

      const rate = row[4] !== null && row[4] !== undefined && !isNaN(Number(row[4])) ? Number(row[4]) : null;
      const fromDate = excelDateToDate(row[5]);
      const toDate = excelDateToDate(row[6]);
      const months = row[7] ? Number(row[7]) : null;
      const totalAmount = row[8] ? Number(row[8]) : amount;
      const interest = row[9] ? Number(row[9]) : Math.max(0, totalAmount - amount);
      const productNote = row[10] ? String(row[10]).trim() : "";

      let product = "Time Deposit (定存)";
      if (productNote.includes("零售債券")) product = "零售債券 (Retail Bond)";
      else if (productNote.includes("綠色債券")) product = "綠色債券 (Green Bond)";
      else if (productNote.includes("機場債券")) product = "機場債券 (Airport Bond)";
      else if (productNote.includes("Bond") || productNote.includes("債券")) product = "Bond (債券)";
      else if (productNote.includes("RMB")) product = "RMB Deposit (人民幣定存)";
      else if (productNote.includes("馬拉松")) product = "Marathon Deposit (馬拉松定存)";
      else if (rate === null || rate === 0) product = "Demand / Savings (活期)";

      activeItems.push({
        ownerName: owner,
        bank,
        product,
        amount,
        rate,
        fromDate,
        toDate,
        months,
        totalAmount,
        interest,
        currency: productNote.includes("RMB") ? "RMB" : "HKD",
        isCurrent: true,
        notes: productNote || null,
      });
    }
  }

  // Parse active blocks
  parseActiveSection("MA", 2, 7);
  parseActiveSection("Vin", 13, 23);
  parseActiveSection("Miki", 28, 32);

  // Parse history section (rows 38 to 80)
  for (let r = 38; r <= 80; r++) {
    const row = rows[r];
    if (!row || row[0] === undefined || row[0] === null) continue;
    const owner = String(row[1] || "Vin").trim();
    const bank = String(row[2] || "").trim();
    const amount = Number(row[3]) || 0;
    if (amount <= 0 || !bank) continue;

    const rate = row[4] !== null && row[4] !== undefined && !isNaN(Number(row[4])) ? Number(row[4]) : null;
    const fromDate = excelDateToDate(row[5]);
    const toDate = excelDateToDate(row[6]);
    const months = row[7] ? Number(row[7]) : null;
    const totalAmount = row[8] ? Number(row[8]) : amount;
    const interest = row[9] ? Number(row[9]) : Math.max(0, totalAmount - amount);
    const productNote = row[10] ? String(row[10]).trim() : "";

    let product = "Time Deposit (定存)";
    if (productNote.includes("零售債券")) product = "零售債券 (Retail Bond)";
    else if (productNote.includes("綠色債券")) product = "綠色債券 (Green Bond)";
    else if (productNote.includes("機場債券")) product = "機場債券 (Airport Bond)";
    else if (productNote.includes("Bond") || productNote.includes("債券")) product = "Bond (債券)";
    else if (productNote.includes("馬拉松")) product = "Marathon Deposit (馬拉松定存)";

    historyItems.push({
      ownerName: owner,
      bank,
      product,
      amount,
      rate,
      fromDate,
      toDate,
      months,
      totalAmount,
      interest,
      currency: "HKD",
      isCurrent: false,
      notes: productNote ? `ID: ${row[0]} · ${productNote}` : `ID: ${row[0]}`,
    });
  }

  return { activeItems, historyItems };
}


export function parseExcelArrayBuffer(data: ArrayBuffer) {
  const wb = xlsx.read(data, { type: "array" });
  return parseWorkbook(wb);
}
