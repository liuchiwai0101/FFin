import Link from "next/link";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { formatMoney, monthStart } from "@/lib/finance";
import { createBudget, deleteBudget } from "../actions";

export default async function BudgetsPage() {
  const user = await requireUser();
  const start = monthStart();
  const [categories, budgets] = await Promise.all([
    db.category.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    db.budget.findMany({ where: { userId: user.id, month: start }, include: { category: true } }),
  ]);

  return (
    <div className="page">
      <h2>Monthly budgets</h2>
      <p className="subtitle">Set and track category spending limits.</p>

      {categories.length === 0 ? (
        <div className="card mt-6 border-dashed border-teal-200 bg-teal-50/50 p-6 text-center">
          <p className="font-semibold text-slate-800">No categories found</p>
          <p className="mt-1 text-sm text-slate-500">
            You need to create at least one category before you can set a budget.
          </p>
          <div className="mt-4">
            <Link className="button" href="/app/categories">
              Create your first category
            </Link>
          </div>
        </div>
      ) : (
        <form action={createBudget} className="card form-grid mt-6">
          <label>
            Category
            <select required name="categoryId">
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Monthly limit (USD)
            <input required name="limitAmount" type="number" min="0.01" step="0.01" placeholder="e.g. 500.00" />
          </label>
          <label>
            Month
            <input required name="month" type="date" defaultValue={start.toISOString().slice(0, 10)} />
          </label>
          <button className="button">Save budget</button>
        </form>
      )}

      <div className="mt-6">
        <h3 className="text-base font-semibold text-slate-900">Active budgets ({budgets.length})</h3>
        {budgets.length === 0 ? (
          <div className="card mt-3 text-center py-8">
            <p className="text-sm text-slate-500">No budgets set for this month yet.</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {budgets.map((budget) => (
              <div className="card flex items-start justify-between" key={budget.id}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: budget.category.color }} />
                    <p className="font-semibold text-slate-900">{budget.category.name}</p>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {formatMoney(budget.limitAmount, "USD")}
                  </p>
                  <p className="text-xs text-slate-500">Monthly limit</p>
                </div>
                <form action={deleteBudget}>
                  <input type="hidden" name="budgetId" value={budget.id} />
                  <button className="text-xs font-medium text-rose-600 hover:text-rose-800">Delete</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
