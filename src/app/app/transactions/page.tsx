import Link from "next/link";
import { SortableTable } from "@/components/sortable-table";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/finance";
import { createTransaction, deleteTransaction } from "../actions";

export default async function TransactionsPage() {
  const user = await requireUser();
  const [accounts, categories, transactions] = await Promise.all([
    db.account.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    db.category.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    db.transaction.findMany({
      where: { userId: user.id },
      include: { account: true, category: true },
      orderBy: { occurredOn: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="page">
      <h2>Transactions</h2>
      <p className="subtitle">A transparent record of all money movement across your accounts.</p>

      {accounts.length === 0 ? (
        <div className="card mt-6 border-dashed border-teal-200 bg-teal-50/50 p-6 text-center">
          <p className="font-semibold text-slate-800">No accounts available</p>
          <p className="mt-1 text-sm text-slate-500">
            You need to add at least one account before recording transactions.
          </p>
          <div className="mt-4">
            <Link className="button" href="/app/accounts">
              Create your first account
            </Link>
          </div>
        </div>
      ) : (
        <form action={createTransaction} className="card form-grid mt-6">
          <label>
            Description
            <input required name="description" placeholder="e.g. Salary, Supermarket, Rent" />
          </label>
          <label>
            Amount (USD)
            <input required name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" />
          </label>
          <label>
            Type
            <select name="type">
              <option value="EXPENSE">Expense (-)</option>
              <option value="INCOME">Income (+)</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </label>
          <label>
            Account
            <select required name="accountId">
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select name="categoryId">
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input required name="occurredOn" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          </label>
          <button className="button">Save transaction</button>
        </form>
      )}

      <div className="mt-6">
        <h3 className="text-base font-semibold text-slate-900">Recent transactions ({transactions.length})</h3>
        {transactions.length === 0 ? (
          <div className="card mt-3 text-center py-8">
            <p className="text-sm text-slate-500">No transactions recorded yet.</p>
          </div>
        ) : (
          <div className="card mt-3 overflow-x-auto">
            <SortableTable
              defaultSortKey="date"
              defaultSortDir="desc"
              columns={[
                { key: "date", label: "Date", type: "date" },
                { key: "description", label: "Description" },
                { key: "account", label: "Account" },
                { key: "category", label: "Category" },
                { key: "amount", label: "Amount", className: "text-right", type: "number" },
                { key: "action", label: "Action", className: "text-right", sortable: false },
              ]}
              rows={transactions.map((item) => ({
                id: item.id,
                values: {
                  date: item.occurredOn.getTime(),
                  description: item.description,
                  account: item.account.name,
                  category: item.category?.name ?? "Uncategorized",
                  amount: item.type === "EXPENSE" ? -item.amount : item.amount,
                },
                cells: [
                  <td key="date" className="text-slate-600 whitespace-nowrap">
                    {item.occurredOn.toLocaleDateString()}
                  </td>,
                  <td key="description" className="font-semibold text-slate-900">
                    {item.description}
                  </td>,
                  <td key="account" className="text-slate-600">
                    {item.account.name}
                  </td>,
                  <td key="category">
                    {item.category ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.category.color }} />
                        {item.category.name}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Uncategorized</span>
                    )}
                  </td>,
                  <td
                    key="amount"
                    className={`text-right font-bold whitespace-nowrap ${
                      item.type === "EXPENSE" ? "text-rose-600" : "text-teal-700"
                    }`}
                  >
                    {item.type === "EXPENSE" ? "-" : "+"}
                    {formatMoney(item.amount, "USD")}
                  </td>,
                  <td key="action" className="text-right">
                    <form action={deleteTransaction} className="inline">
                      <input type="hidden" name="transactionId" value={item.id} />
                      <button className="text-xs font-medium text-rose-600 hover:text-rose-800">
                        Delete
                      </button>
                    </form>
                  </td>,
                ],
              }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
