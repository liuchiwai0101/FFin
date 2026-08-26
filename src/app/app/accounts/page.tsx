import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/finance";
import { createAccount, deleteAccount } from "../actions";

export default async function AccountsPage() {
  const user = await requireUser();
  const accounts = await db.account.findMany({
    where: { userId: user.id },
    include: { _count: { select: { transactions: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="page">
      <h2>Accounts</h2>
      <p className="subtitle">Track balances across your checking, savings, and investment accounts.</p>

      <form action={createAccount} className="card form-grid mt-6">
        <label>
          Account name
          <input required name="name" placeholder="e.g. Everyday Checking, Main Savings" />
        </label>
        <label>
          Institution
          <input name="institution" placeholder="e.g. Chase, HSBC (Optional)" />
        </label>
        <label>
          Opening balance (USD)
          <input required name="balance" type="number" step="0.01" defaultValue="0" />
        </label>
        <button className="button">Add account</button>
      </form>

      <div className="mt-6">
        <h3 className="text-base font-semibold text-slate-900">Accounts list ({accounts.length})</h3>
        {accounts.length === 0 ? (
          <div className="card mt-3 text-center py-8">
            <p className="text-sm text-slate-500">No accounts registered yet. Add your first account above.</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {accounts.map((account) => (
              <div className="card flex flex-col justify-between" key={account.id}>
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-base font-bold text-slate-900">{account.name}</p>
                      <p className="text-xs text-slate-500">{account.institution ?? "Personal account"}</p>
                    </div>
                    <span className="badge">{account._count.transactions} entries</span>
                  </div>
                  <p className="mt-4 text-2xl font-black tracking-tight text-slate-950">
                    {formatMoney(account.balance, account.currency)}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <form action={deleteAccount}>
                    <input type="hidden" name="accountId" value={account.id} />
                    <button className="text-xs font-medium text-rose-600 hover:text-rose-800">Delete account</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
