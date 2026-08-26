import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().trim().min(2).max(80),
  institution: z.string().trim().max(80).optional(),
  balance: z.coerce.number().finite(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#0f766e"),
});

export const transactionSchema = z.object({
  accountId: z.string().cuid(),
  categoryId: z.string().cuid().optional(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.coerce.number().positive().finite(),
  description: z.string().trim().min(2).max(140),
  occurredOn: z.string().date(),
});

export const budgetSchema = z.object({
  categoryId: z.string().cuid(),
  limitAmount: z.coerce.number().positive().finite(),
  month: z.string().date(),
});
