"use server";

import { TransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { monthStart, toMinorUnits } from "@/lib/finance";
import { requireUser } from "@/lib/access";
import { parseExcelBuffer, syncExcelToDatabase, syncItemsToDatabase } from "@/lib/excel-data";
import {
  accountSchema,
  budgetSchema,
  categorySchema,
  transactionSchema,
} from "@/lib/validation";

async function audit(actorId: string, action: string, entityType: string, entityId?: string) {
  await db.auditLog.create({ data: { actorId, action, entityType, entityId } });
}

function value(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

// Upload & Import Excel File directly
export async function uploadExcelAction(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    throw new Error("Please select a valid Excel file (.xlsx) to upload.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const parsed = parseExcelBuffer(buffer);

  if (!parsed) {
    throw new Error("Could not parse data from the uploaded file. Please ensure it is a valid Summary.xlsx file.");
  }

  await syncItemsToDatabase(parsed);
  await audit(user.id, "EXCEL_FILE_UPLOADED", "DepositRecord");

  revalidatePath("/app");
  revalidatePath("/app/current");
  revalidatePath("/app/history");
  revalidatePath("/app/sync");
}

// 1-Click Sync from default path
export async function syncExcelAction() {
  const user = await requireUser();
  await syncExcelToDatabase();
  await audit(user.id, "EXCEL_SYNCED", "DepositRecord");
  revalidatePath("/app");
  revalidatePath("/app/current");
  revalidatePath("/app/history");
  revalidatePath("/app/sync");
}

// Deposit Records Actions (Excel data based)
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

  await db.depositRecord.create({
    data: {
      userId: user.id,
      ownerName,
      bank,
      product,
      amount,
      rate,
      fromDate: fromDateStr ? new Date(`${fromDateStr}T00:00:00.000Z`) : null,
      toDate: toDateStr ? new Date(`${toDateStr}T00:00:00.000Z`) : null,
      months,
      totalAmount,
      interest,
      currency,
      isCurrent,
      notes,
    },
  });

  await audit(user.id, isCurrent ? "CURRENT_DEPOSIT_CREATED" : "HISTORY_DEPOSIT_CREATED", "DepositRecord");

  revalidatePath("/app");
  revalidatePath("/app/current");
  revalidatePath("/app/history");
}

export async function deleteDepositRecord(form: FormData) {
  const user = await requireUser();
  const id = value(form, "id");
  const record = await db.depositRecord.findUnique({ where: { id } });
  if (!record) throw new Error("Record was not found.");

  await db.depositRecord.delete({ where: { id } });
  await audit(user.id, "DEPOSIT_RECORD_DELETED", "DepositRecord", id);

  revalidatePath("/app");
  revalidatePath("/app/current");
  revalidatePath("/app/history");
}

// Basic accounts & budgeting actions
export async function createAccount(form: FormData) {
  const user = await requireUser();
  const input = accountSchema.parse({
    name: value(form, "name"),
    institution: value(form, "institution") || undefined,
    balance: value(form, "balance"),
  });
  const account = await db.account.create({
    data: { ...input, balance: toMinorUnits(input.balance), userId: user.id },
  });
  await audit(user.id, "ACCOUNT_CREATED", "Account", account.id);
  revalidatePath("/app/accounts");
  revalidatePath("/app");
}

export async function deleteAccount(form: FormData) {
  const user = await requireUser();
  const accountId = value(form, "accountId");
  const account = await db.account.findFirst({
    where: { id: accountId, userId: user.id },
    include: { _count: { select: { transactions: true } } },
  });
  if (!account) throw new Error("Account was not found.");
  if (account._count.transactions) throw new Error("Delete transactions before removing account.");
  await db.account.delete({ where: { id: accountId } });
  await audit(user.id, "ACCOUNT_DELETED", "Account", accountId);
  revalidatePath("/app/accounts");
  revalidatePath("/app");
}

export async function createCategory(form: FormData) {
  const user = await requireUser();
  const input = categorySchema.parse({ name: value(form, "name"), color: value(form, "color") });
  const category = await db.category.create({ data: { ...input, userId: user.id } });
  await audit(user.id, "CATEGORY_CREATED", "Category", category.id);
  revalidatePath("/app/categories");
}

export async function deleteCategory(form: FormData) {
  const user = await requireUser();
  const categoryId = value(form, "categoryId");
  const category = await db.category.findFirst({
    where: { id: categoryId, userId: user.id },
    include: { _count: { select: { budgets: true } } },
  });
  if (!category) throw new Error("Category was not found.");
  if (category._count.budgets) throw new Error("Delete budgets in this category first.");
  await db.category.delete({ where: { id: categoryId } });
  await audit(user.id, "CATEGORY_DELETED", "Category", categoryId);
  revalidatePath("/app/categories");
}

export async function createTransaction(form: FormData) {
  const user = await requireUser();
  const input = transactionSchema.parse({
    accountId: value(form, "accountId"),
    categoryId: value(form, "categoryId") || undefined,
    type: value(form, "type"),
    amount: value(form, "amount"),
    description: value(form, "description"),
    occurredOn: value(form, "occurredOn"),
  });
  const account = await db.account.findFirst({ where: { id: input.accountId, userId: user.id } });
  if (!account) throw new Error("Choose a valid account.");

  const transaction = await db.transaction.create({
    data: {
      ...input,
      type: input.type as TransactionType,
      amount: toMinorUnits(input.amount),
      occurredOn: new Date(`${input.occurredOn}T00:00:00.000Z`),
      userId: user.id,
    },
  });
  const balanceDelta =
    transaction.type === TransactionType.INCOME
      ? transaction.amount
      : transaction.type === TransactionType.EXPENSE
      ? -transaction.amount
      : 0;
  if (balanceDelta) {
    await db.account.update({
      where: { id: transaction.accountId },
      data: { balance: { increment: balanceDelta } },
    });
  }
  await audit(user.id, "TRANSACTION_CREATED", "Transaction", transaction.id);
  revalidatePath("/app");
  revalidatePath("/app/transactions");
}

export async function deleteTransaction(form: FormData) {
  const user = await requireUser();
  const transactionId = value(form, "transactionId");
  const transaction = await db.transaction.findFirst({ where: { id: transactionId, userId: user.id } });
  if (!transaction) throw new Error("Transaction was not found.");
  const balanceDelta =
    transaction.type === TransactionType.INCOME
      ? -transaction.amount
      : transaction.type === TransactionType.EXPENSE
      ? transaction.amount
      : 0;
  await db.$transaction([
    db.transaction.delete({ where: { id: transactionId } }),
    ...(balanceDelta
      ? [db.account.update({ where: { id: transaction.accountId }, data: { balance: { increment: balanceDelta } } })]
      : []),
  ]);
  await audit(user.id, "TRANSACTION_DELETED", "Transaction", transactionId);
  revalidatePath("/app/transactions");
  revalidatePath("/app");
}

export async function createBudget(form: FormData) {
  const user = await requireUser();
  const input = budgetSchema.parse({
    categoryId: value(form, "categoryId"),
    limitAmount: value(form, "limitAmount"),
    month: value(form, "month"),
  });
  const month = monthStart(new Date(`${input.month}T00:00:00.000Z`));
  const budget = await db.budget.upsert({
    where: {
      userId_categoryId_month: {
        userId: user.id,
        categoryId: input.categoryId,
        month,
      },
    },
    create: {
      userId: user.id,
      categoryId: input.categoryId,
      month,
      limitAmount: toMinorUnits(input.limitAmount),
    },
    update: { limitAmount: toMinorUnits(input.limitAmount) },
  });
  await audit(user.id, "BUDGET_SAVED", "Budget", budget.id);
  revalidatePath("/app");
  revalidatePath("/app/budgets");
}

export async function deleteBudget(form: FormData) {
  const user = await requireUser();
  const budgetId = value(form, "budgetId");
  const budget = await db.budget.findFirst({ where: { id: budgetId, userId: user.id } });
  if (!budget) throw new Error("Budget was not found.");
  await db.budget.delete({ where: { id: budgetId } });
  await audit(user.id, "BUDGET_DELETED", "Budget", budgetId);
  revalidatePath("/app/budgets");
  revalidatePath("/app");
}
