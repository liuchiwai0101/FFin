"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SortableTable } from "@/components/sortable-table";
import { useDepositData } from "@/components/deposit-provider";
import { useViewer } from "@/components/user-context";
import { formatAmount, formatDate, formatRate } from "@/lib/finance";
import { isAdmin } from "@/lib/users";

export default function CurrentProductsPage() {
  const params = useSearchParams();
  const viewer = useViewer();
  const admin = isAdmin(viewer);
  const userFilter = admin ? params.get("user") || "All" : viewer.ownerKey;
  const bankFilter = params.get("bank") || "All";
  const typeFilter = params.get("type") || "All";
  const { ready, activeRecords, upsertRecord, deleteRecord } = useDepositData();

  const allRecords = [...activeRecords].sort((a, b) => {
    const byOwner = a.ownerName.localeCompare(b.ownerName);
    if (byOwner !== 0) return byOwner;
    return b.amount - a.amount;
  });

  // Filter records
  const filtered = allRecords.filter((r) => {
    if (userFilter !== "All" && r.ownerName !== userFilter) return false;
    if (bankFilter !== "All" && !r.bank.toUpperCase().includes(bankFilter.toUpperCase())) return false;
    if (typeFilter !== "All") {
      if (typeFilter === "Bond" && !r.product.includes("Bond") && !r.product.includes("債券")) return false;
      if (typeFilter === "TimeDeposit" && !r.product.includes("Time Deposit") && !r.product.includes("定存")) return false;
      if (typeFilter === "Demand" && !r.product.includes("Demand") && !r.product.includes("Savings")) return false;
      if (typeFilter === "RMB" && !r.product.includes("RMB")) return false;
    }
    return true;
  });

  const totalAmount = filtered.reduce((sum, r) => sum + r.amount, 0);
  const totalInterest = filtered.reduce((sum, r) => sum + (r.interest || 0), 0);
  const totalMaturity = filtered.reduce((sum, r) => sum + (r.totalAmount || r.amount), 0);

  const users = ["All", "MA", "Vin", "Miki"];
  const banks = ["All", "SC", "HS", "HSBC", "ICBC", "BOC"];
  const types = [
    { id: "All", label: "All Products" },
    { id: "TimeDeposit", label: "Time Deposits (定期)" },
    { id: "Bond", label: "Bonds (債券)" },
    { id: "RMB", label: "RMB Deposits (人民幣)" },
    { id: "Demand", label: "Demand / Savings (活期)" },
  ];

  if (!ready) {
    return <div className="card p-6 text-sm text-slate-500">Loading…</div>;
  }

  if (allRecords.length === 0) {
    return (
      <div className="card p-8 max-w-xl space-y-3">
        <h1 className="text-2xl font-bold text-slate-900">No current products</h1>
        <p className="text-sm text-slate-600">
          {admin
            ? "Upload Excel to load active holdings."
            : "No holdings are visible for your account yet. Ask Vin (admin) to upload the family Excel workbook."}
        </p>
        {admin && (
          <Link className="button inline-flex" href="/app/sync">
            Upload Excel
          </Link>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Active Portfolio</span>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            Current Products &amp; Term Deposits
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Snapshot of active fixed deposits, retail bonds, and bank balances.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">
            Showing <strong className="text-slate-900">{filtered.length}</strong> of {allRecords.length} holdings
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card space-y-4 p-4 shadow-sm">
        {/* Filter by User (admin only) */}
        {admin && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-16">Member:</span>
          <div className="flex flex-wrap gap-1.5">
            {users.map((u) => (
              <a
                key={u}
                href={`/app/current?user=${u}&bank=${bankFilter}&type=${typeFilter}`}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  userFilter === u
                    ? "bg-teal-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {u}
              </a>
            ))}
          </div>
        </div>
        )}

        {/* Filter by Bank */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-16">Bank:</span>
          <div className="flex flex-wrap gap-1.5">
            {banks.map((b) => (
              <a
                key={b}
                href={`/app/current?user=${userFilter}&bank=${b}&type=${typeFilter}`}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  bankFilter === b
                    ? "bg-teal-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {b}
              </a>
            ))}
          </div>
        </div>

        {/* Filter by Product Type */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-16">Type:</span>
          <div className="flex flex-wrap gap-1.5">
            {types.map((t) => (
              <a
                key={t.id}
                href={`/app/current?user=${userFilter}&bank=${bankFilter}&type=${t.id}`}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  typeFilter === t.id
                    ? "bg-teal-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {t.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Summary Metrics */}
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="card p-4">
          <span className="text-xs font-bold uppercase text-slate-500 truncate block">Filtered Principal</span>
          <p className="kpi-value mt-1 text-slate-900">{formatAmount(totalAmount, "HKD")}</p>
        </div>
        <div className="card p-4 bg-emerald-50/40 border-emerald-100">
          <span className="text-xs font-bold uppercase text-emerald-800 truncate block">Filtered Expected Interest</span>
          <p className="kpi-value mt-1 text-emerald-700">+{formatAmount(totalInterest, "HKD")}</p>
        </div>
        <div className="card p-4">
          <span className="text-xs font-bold uppercase text-slate-500 truncate block">Total Maturity Value</span>
          <p className="kpi-value mt-1 text-teal-900">{formatAmount(totalMaturity, "HKD")}</p>
        </div>
      </div>

      {/* Active Holdings Table */}
      <section className="card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <SortableTable
            defaultSortKey="ownerName"
            columns={[
              { key: "ownerName", label: "Member" },
              { key: "bank", label: "Bank" },
              { key: "product", label: "Product / Instrument" },
              { key: "amount", label: "Principal", className: "text-right", type: "number" },
              { key: "rate", label: "Rate", className: "text-center", type: "number" },
              { key: "toDate", label: "Tenor & Dates", type: "date" },
              { key: "interest", label: "Interest", className: "text-right", type: "number" },
              { key: "totalAmount", label: "Total Return", className: "text-right", type: "number" },
              { key: "action", label: "Action", className: "text-right", sortable: false },
            ]}
            rows={filtered.map((r) => {
              const isBond = r.product.includes("Bond") || r.product.includes("債券");
              return {
                id: r.id,
                values: {
                  ownerName: r.ownerName,
                  bank: r.bank,
                  product: r.product,
                  amount: r.amount,
                  rate: r.rate ?? null,
                  toDate: r.toDate ? r.toDate.getTime() : null,
                  interest: r.interest ?? 0,
                  totalAmount: r.totalAmount || r.amount,
                },
                cells: [
                  <td key="ownerName">
                    <span className="inline-flex items-center gap-1.5 font-bold text-slate-900 text-xs bg-slate-100 px-2.5 py-1 rounded-full">
                      <span className="h-2 w-2 rounded-full bg-teal-600" />
                      {r.ownerName}
                    </span>
                  </td>,
                  <td key="bank">
                    <span className="font-bold text-slate-800 text-xs bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                      {r.bank}
                    </span>
                  </td>,
                  <td key="product">
                    <div>
                      <span className={`text-xs font-semibold ${isBond ? "text-amber-800" : "text-slate-800"}`}>
                        {r.product}
                      </span>
                      {r.notes && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{r.notes}</p>
                      )}
                    </div>
                  </td>,
                  <td key="amount" className="text-right font-mono font-bold text-slate-950 text-xs">
                    {formatAmount(r.amount, r.currency)}
                  </td>,
                  <td key="rate" className="text-center">
                    {r.rate ? (
                      <span className="badge text-[11px] font-mono font-bold">
                        {formatRate(r.rate)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>,
                  <td key="toDate" className="text-xs text-slate-600 whitespace-nowrap">
                    {r.fromDate && r.toDate ? (
                      <div>
                        <div>
                          {formatDate(r.fromDate)} &rarr; {formatDate(r.toDate)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {r.months ? `${r.months} Months` : ""}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">Demand / Flexible</span>
                    )}
                  </td>,
                  <td key="interest" className="text-right font-mono text-xs font-bold text-emerald-700">
                    {(r.interest ?? 0) > 0 ? `+${formatAmount(r.interest ?? 0, r.currency)}` : "—"}
                  </td>,
                  <td key="totalAmount" className="text-right font-mono text-xs font-black text-slate-950">
                    {formatAmount(r.totalAmount || r.amount, r.currency)}
                  </td>,
                  <td key="action" className="text-right">
                    <button
                      type="button"
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                      onClick={() => deleteRecord(r.id)}
                    >
                      Delete
                    </button>
                  </td>,
                ],
              };
            })}
            emptyMessage="No current products match these filters."
          />
        </div>
      </section>

      {/* Add New Product Form */}
      <section className="card p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Add New Product / Term Deposit</h2>
        <p className="text-xs text-slate-500 mb-4">Record a new fixed deposit, bond, or bank position</p>

        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const amount = parseFloat(String(form.get("amount") ?? "0"));
            const rateInput = String(form.get("rate") ?? "").trim();
            const rate = rateInput ? parseFloat(rateInput) / (parseFloat(rateInput) > 1 ? 100 : 1) : null;
            const monthsInput = String(form.get("months") ?? "").trim();
            const months = monthsInput ? parseFloat(monthsInput) : null;
            const interest = rate && months ? amount * rate * (months / 12) : 0;
            upsertRecord({
              ownerName: String(form.get("ownerName") ?? "Vin"),
              bank: String(form.get("bank") ?? ""),
              product: String(form.get("product") ?? ""),
              amount,
              rate,
              fromDate: String(form.get("fromDate") ?? "") || null,
              toDate: String(form.get("toDate") ?? "") || null,
              months,
              interest,
              totalAmount: amount + interest,
              currency: String(form.get("currency") ?? "HKD"),
              isCurrent: true,
              notes: String(form.get("notes") ?? "") || null,
            });
            event.currentTarget.reset();
          }}
        >
          <label>
            Member Name
            <select name="ownerName" required defaultValue="Vin">
              <option value="Vin">Vin</option>
              <option value="MA">MA</option>
              <option value="Miki">Miki</option>
              <option value="BABA">BABA</option>
            </select>
          </label>

          <label>
            Bank
            <input name="bank" required placeholder="e.g. SC, HS, HSBC, BOC, ICBC" />
          </label>

          <label>
            Product Type / Name
            <input name="product" required placeholder="e.g. Time Deposit, 綠色債券, Bond" />
          </label>

          <label>
            Principal Amount
            <input name="amount" type="number" step="0.01" required placeholder="100000" />
          </label>

          <label>
            Annual Rate %
            <input name="rate" type="number" step="0.001" placeholder="e.g. 3.5 or 0.035" />
          </label>

          <label>
            From Date
            <input name="fromDate" type="date" />
          </label>

          <label>
            To Date
            <input name="toDate" type="date" />
          </label>

          <label>
            Tenor (Months)
            <input name="months" type="number" step="0.1" placeholder="e.g. 3, 6, 12, 36" />
          </label>

          <label>
            Currency
            <select name="currency" defaultValue="HKD">
              <option value="HKD">HKD</option>
              <option value="USD">USD</option>
              <option value="RMB">RMB</option>
            </select>
          </label>

          <label>
            Notes / Details
            <input name="notes" placeholder="Optional notes" />
          </label>

          <button className="button">Save Product Record</button>
        </form>
      </section>
    </div>
  );
}
