"use client";

import Link from "next/link";
import { ProjectionPlanner } from "@/components/projection-planner";
import { SortableTable } from "@/components/sortable-table";
import { useDepositData } from "@/components/deposit-provider";
import { useIsAdmin, useViewer } from "@/components/user-context";
import { useLocale } from "@/lib/i18n/locale-provider";
import { formatRate } from "@/lib/finance";

export default function OverviewPage() {
  const admin = useIsAdmin();
  const viewer = useViewer();
  const { t, formatAmount } = useLocale();
  const { ready, activeRecords: activeRaw, historyRecords: historyRaw, store } = useDepositData();
  const activeRecords = [...activeRaw].sort((a, b) => b.amount - a.amount);
  const historyRecords = [...historyRaw].sort(
    (a, b) => (b.fromDate?.getTime() ?? 0) - (a.fromDate?.getTime() ?? 0),
  );

  if (!ready) {
    return <div className="card p-6 text-sm text-slate-500">{t("common.loadingDashboard")}</div>;
  }

  if (!store.activeItems.length && !store.historyItems.length) {
    return (
      <div className="card p-8 max-w-xl space-y-3">
        <h1 className="text-2xl font-bold text-slate-900">{t("overview.emptyTitle")}</h1>
        <p className="text-sm text-slate-600">
          {admin ? t("overview.emptyAdmin") : t("overview.emptyMember")}
        </p>
        {admin && (
          <Link className="button inline-flex" href="/app/sync">
            {t("overview.uploadExcel")}
          </Link>
        )}
      </div>
    );
  }

  function bankLabel(code: string) {
    if (code === "SC") return t("overview.bankSC");
    if (code === "HS") return t("overview.bankHS");
    if (code === "HSBC") return t("overview.bankHSBC");
    if (code === "ICBC") return t("overview.bankICBC");
    return t("overview.bankBOC");
  }

  function productGroupLabel(product: string) {
    if (product.includes("債券") || product.includes("Bond")) return t("overview.productBonds");
    if (product.includes("RMB")) return t("overview.productRmb");
    if (product.includes("Demand") || product.includes("Savings")) return t("overview.productDemand");
    if (product.includes("馬拉松")) return t("overview.productMarathon");
    return t("overview.productTimeDeposit");
  }

  // Total metrics
  const totalPrincipal = activeRecords.reduce((sum, r) => sum + r.amount, 0);
  const userPrincipal = activeRecords
    .filter((r) => r.ownerName === viewer.ownerKey)
    .reduce((sum, r) => sum + r.amount, 0);
  const totalActiveInterest = activeRecords.reduce((sum, r) => sum + (r.interest || 0), 0);
  const totalHistoryInterest = historyRecords.reduce((sum, r) => sum + (r.interest || 0), 0);

  // Active yield calculation
  const weightedRateSum = activeRecords.reduce((sum, r) => sum + r.amount * (r.rate || 0), 0);
  const weightedAvgRate = totalPrincipal > 0 ? weightedRateSum / totalPrincipal : 0;

  // Unique Users & Banks
  const users = admin ? ["MA", "Vin", "Miki", "BABA"] : [viewer.ownerKey];
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
    const group = productGroupLabel(r.product);

    if (!productTotals[group]) productTotals[group] = { amount: 0, count: 0, interest: 0 };
    productTotals[group].amount += r.amount;
    productTotals[group].count += 1;
    productTotals[group].interest += r.interest || 0;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">{t("overview.eyebrow")}</span>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            {t("overview.title")}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">{t("overview.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link className="button-secondary text-xs" href="/app/current">
            {t("overview.viewCurrent")}
          </Link>
          {admin && (
            <Link className="button text-xs" href="/app/sync">
              {t("overview.uploadSync")}
            </Link>
          )}
        </div>
      </div>

      {/* Top Level KPI Cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {/* Card 1: Total Principal */}
        <div className="card bg-gradient-to-br from-white to-teal-50/40 border-teal-100/80 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("overview.kpiTotalPrincipal")}</p>
          <p className="kpi-value mt-1.5 text-teal-950 font-mono">
            {formatAmount(totalPrincipal, "HKD")}
          </p>
          <p className="mt-1 text-[11px] text-teal-700 font-semibold">{t("overview.activeHoldings", { count: activeRecords.length })}</p>
        </div>

        {/* Card 2: Expected Active Interest */}
        <div className="card bg-gradient-to-br from-white to-emerald-50/40 border-emerald-100/80 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("overview.kpiActiveInterest")}</p>
          <p className="kpi-value mt-1.5 text-emerald-700 font-mono">
            +{formatAmount(totalActiveInterest, "HKD")}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">{t("overview.kpiActiveInterestNote")}</p>
        </div>

        {/* Card 3: Weighted Avg Yield */}
        <div className="card p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("overview.kpiWeightedYield")}</p>
          <p className="kpi-value mt-1.5 text-slate-900 font-mono">
            {formatRate(weightedAvgRate)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">{t("overview.kpiWeightedYieldNote")}</p>
        </div>

        {/* Card 4: Historical Interest */}
        <div className="card bg-gradient-to-br from-white to-blue-50/40 border-blue-100/80 p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("overview.kpiHistoryInterest")}</p>
          <p className="kpi-value mt-1.5 text-blue-900 font-mono">
            +{formatAmount(totalHistoryInterest, "HKD")}
          </p>
          <p className="mt-1 text-[11px] text-blue-700 font-semibold">{t("overview.maturedTerms", { count: historyRecords.length })}</p>
        </div>
      </section>

      {/* User Summary Cards */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {t("overview.userBreakdown")}
          </h2>
          <span className="text-xs text-slate-500 font-medium font-mono">
            {t("overview.total")}: {formatAmount(totalPrincipal, "HKD")}
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
                    <span className="badge text-[10px] font-bold">{t("overview.share", { pct: pct.toFixed(1) })}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-black text-slate-900">{u}</h3>
                  <p className="user-stat-value mt-1 text-slate-950 font-mono">
                    {formatAmount(userAmount, "HKD")}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">{t("overview.interest")}:</span>
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
            <h2 className="text-base sm:text-lg font-bold text-slate-900">{t("overview.bankMatrixTitle")}</h2>
            <p className="text-xs text-slate-500">{t("overview.bankMatrixDesc")}</p>
          </div>
          <Link className="text-xs font-semibold text-teal-700 hover:underline" href="/app/current">
            {t("overview.viewDetails")}
          </Link>
        </div>

        <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
          <SortableTable
            defaultSortKey="total"
            defaultSortDir="desc"
            columns={[
              { key: "bank", label: t("overview.bank"), className: "w-36" },
              { key: "MA", label: "MA", className: "text-right", type: "number" },
              { key: "Vin", label: "Vin", className: "text-right", type: "number" },
              { key: "Miki", label: "Miki", className: "text-right", type: "number" },
              { key: "BABA", label: "BABA", className: "text-right", type: "number" },
              {
                key: "total",
                label: t("overview.totalPrincipal"),
                className: "text-right font-bold text-slate-900 bg-slate-100/70",
                type: "number",
              },
              {
                key: "pct",
                label: t("overview.pctShare"),
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
                      {bankLabel(b)}
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
                <td>{t("overview.grandTotal")}</td>
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
            <h2 className="text-base sm:text-lg font-bold text-slate-900">{t("overview.interestMatrixTitle")}</h2>
            <p className="text-xs text-slate-500">{t("overview.interestMatrixDesc")}</p>
          </div>
          <Link className="text-xs font-semibold text-teal-700 hover:underline" href="/app/history">
            {t("overview.viewHistory")}
          </Link>
        </div>

        <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
          <SortableTable
            defaultSortKey="total"
            defaultSortDir="desc"
            columns={[
              { key: "member", label: t("overview.member"), className: "w-28" },
              { key: "BOC", label: "BOC (中銀)", className: "text-right", type: "number" },
              { key: "HS", label: "HS (恒生)", className: "text-right", type: "number" },
              { key: "SC", label: "SC (渣打)", className: "text-right", type: "number" },
              { key: "HSBC", label: "HSBC (匯豐)", className: "text-right", type: "number" },
              { key: "ICBC", label: "ICBC (工銀)", className: "text-right", type: "number" },
              {
                key: "total",
                label: t("overview.totalInterest"),
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
                <td>{t("overview.grandTotal")}</td>
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
          <h2 className="text-base sm:text-lg font-bold text-slate-900">{t("overview.productTypesTitle")}</h2>
          <p className="text-xs text-slate-500">{t("overview.productTypesDesc")}</p>
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
                  <span>{t("overview.items", { count: data.count })}</span>
                  <span className="text-emerald-700 font-semibold font-mono">
                    +{formatAmount(data.interest, "HKD")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <ProjectionPlanner liveBaseCapital={userPrincipal} />
    </div>
  );
}
