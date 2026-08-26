import Link from "next/link";
import { SortableTable } from "@/components/sortable-table";
import { loadDepositRecords } from "@/lib/deposit-store";
import { formatAmount, formatRate } from "@/lib/finance";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const activeRecords = loadDepositRecords({ isCurrent: true }).sort((a, b) => b.amount - a.amount);
  const historyRecords = loadDepositRecords({ isCurrent: false }).sort(
    (a, b) => (b.fromDate?.getTime() ?? 0) - (a.fromDate?.getTime() ?? 0),
  );

  // Total metrics
  const totalPrincipal = activeRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalActiveInterest = activeRecords.reduce((sum, r) => sum + (r.interest || 0), 0);
  const totalHistoryInterest = historyRecords.reduce((sum, r) => sum + (r.interest || 0), 0);

  // Active yield calculation
  const weightedRateSum = activeRecords.reduce((sum, r) => sum + r.amount * (r.rate || 0), 0);
  const weightedAvgRate = totalPrincipal > 0 ? weightedRateSum / totalPrincipal : 0;

  // Unique Users & Banks
  const users = ["MA", "Vin", "Miki", "BABA"];
  const banks = ["SC", "HS", "HSBC", "ICBC", "BOC"];

  // Normalize bank name for aggregation
  function normalizeBank(b: string) {
    if (b.includes("HSBC") || b.includes("MA HSBC")) return "HSBC";
    if (b.includes("SC")) return "SC";
    if (b.includes("HS")) return "HS";
    if (b.includes("ICBC")) return "ICBC";
    if (b.includes("BOC")) return "BOC";
    return b;
  }

  // 1. Bank Distribution Matrix: Bank x User -> Amount
  const bankUserMatrix: Record<string, Record<string, number>> = {};
  const userTotals: Record<string, number> = { MA: 0, Vin: 0, Miki: 0, BABA: 0 };

  banks.forEach((b) => {
    bankUserMatrix[b] = { MA: 0, Vin: 0, Miki: 0, BABA: 0, total: 0 };
  });

  activeRecords.forEach((r) => {
    const b = normalizeBank(r.bank);
    const u = r.ownerName;
    if (bankUserMatrix[b] && bankUserMatrix[b][u] !== undefined) {
      bankUserMatrix[b][u] += r.amount;
      bankUserMatrix[b].total += r.amount;
    }
    if (userTotals[u] !== undefined) {
      userTotals[u] += r.amount;
    }
  });

  // 2. Interest Matrix: User x Bank -> Interest
  const userInterestMatrix: Record<string, Record<string, number>> = {};
  const bankInterestTotals: Record<string, number> = { BOC: 0, HS: 0, SC: 0, HSBC: 0, ICBC: 0, total: 0 };

  users.forEach((u) => {
    userInterestMatrix[u] = { BOC: 0, HS: 0, SC: 0, HSBC: 0, ICBC: 0, total: 0 };
  });

  const allRecords = [...activeRecords, ...historyRecords];
  allRecords.forEach((r) => {
    const b = normalizeBank(r.bank);
    const u = r.ownerName;
    const interest = r.interest || 0;
    if (userInterestMatrix[u] && userInterestMatrix[u][b] !== undefined) {
      userInterestMatrix[u][b] += interest;
      userInterestMatrix[u].total += interest;
    }
    if (bankInterestTotals[b] !== undefined) {
      bankInterestTotals[b] += interest;
      bankInterestTotals.total += interest;
    }
  });

  // 3. Product Breakdown
  const productTotals: Record<string, { amount: number; count: number; interest: number }> = {};
  activeRecords.forEach((r) => {
    let group = "Time Deposit (定期存款)";
    if (r.product.includes("債券") || r.product.includes("Bond")) group = "Bonds (債券/零售債券)";
    else if (r.product.includes("RMB")) group = "RMB Deposit (人民幣定存)";
    else if (r.product.includes("Demand") || r.product.includes("Savings")) group = "Demand / Cash (活期儲蓄)";
    else if (r.product.includes("馬拉松")) group = "Marathon Deposit (馬拉松定存)";

    if (!productTotals[group]) productTotals[group] = { amount: 0, count: 0, interest: 0 };
    productTotals[group].amount += r.amount;
    productTotals[group].count += 1;
    productTotals[group].interest += r.interest || 0;
  });

  // 4. Multi-Year Compounding Projections (from Sheet Base: 7,215,525.50)
  const baseCapital = 7215525.50;
  const projections = [
    { year: "Year 1 (第1年)", cRate: 0.0248, tRate: 0.07 },
    { year: "Year 2 (第2年)", cRate: 0.0248, tRate: 0.07 },
    { year: "Year 3 (第3年)", cRate: 0.0200, tRate: 0.07 },
    { year: "Year 4 (第4年)", cRate: 0.0200, tRate: 0.07 },
    { year: "Year 5 (第5年)", cRate: 0.0100, tRate: 0.07 },
    { year: "Year 6 (第6年)", cRate: 0.0100, tRate: 0.07 },
  ];

  let currentCBase = baseCapital;
  let currentTBase = baseCapital;
  const projectionRows = projections.map((p) => {
    const cBaseNext = currentCBase * (1 + p.cRate);
    const cInterest = cBaseNext * p.cRate;
    currentCBase = cBaseNext;

    const tBaseNext = currentTBase * (1 + p.tRate);
    const tInterest = tBaseNext * p.tRate;
    currentTBase = tBaseNext;

    return {
      year: p.year,
      cBase: cBaseNext,
      cRate: p.cRate,
      cInterest,
      tBase: tBaseNext,
      tRate: p.tRate,
      tInterest,
    };
  });

  const totalConservativeProfit = currentCBase - baseCapital;
  const totalTargetProfit = currentTBase - baseCapital;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Portfolio Distribution &amp; Yield</span>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Asset Snapshot &amp; Bank Interest Summary
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Real-time distribution across banks, users, active products, and historical interest returns.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link className="button-secondary text-xs" href="/app/current">
            View Current Products &rarr;
          </Link>
          <Link className="button text-xs" href="/app/sync">
            Upload / Sync Excel
          </Link>
        </div>
      </div>

      {/* Top Level KPI Cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {/* Card 1: Total Principal */}
        <div className="card bg-gradient-to-br from-white to-teal-50/40 border-teal-100/80 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Active Principal</p>
          <p className="kpi-value mt-1.5 text-teal-950 font-mono">
            {formatAmount(totalPrincipal, "HKD")}
          </p>
          <p className="mt-1 text-[11px] text-teal-700 font-semibold">{activeRecords.length} active holdings</p>
        </div>

        {/* Card 2: Expected Active Interest */}
        <div className="card bg-gradient-to-br from-white to-emerald-50/40 border-emerald-100/80 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Expected Active Interest</p>
          <p className="kpi-value mt-1.5 text-emerald-700 font-mono">
            +{formatAmount(totalActiveInterest, "HKD")}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">From current term deposits &amp; bonds</p>
        </div>

        {/* Card 3: Weighted Avg Yield */}
        <div className="card p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Weighted Average Yield</p>
          <p className="kpi-value mt-1.5 text-slate-900 font-mono">
            {formatRate(weightedAvgRate)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Annualized across active assets</p>
        </div>

        {/* Card 4: Historical Interest */}
        <div className="card bg-gradient-to-br from-white to-blue-50/40 border-blue-100/80 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cumulative Historical Interest</p>
          <p className="kpi-value mt-1.5 text-blue-900 font-mono">
            +{formatAmount(totalHistoryInterest, "HKD")}
          </p>
          <p className="mt-1 text-[11px] text-blue-700 font-semibold">{historyRecords.length} matured historical terms</p>
        </div>
      </section>

      {/* User Summary Cards */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            User Asset Breakdown
          </h2>
          <span className="text-xs text-slate-500 font-medium font-mono">
            Total: {formatAmount(totalPrincipal, "HKD")}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {users.map((u) => {
            const userAmount = userTotals[u] || 0;
            const pct = totalPrincipal > 0 ? (userAmount / totalPrincipal) * 100 : 0;
            const userInterest = userInterestMatrix[u]?.total || 0;
            return (
              <div
                key={u}
                className="card flex flex-col justify-between border-slate-200 hover:border-teal-300 transition-all p-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="h-6 w-6 rounded-full bg-teal-100 text-teal-800 font-black text-xs flex items-center justify-center">
                      {u.slice(0, 2)}
                    </span>
                    <span className="badge text-[10px] font-bold">{pct.toFixed(1)}% share</span>
                  </div>
                  <h3 className="mt-2 text-sm font-black text-slate-900">{u}</h3>
                  <p className="user-stat-value mt-1 text-slate-950 font-mono">
                    {formatAmount(userAmount, "HKD")}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">Interest:</span>
                  <span className="font-bold text-emerald-700 font-mono text-[11px]">
                    +{formatAmount(userInterest, "HKD")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Table 1: Bank Distribution Matrix */}
      <section className="card shadow-sm overflow-hidden">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Bank Distribution Matrix (銀行資產分佈表)</h2>
            <p className="text-xs text-slate-500">Snapshot of active deposit and bond principal across all financial institutions</p>
          </div>
          <Link className="text-xs font-semibold text-teal-700 hover:underline" href="/app/current">
            View details &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
          <SortableTable
            defaultSortKey="total"
            defaultSortDir="desc"
            columns={[
              { key: "bank", label: "Bank", className: "w-36" },
              { key: "MA", label: "MA", className: "text-right", type: "number" },
              { key: "Vin", label: "Vin", className: "text-right", type: "number" },
              { key: "Miki", label: "Miki", className: "text-right", type: "number" },
              { key: "BABA", label: "BABA", className: "text-right", type: "number" },
              {
                key: "total",
                label: "Total Principal",
                className: "text-right font-bold text-slate-900 bg-slate-100/70",
                type: "number",
              },
              {
                key: "pct",
                label: "% Share",
                className: "text-right w-20 font-bold text-slate-900",
                type: "number",
              },
            ]}
            rows={banks.map((b) => {
              const row = bankUserMatrix[b];
              const pct = totalPrincipal > 0 ? (row.total / totalPrincipal) * 100 : 0;
              return {
                id: b,
                values: {
                  bank: b,
                  MA: row.MA,
                  Vin: row.Vin,
                  Miki: row.Miki,
                  BABA: row.BABA,
                  total: row.total,
                  pct,
                },
                cells: [
                  <td key="bank" className="font-bold text-slate-900 whitespace-nowrap">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-black mr-2 font-mono">
                      {b}
                    </span>
                    <span className="text-xs text-slate-700">
                      {b === "SC"
                        ? "Standard Chartered"
                        : b === "HS"
                          ? "Hang Seng"
                          : b === "HSBC"
                            ? "HSBC / MA HSBC"
                            : b === "ICBC"
                              ? "ICBC Asia"
                              : "Bank of China"}
                    </span>
                  </td>,
                  <td key="MA" className="text-right text-slate-700 font-mono text-xs whitespace-nowrap">
                    {row.MA > 0 ? formatAmount(row.MA, "HKD") : "—"}
                  </td>,
                  <td key="Vin" className="text-right text-slate-700 font-mono text-xs whitespace-nowrap">
                    {row.Vin > 0 ? formatAmount(row.Vin, "HKD") : "—"}
                  </td>,
                  <td key="Miki" className="text-right text-slate-700 font-mono text-xs whitespace-nowrap">
                    {row.Miki > 0 ? formatAmount(row.Miki, "HKD") : "—"}
                  </td>,
                  <td key="BABA" className="text-right text-slate-700 font-mono text-xs whitespace-nowrap">
                    {row.BABA > 0 ? formatAmount(row.BABA, "HKD") : "—"}
                  </td>,
                  <td key="total" className="text-right font-bold text-slate-950 font-mono text-xs bg-slate-50 whitespace-nowrap">
                    {formatAmount(row.total, "HKD")}
                  </td>,
                  <td key="pct" className="text-right font-semibold text-slate-600 text-xs whitespace-nowrap">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-teal-50 text-teal-800">
                      {pct.toFixed(1)}%
                    </span>
                  </td>,
                ],
              };
            })}
            footer={
              <tr className="bg-slate-100 font-black text-slate-950 border-t-2 border-slate-300">
                <td>Grand Total</td>
                <td className="text-right font-mono text-xs whitespace-nowrap">{formatAmount(userTotals.MA, "HKD")}</td>
                <td className="text-right font-mono text-xs whitespace-nowrap">{formatAmount(userTotals.Vin, "HKD")}</td>
                <td className="text-right font-mono text-xs whitespace-nowrap">{formatAmount(userTotals.Miki, "HKD")}</td>
                <td className="text-right font-mono text-xs whitespace-nowrap">{formatAmount(userTotals.BABA, "HKD")}</td>
                <td className="text-right font-mono text-xs bg-teal-50 text-teal-950 whitespace-nowrap">
                  {formatAmount(totalPrincipal, "HKD")}
                </td>
                <td className="text-right text-xs whitespace-nowrap">100.0%</td>
              </tr>
            }
          />
        </div>
      </section>

      {/* Table 2: User Interest Breakdown Matrix */}
      <section className="card shadow-sm overflow-hidden">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Total Interest by User &amp; Bank (利息收益分佈表)</h2>
            <p className="text-xs text-slate-500">Cumulative interest earnings breakdown by member and banking institution</p>
          </div>
          <Link className="text-xs font-semibold text-teal-700 hover:underline" href="/app/history">
            View interest history &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
          <SortableTable
            defaultSortKey="total"
            defaultSortDir="desc"
            columns={[
              { key: "member", label: "Member", className: "w-28" },
              { key: "BOC", label: "BOC (中銀)", className: "text-right", type: "number" },
              { key: "HS", label: "HS (恒生)", className: "text-right", type: "number" },
              { key: "SC", label: "SC (渣打)", className: "text-right", type: "number" },
              { key: "HSBC", label: "HSBC (匯豐)", className: "text-right", type: "number" },
              { key: "ICBC", label: "ICBC (工銀)", className: "text-right", type: "number" },
              {
                key: "total",
                label: "Total Interest",
                className: "text-right font-bold text-slate-900 bg-emerald-50/50",
                type: "number",
              },
            ]}
            rows={users.map((u) => {
              const row = userInterestMatrix[u];
              return {
                id: u,
                values: {
                  member: u,
                  BOC: row.BOC,
                  HS: row.HS,
                  SC: row.SC,
                  HSBC: row.HSBC,
                  ICBC: row.ICBC,
                  total: row.total,
                },
                cells: [
                  <td key="member" className="font-bold text-slate-900 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold flex items-center justify-center">
                        {u.slice(0, 2)}
                      </span>
                      {u}
                    </span>
                  </td>,
                  <td key="BOC" className="text-right text-slate-700 font-mono text-xs whitespace-nowrap">
                    {row.BOC > 0 ? `+${formatAmount(row.BOC, "HKD")}` : "—"}
                  </td>,
                  <td key="HS" className="text-right text-slate-700 font-mono text-xs whitespace-nowrap">
                    {row.HS > 0 ? `+${formatAmount(row.HS, "HKD")}` : "—"}
                  </td>,
                  <td key="SC" className="text-right text-slate-700 font-mono text-xs whitespace-nowrap">
                    {row.SC > 0 ? `+${formatAmount(row.SC, "HKD")}` : "—"}
                  </td>,
                  <td key="HSBC" className="text-right text-slate-700 font-mono text-xs whitespace-nowrap">
                    {row.HSBC > 0 ? `+${formatAmount(row.HSBC, "HKD")}` : "—"}
                  </td>,
                  <td key="ICBC" className="text-right text-slate-700 font-mono text-xs whitespace-nowrap">
                    {row.ICBC > 0 ? `+${formatAmount(row.ICBC, "HKD")}` : "—"}
                  </td>,
                  <td key="total" className="text-right font-bold text-emerald-700 font-mono text-xs bg-emerald-50/30 whitespace-nowrap">
                    +{formatAmount(row.total, "HKD")}
                  </td>,
                ],
              };
            })}
            footer={
              <tr className="bg-slate-100 font-black text-slate-950 border-t-2 border-slate-300">
                <td>Grand Total</td>
                <td className="text-right font-mono text-xs whitespace-nowrap">+{formatAmount(bankInterestTotals.BOC, "HKD")}</td>
                <td className="text-right font-mono text-xs whitespace-nowrap">+{formatAmount(bankInterestTotals.HS, "HKD")}</td>
                <td className="text-right font-mono text-xs whitespace-nowrap">+{formatAmount(bankInterestTotals.SC, "HKD")}</td>
                <td className="text-right font-mono text-xs whitespace-nowrap">+{formatAmount(bankInterestTotals.HSBC, "HKD")}</td>
                <td className="text-right font-mono text-xs whitespace-nowrap">+{formatAmount(bankInterestTotals.ICBC, "HKD")}</td>
                <td className="text-right font-mono text-xs bg-emerald-100 text-emerald-950 whitespace-nowrap">
                  +{formatAmount(bankInterestTotals.total, "HKD")}
                </td>
              </tr>
            }
          />
        </div>
      </section>

      {/* Product Type Breakdown */}
      <section className="card shadow-sm">
        <div className="mb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Current Product Types (投資產品分佈)</h2>
          <p className="text-xs text-slate-500">Allocation across fixed deposits, bonds, and demand accounts</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(productTotals).map(([name, data]) => {
            const pct = totalPrincipal > 0 ? (data.amount / totalPrincipal) * 100 : 0;
            return (
              <div key={name} className="border border-slate-200/80 rounded-lg p-3.5 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900 truncate">{name}</span>
                    <span className="badge text-[10px] font-mono font-bold">{pct.toFixed(1)}%</span>
                  </div>
                  <p className="font-mono font-black text-slate-950 text-base mt-1">
                    {formatAmount(data.amount, "HKD")}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{data.count} items</span>
                  <span className="text-emerald-700 font-semibold font-mono">
                    +{formatAmount(data.interest, "HKD")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Redesigned Clean Full-Width Compound Growth Projections */}
      <section className="card shadow-sm border-teal-100 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-teal-100 text-teal-800 text-xs font-black flex items-center justify-center">
                6Y
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Compound Growth Projections (複利增長推演)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              6-Year multi-horizon simulation starting from Base Capital of <strong className="text-slate-800 font-mono">{formatAmount(baseCapital, "HKD")}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-600" /> Conservative Yield
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-800 font-bold">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> 7.0% Target Yield
            </span>
          </div>
        </div>

        {/* 2-Strategy Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Conservative Strategy Card */}
          <div className="rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50/40 to-slate-50 p-4.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                Strategy A &middot; Conservative Deposit (1.0% &ndash; 2.5%)
              </span>
              <span className="badge text-[10px]">Low Risk</span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-[11px] text-slate-400">Year 6 Total Capital</span>
                <p className="text-xl font-black text-slate-900 font-mono">
                  {formatAmount(currentCBase, "HKD")}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400">6Y Total Interest</span>
                <p className="text-base font-black text-teal-700 font-mono">
                  +{formatAmount(totalConservativeProfit, "HKD")}
                </p>
              </div>
            </div>
          </div>

          {/* 7% Target Strategy Card */}
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-4.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Strategy B &middot; Target Portfolio (7.0% Fixed Yield)
              </span>
              <span className="badge bg-emerald-200 text-emerald-900 text-[10px]">Optimized</span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-[11px] text-slate-400">Year 6 Total Capital</span>
                <p className="text-xl font-black text-emerald-950 font-mono">
                  {formatAmount(currentTBase, "HKD")}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400">6Y Total Interest</span>
                <p className="text-base font-black text-emerald-700 font-mono">
                  +{formatAmount(totalTargetProfit, "HKD")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Responsive Milestone Cards Grid - Never Horizontally Scroll */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projectionRows.map((p, idx) => (
            <div
              key={p.year}
              className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-sm hover:border-teal-300 transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-extrabold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  {p.year}
                </span>
                <span className="text-[11px] text-slate-400">Stage {idx + 1}/6</span>
              </div>

              {/* Conservative Row */}
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Conservative ({formatRate(p.cRate)})</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {formatAmount(p.cBase, "HKD")}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-semibold text-teal-700">
                  +{formatAmount(p.cInterest, "HKD")}
                </span>
              </div>

              {/* Target 7% Row */}
              <div className="flex items-center justify-between text-xs bg-emerald-50/50 p-1.5 rounded border border-emerald-100/60">
                <div>
                  <span className="text-[10px] font-bold text-emerald-900 uppercase block">Target (7.00%)</span>
                  <span className="font-mono font-black text-slate-950 text-xs">
                    {formatAmount(p.tBase, "HKD")}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-extrabold text-emerald-700">
                  +{formatAmount(p.tInterest, "HKD")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
