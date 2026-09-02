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
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {t("overview.emptyDeviceNote")}
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
  const userCurrentInterest: Record<string, number> = { MA: 0, Vin: 0, Miki: 0, BABA: 0 };
  const userHistoryInterest: Record<string, number> = { MA: 0, Vin: 0, Miki: 0, BABA: 0 };

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
    if (userCurrentInterest[u] !== undefined) {
      userCurrentInterest[u] += r.interest || 0;
    }
  });

  historyRecords.forEach((r) => {
    const u = r.ownerName;
    if (userHistoryInterest[u] !== undefined) {
      userHistoryInterest[u] += r.interest || 0;
    }
  });

  const activeBanks = banks.filter((b) =>
    admin ? bankUserMatrix[b].total > 0 : (bankUserMatrix[b][viewer.ownerKey] || 0) > 0,
  );

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

  const memberCols = users.filter((u) => users.length === 1 || (userTotals[u] || 0) > 0);
  const showMemberColumns = memberCols.length > 1;
  const visibleUserCards = users.filter(
    (u) =>
      users.length === 1 ||
      (userTotals[u] || 0) > 0 ||
      (userCurrentInterest[u] || 0) > 0 ||
      (userHistoryInterest[u] || 0) > 0,
  );
  const interestBanks = (["BOC", "HS", "SC", "HSBC", "ICBC"] as const).filter(
    (b) => (bankInterestTotals[b] || 0) > 0,
  );
  const productEntries = Object.entries(productTotals).sort((a, b) => b[1].amount - a[1].amount);

  function interestBankLabel(code: string) {
    if (code === "SC") return "SC (渣打)";
    if (code === "HS") return "HS (恒生)";
    if (code === "HSBC") return "HSBC (匯豐)";
    if (code === "ICBC") return "ICBC (工銀)";
    return "BOC (中銀)";
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div className="page-header border-b border-slate-200/80 pb-3 sm:pb-4">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-teal-700">{t("overview.eyebrow")}</span>
          <h1 className="text-lg font-black tracking-tight text-slate-900 sm:text-2xl leading-tight">
            {t("overview.title")}
          </h1>
          <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-sm text-slate-500 leading-snug">{t("overview.subtitle")}</p>
        </div>
        <div className="page-header-actions">
          <Link className="button-secondary text-[11px] sm:text-xs flex-1 sm:flex-none justify-center" href="/app/current">
            {t("overview.viewCurrent")}
          </Link>
          {admin && (
            <Link className="button text-[11px] sm:text-xs flex-1 sm:flex-none justify-center" href="/app/sync">
              {t("overview.uploadSync")}
            </Link>
          )}
        </div>
      </div>

      {/* Top Level KPI Cards */}
      <section className="kpi-grid">
        {/* Card 1: Total Principal */}
        <div className="card bg-gradient-to-br from-white to-teal-50/40 border-teal-100/80 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-snug">{t("overview.kpiTotalPrincipal")}</p>
          <p className="kpi-value mt-1.5 text-teal-950 font-mono">
            {formatAmount(totalPrincipal, "HKD")}
          </p>
          <p className="mt-1 text-[11px] text-teal-700 font-semibold">{t("overview.activeHoldings", { count: activeRecords.length })}</p>
        </div>

        {/* Card 2: Expected Active Interest */}
        <div className="card bg-gradient-to-br from-white to-emerald-50/40 border-emerald-100/80 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-snug">{t("overview.kpiActiveInterest")}</p>
          <p className="kpi-value mt-1.5 text-emerald-700 font-mono">
            +{formatAmount(totalActiveInterest, "HKD")}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">{t("overview.kpiActiveInterestNote")}</p>
        </div>

        {/* Card 3: Weighted Avg Yield */}
        <div className="card shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-snug">{t("overview.kpiWeightedYield")}</p>
          <p className="kpi-value mt-1.5 text-slate-900 font-mono">
            {formatRate(weightedAvgRate)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">{t("overview.kpiWeightedYieldNote")}</p>
        </div>

        {/* Card 4: Historical Interest */}
        <div className="card bg-gradient-to-br from-white to-blue-50/40 border-blue-100/80 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-snug">{t("overview.kpiHistoryInterest")}</p>
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
        <div className={visibleUserCards.length === 1 ? "" : "fit-card-grid"}>
          {visibleUserCards.map((u) => {
            const userAmount = userTotals[u] || 0;
            const pct = totalPrincipal > 0 ? (userAmount / totalPrincipal) * 100 : 0;
            const currentInterest = userCurrentInterest[u] || 0;
            const historyInterest = userHistoryInterest[u] || 0;
            if (visibleUserCards.length === 1) {
              return (
                <div key={u} className="card user-summary-card border-slate-200 shadow-sm">
                  <div className="user-summary-identity">
                    <span className="h-8 w-8 rounded-full bg-teal-100 text-teal-800 font-black text-xs flex items-center justify-center">
                      {u.slice(0, 2)}
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{u}</h3>
                      <span className="badge text-[10px] font-bold">{t("overview.share", { pct: pct.toFixed(1) })}</span>
                    </div>
                  </div>
                  <div className="user-summary-metrics">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("overview.kpiTotalPrincipal")}</p>
                      <p className="user-stat-value mt-0.5 text-slate-950 font-mono">{formatAmount(userAmount, "HKD")}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("overview.interestCurrent")}</p>
                      <p className="user-stat-value mt-0.5 text-emerald-700 font-mono">+{formatAmount(currentInterest, "HKD")}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t("overview.interestHistory")}</p>
                      <p className="user-stat-value mt-0.5 text-blue-700 font-mono">+{formatAmount(historyInterest, "HKD")}</p>
                    </div>
                  </div>
                </div>
              );
            }
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
                <div className="mt-3 pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">{t("overview.interestCurrent")}:</span>
                    <span className="font-bold text-emerald-700 font-mono text-[11px]">
                      +{formatAmount(currentInterest, "HKD")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">{t("overview.interestHistory")}:</span>
                    <span className="font-bold text-blue-700 font-mono text-[11px]">
                      +{formatAmount(historyInterest, "HKD")}
                    </span>
                  </div>
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
            <h2 className="text-base font-bold text-slate-900">{t("overview.bankMatrixTitle")}</h2>
            <p className="text-xs text-slate-500">{t("overview.bankMatrixDesc")}</p>
          </div>
          <Link className="text-xs font-semibold text-teal-700 hover:underline" href="/app/current">
            {t("overview.viewDetails")}
          </Link>
        </div>

        <div className="overflow-x-auto">
          <SortableTable
            defaultSortKey="total"
            defaultSortDir="desc"
            columns={[
              { key: "bank", label: t("overview.bank"), className: "w-40" },
              ...(showMemberColumns
                ? memberCols.map((u) => ({
                    key: u,
                    label: u,
                    className: "text-right",
                    type: "number" as const,
                  }))
                : []),
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
            rows={activeBanks.map((b) => {
              const row = bankUserMatrix[b];
              const pct = totalPrincipal > 0 ? (row.total / totalPrincipal) * 100 : 0;
              return {
                id: b,
                values: {
                  bank: b,
                  ...Object.fromEntries(memberCols.map((u) => [u, row[u] || 0])),
                  total: row.total,
                  pct,
                },
                cells: [
                  <td key="bank" className="font-bold text-slate-900 whitespace-nowrap">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-black mr-2 font-mono">
                      {b}
                    </span>
                    <span className="text-xs text-slate-700">{bankLabel(b)}</span>
                  </td>,
                  ...(showMemberColumns
                    ? memberCols.map((u) => (
                        <td key={u} className="text-right text-slate-700 font-mono text-xs whitespace-nowrap">
                          {(row[u] || 0) > 0 ? formatAmount(row[u], "HKD") : "—"}
                        </td>
                      ))
                    : []),
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
                {showMemberColumns &&
                  memberCols.map((u) => (
                    <td key={u} className="text-right font-mono text-xs whitespace-nowrap">
                      {formatAmount(userTotals[u] || 0, "HKD")}
                    </td>
                  ))}
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
            <h2 className="text-base font-bold text-slate-900">{t("overview.interestMatrixTitle")}</h2>
            <p className="text-xs text-slate-500">{t("overview.interestMatrixDesc")}</p>
          </div>
          <Link className="text-xs font-semibold text-teal-700 hover:underline" href="/app/history">
            {t("overview.viewHistory")}
          </Link>
        </div>

        <div className="overflow-x-auto">
          <SortableTable
            defaultSortKey="total"
            defaultSortDir="desc"
            columns={[
              { key: "member", label: t("overview.member"), className: "w-28" },
              ...interestBanks.map((b) => ({
                key: b,
                label: interestBankLabel(b),
                className: "text-right",
                type: "number" as const,
              })),
              {
                key: "total",
                label: t("overview.totalInterest"),
                className: "text-right font-bold text-slate-900 bg-emerald-50/50",
                type: "number",
              },
            ]}
            rows={visibleUserCards.map((u) => {
              const row = userInterestMatrix[u];
              return {
                id: u,
                values: {
                  member: u,
                  ...Object.fromEntries(interestBanks.map((b) => [b, row[b] || 0])),
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
                  ...interestBanks.map((b) => (
                    <td key={b} className="text-right text-slate-700 font-mono text-xs whitespace-nowrap">
                      {(row[b] || 0) > 0 ? `+${formatAmount(row[b], "HKD")}` : "—"}
                    </td>
                  )),
                  <td key="total" className="text-right font-bold text-emerald-700 font-mono text-xs bg-emerald-50/30 whitespace-nowrap">
                    +{formatAmount(row.total, "HKD")}
                  </td>,
                ],
              };
            })}
            footer={
              <tr className="bg-slate-100 font-black text-slate-950 border-t-2 border-slate-300">
                <td>{t("overview.grandTotal")}</td>
                {interestBanks.map((b) => (
                  <td key={b} className="text-right font-mono text-xs whitespace-nowrap">
                    +{formatAmount(bankInterestTotals[b] || 0, "HKD")}
                  </td>
                ))}
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
          <h2 className="text-base font-bold text-slate-900">{t("overview.productTypesTitle")}</h2>
          <p className="text-xs text-slate-500">{t("overview.productTypesDesc")}</p>
        </div>
        <div className="fit-card-grid">
          {productEntries.map(([name, data]) => {
            const pct = totalPrincipal > 0 ? (data.amount / totalPrincipal) * 100 : 0;
            return (
              <div key={name} className="border border-slate-200/80 rounded-lg p-3.5 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1 gap-2">
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
