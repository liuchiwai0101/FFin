"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SortableTable } from "@/components/sortable-table";
import { useDepositData } from "@/components/deposit-provider";
import { formatAmount, formatDate, formatRate } from "@/lib/finance";

export default function HistoryPage() {
  const params = useSearchParams();
  const userFilter = params.get("user") || "All";
  const bankFilter = params.get("bank") || "All";
  const searchFilter = (params.get("search") || "").toLowerCase();
  const { ready, historyRecords, activeRecords, upsertRecord, deleteRecord } = useDepositData();

  const allRecords = [...historyRecords].sort(
    (a, b) => (a.fromDate?.getTime() ?? 0) - (b.fromDate?.getTime() ?? 0),
  );

  const filtered = allRecords.filter((r) => {
    if (userFilter !== "All" && r.ownerName !== userFilter) return false;
    if (bankFilter !== "All" && !r.bank.toUpperCase().includes(bankFilter.toUpperCase())) return false;
    if (searchFilter) {
      const matchProduct = r.product.toLowerCase().includes(searchFilter);
      const matchNotes = (r.notes || "").toLowerCase().includes(searchFilter);
      if (!matchProduct && !matchNotes) return false;
    }
    return true;
  });

  const totalInterestEarned = filtered.reduce((sum, r) => sum + (r.interest || 0), 0);
  // Actual current holdings for selected user (not cumulative historical matured volume)
  const selectedUserTotal = activeRecords
    .filter((r) => {
      if (userFilter !== "All" && r.ownerName !== userFilter) return false;
      if (bankFilter !== "All" && !r.bank.toUpperCase().includes(bankFilter.toUpperCase())) return false;
      return true;
    })
    .reduce((sum, r) => sum + r.amount, 0);
  const selectedUserLabel = userFilter === "All" ? "All members" : userFilter;
  const avgRate =
    filtered.length > 0
      ? filtered.reduce((sum, r) => sum + (r.rate || 0), 0) / filtered.length
      : 0;

  const users = ["All", "MA", "Vin", "Miki", "BABA"];
  const banks = ["All", "BOC", "HS", "SC", "HSBC", "ICBC"];

  if (!ready) {
    return <div className="card p-6 text-sm text-slate-500">Loading…</div>;
  }

  if (allRecords.length === 0) {
    return (
      <div className="card p-8 max-w-xl space-y-3">
        <h1 className="text-2xl font-bold text-slate-900">No history loaded</h1>
        <p className="text-sm text-slate-600">Upload Excel to load matured interest records.</p>
        <Link className="button inline-flex" href="/app/sync">
          Upload Excel
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Historical Returns</span>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            Interest History &amp; Matured Records
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Chronological audit of all past term deposits, bonds, and interest payouts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">
            Showing <strong className="text-slate-900">{filtered.length}</strong> historical records
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card space-y-4 p-4 shadow-sm">
        {/* Member filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-16">Member:</span>
          <div className="flex flex-wrap gap-1.5">
            {users.map((u) => (
              <a
                key={u}
                href={`/app/history?user=${u}&bank=${bankFilter}`}
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

        {/* Bank filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-16">Bank:</span>
          <div className="flex flex-wrap gap-1.5">
            {banks.map((b) => (
              <a
                key={b}
                href={`/app/history?user=${userFilter}&bank=${b}`}
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
      </div>

      {/* Metrics Row */}
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="card p-4">
          <span className="text-xs font-bold uppercase text-slate-500 truncate block">Selected User Total</span>
          <p className="kpi-value mt-1 text-slate-900">{formatAmount(selectedUserTotal, "HKD")}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{selectedUserLabel} · current principal</p>
        </div>
        <div className="card p-4 bg-emerald-50/40 border-emerald-100">
          <span className="text-xs font-bold uppercase text-emerald-800 truncate block">Total Interest Earned</span>
          <p className="kpi-value mt-1 text-emerald-700">+{formatAmount(totalInterestEarned, "HKD")}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Realized cash flow</p>
        </div>
        <div className="card p-4">
          <span className="text-xs font-bold uppercase text-slate-500 truncate block">Average Historical Rate</span>
          <p className="kpi-value mt-1 text-teal-900">{formatRate(avgRate)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Simple average of coupons</p>
        </div>
      </div>

      {/* History Table */}
      <section className="card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <SortableTable
            defaultSortKey="fromDate"
            defaultSortDir="asc"
            columns={[
              { key: "seq", label: "Seq #", type: "number" },
              { key: "ownerName", label: "Member" },
              { key: "bank", label: "Bank" },
              { key: "product", label: "Product / Instrument" },
              { key: "amount", label: "Principal", className: "text-right", type: "number" },
              { key: "rate", label: "Rate", className: "text-center", type: "number" },
              { key: "fromDate", label: "Tenor & Dates", type: "date" },
              { key: "interest", label: "Interest Earned", className: "text-right", type: "number" },
              { key: "totalAmount", label: "Total Payout", className: "text-right", type: "number" },
              { key: "action", label: "Action", className: "text-right", sortable: false },
            ]}
            rows={filtered.map((r, index) => {
              const isBond = r.product.includes("Bond") || r.product.includes("債券");
              const payout = r.totalAmount || r.amount + (r.interest ?? 0);
              return {
                id: r.id,
                values: {
                  seq: index + 1,
                  ownerName: r.ownerName,
                  bank: r.bank,
                  product: r.product,
                  amount: r.amount,
                  rate: r.rate ?? null,
                  fromDate: r.fromDate ? r.fromDate.getTime() : null,
                  interest: r.interest ?? 0,
                  totalAmount: payout,
                },
                cells: [
                  <td key="seq" className="text-slate-400 font-mono text-xs">
                    #{index + 1}
                  </td>,
                  <td key="ownerName">
                    <span className="inline-flex items-center gap-1.5 font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded-md">
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
                        <span className="ml-1.5 text-[10px] text-slate-400 font-mono">{r.notes}</span>
                      )}
                    </div>
                  </td>,
                  <td key="amount" className="text-right font-mono font-bold text-slate-950 text-xs">
                    {formatAmount(r.amount, r.currency)}
                  </td>,
                  <td key="rate" className="text-center">
                    <span className="badge text-[11px] font-mono font-bold">
                      {formatRate(r.rate)}
                    </span>
                  </td>,
                  <td key="fromDate" className="text-xs text-slate-600 whitespace-nowrap">
                    <div>
                      {formatDate(r.fromDate)} &rarr; {formatDate(r.toDate)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {r.months ? `${r.months} Months` : ""}
                    </div>
                  </td>,
                  <td key="interest" className="text-right font-mono text-xs font-bold text-emerald-700">
                    +{(r.interest ?? 0) > 0 ? formatAmount(r.interest ?? 0, r.currency) : "0.00"}
                  </td>,
                  <td key="totalAmount" className="text-right font-mono text-xs font-black text-slate-950">
                    {formatAmount(payout, r.currency)}
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
            emptyMessage="No historical records match these filters."
          />
        </div>
      </section>

      {/* Add Historical Record Form */}
      <section className="card p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Add Historical Record</h2>
        <p className="text-xs text-slate-500 mb-4">Record a matured term deposit or past coupon payout</p>

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
            const interestInput = String(form.get("interest") ?? "").trim();
            const interest = interestInput
              ? parseFloat(interestInput)
              : rate && months
                ? amount * rate * (months / 12)
                : 0;
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
              isCurrent: false,
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
            Interest Earned
            <input name="interest" type="number" step="0.01" placeholder="Actual interest earned" />
          </label>

          <button className="button">Save History Record</button>
        </form>
      </section>
    </div>
  );
}
