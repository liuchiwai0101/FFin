"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/access";
import { deleteDepositById, upsertDepositRecord } from "@/lib/deposit-store";
import { parseExcelBuffer, syncExcelToStore, syncItemsToStore } from "@/lib/excel-data";

function value(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function refreshDepositPaths() {
  revalidatePath("/app");
  revalidatePath("/app/current");
  revalidatePath("/app/history");
  revalidatePath("/app/sync");
}

export async function uploadExcelAction(formData: FormData) {
  await requireUser();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    throw new Error("Please select a valid Excel file (.xlsx) to upload.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseExcelBuffer(buffer);
  if (!parsed) {
    throw new Error("Could not parse data from the uploaded file. Please ensure it is a valid Summary.xlsx file.");
  }

  syncItemsToStore(parsed);
  refreshDepositPaths();
}

export async function syncExcelAction() {
  await requireUser();
  const result = syncExcelToStore();
  if ("error" in result && result.error) {
    throw new Error(result.error);
  }
  refreshDepositPaths();
}

export async function createDepositRecord(form: FormData) {
  const user = await requireUser();
  const ownerName = value(form, "ownerName") || user.name || "Vin";
  const bank = value(form, "bank");
  const product = value(form, "product");
  const amount = parseFloat(value(form, "amount"));
  const rateInput = value(form, "rate");
  const rate = rateInput ? parseFloat(rateInput) / (parseFloat(rateInput) > 1 ? 100 : 1) : null;
  const fromDateStr = value(form, "fromDate");
  const toDateStr = value(form, "toDate");
  const monthsInput = value(form, "months");
  const months = monthsInput ? parseFloat(monthsInput) : null;
  const interestInput = value(form, "interest");
  const interest = interestInput
    ? parseFloat(interestInput)
    : rate && months
      ? amount * rate * (months / 12)
      : 0;
  const totalAmount = amount + (interest || 0);
  const currency = value(form, "currency") || "HKD";
  const isCurrent = value(form, "isCurrent") === "true";
  const notes = value(form, "notes") || null;

  upsertDepositRecord({
    ownerName,
    bank,
    product,
    amount,
    rate,
    fromDate: fromDateStr || null,
    toDate: toDateStr || null,
    months,
    totalAmount,
    interest,
    currency,
    isCurrent,
    notes,
  });

  refreshDepositPaths();
}

export async function deleteDepositRecord(form: FormData) {
  await requireUser();
  deleteDepositById(value(form, "id"));
  refreshDepositPaths();
}
