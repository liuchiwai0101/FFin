import Link from "next/link";

export default function RemovedLedgerPage() {
  return (
    <div className="card p-8 max-w-lg">
      <h1 className="text-xl font-bold text-slate-900">Feature removed</h1>
      <p className="mt-2 text-sm text-slate-600">
        Accounts, categories, transactions, and budgets required a database. This app now uses Excel upload only.
      </p>
      <Link className="button mt-4 inline-flex" href="/app/sync">
        Go to Excel Sync
      </Link>
    </div>
  );
}
