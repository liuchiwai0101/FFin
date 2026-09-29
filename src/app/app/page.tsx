"use client";

import Link from "next/link";
import { ProjectionPlanner } from "@/components/projection-planner";
import { SortableTable } from "@/components/sortable-table";
import { useDepositData } from "@/components/deposit-provider";
import { useIsAdmin, useViewer } from "@/components/user-context";
import { isDemoUser } from "@/lib/users";
import { useLocale } from "@/lib/i18n/locale-provider";
import { initOwnerTotals, ownerNamesFromStore } from "@/lib/deposit-owners";
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

  const demoMode = isDemoUser(viewer);

  if (!store.activeItems.length && !store.historyItems.length) {
    return (
      <div className="card p-8 max-w-xl space-y-3">
        <h1 className="text-2xl font-bold text-slate-900">{t("overview.emptyTitle")}</h1>
        <p className="text-sm text-slate-600">
          {demoMode
            ? t("overview.emptyDemo")
            : admin
              ? t("overview.emptyAdmin")
              : t("overview.emptyMember")}
        </p>
        <p
          className={`text-xs rounded-lg px-3 py-2 border ${
            demoMode
              ? "text-violet-900 bg-violet-50 border-violet-200"
              : "text-amber-800 bg-amber-50 border-amber-200"
          }`}
        >
          {demoMode ? t("overview.emptyDemoNote") : t("overview.emptyDeviceNote")}
        </p>
        {!demoMode && admin && (
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

  function normalizeBank(b: string) {
    if (b.includes("HSBC") || b.includes("MA HSBC")) return "HSBC";
    if (b.includes("SC")) return "SC";
    if (b.includes("HS")) return "HS";
    if (b.includes("ICBC")) return "ICBC";
    if (b.includes("BOC")) return "BOC";
    return b;
  }

  function interestBankLabel(code: string) {
    if (code === "SC") return "SC";
    if (code === "HS") return "HS";
    if (code === "HSBC") return "HSBC";
    if (code === "ICBC") return "ICBC";
    return "BOC";
  }

  const totalPrincipal = activeRecords.reduce((sum, r) => sum + r.amount, 0);
  const userPrincipal = activeRecords
    .filter((r) => r.ownerName === viewer.ownerKey)
    .reduce((sum, r) => sum + r.amount, 0);
  const totalActiveInterest = activeRecords.reduce((sum, r) => sum + (r.interest || 0), 0);
  const totalHistoryInterest = historyRecords.reduce((sum, r) => sum + (r.interest || 0), 0);
  const weightedRateSum = activeRecords.reduce((sum, r) => sum + r.amount * (r.rate || 0), 0);
  const weightedAvgRate = totalPrincipal > 0 ? weightedRateSum / totalPrincipal : 0;

  const users = admin ? ownerNamesFromStore(store) : [viewer.ownerKey];
  const banks = ["SC", "HS", "HSBC", "ICBC", "BOC"];
  const multiMember = admin && users.length > 1;

  const bankUserMatrix: Record<string, Record<string, number>> = {};
  const bankActiveInterest: Record<string, number> = {};
  const userTotals = initOwnerTotals(users);

  banks.forEach((b) => {
    bankUserMatrix[b] = { ...initOwnerTotals(users), total: 0 };
    bankActiveInterest[b] = 0;
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
    if (bankActiveInterest[b] !== undefined) {
      bankActiveInterest[b] += r.interest || 0;
    }
  });

  const activeBanks = banks.filter((b) =>
    admin ? bankUserMatrix[b].total > 0 : (bankUserMatrix[b][viewer.ownerKey] || 0) > 0,
  );

  const userInterestMatrix: Record<string, Record<string, number>> = {};
  const bankInterestTotals: Record<string, number> = { BOC: 0, HS: 0, SC: 0, HSBC: 0, ICBC: 0, total: 0 };

  users.forEach((u) => {
    userInterestMatrix[u] = { BOC: 0, HS: 0, SC: 0, HSBC: 0, ICBC: 0, total: 0 };
  });

  [...activeRecords, ...historyRecords].forEach((r) => {
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
  const visibleMembers = memberCols.filter((u) => (userTotals[u] || 0) > 0 || users.length === 1);
  const interestBanks = (["BOC", "HS", "SC", "HSBC", "ICBC"] as const).filter(
    (b) => (bankInterestTotals[b] || 0) > 0,
  );
  const productEntries = Object.entries(productTotals).sort((a, b) => b[1].amount - a[1].amount);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="page-header border-b border-slate-200/80 pb-3 sm:pb-4">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-teal-700">
            {multiMember ? t("overview.eyebrowAdmin") : t("overview.eyebrowMember")}
          </span>
          <h1 className="text-lg font-black tracking-tight text-slate-900 sm:text-2xl leading-tight">
            {multiMember ? t("overview.titleAdmin") : t("overview.titleMember")}
          </h1>
          <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-sm text-slate-500 leading-snug">
            {multiMember ? t("overview.subtitleAdmin") : t("overview.subtitleMember")}
          </p>
        </div>
        <div className="page-header-actions">
          <Link
            className="button-secondary text-[11px] sm:text-xs flex-1 sm:flex-none justify-center"
            href="/app/current"
          >
            {t("overview.viewCurrent")}
          </Link>
          {admin && (
            <Link className="button text-[11px] sm:text-xs flex-1 sm:flex-none justify-center" href="/app/sync">
              {t("overview.uploadSync")}
            </Link>
          )}
        </div>
      </div>

      {/* KPIs — single source of truth for totals */}
      <section className="kpi-grid">
        <div className="card bg-gradient-to-br from-white to-teal-50/40 border-teal-100/80 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-snug">
            {t("overview.kpiTotalPrincipal")}
          </p>
          <p className="kpi-value mt-1.5 text-teal-950 font-mono">
            {formatAmount(totalPrincipal, "HKD")}
          </p>
          <p className="mt-1 text-[11px] text-teal-700 font-semibold">
            {t("overview.activeHoldings", { count: activeRecords.length })}
          </p>
        </div>

        <div className="card bg-gradient-to-br from-white to-emerald-50/40 border-emerald-100/80 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-snug">
            {t("overview.kpiActiveInterest")}
          </p>
          <p className="kpi-value mt-1.5 text-emerald-700 font-mono">
            +{formatAmount(totalActiveInterest, "HKD")}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">{t("overview.kpiActiveInterestNote")}</p>
        </div>

        <div className="card shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-snug">
            {t("overview.kpiWeightedYield")}
          </p>
          <p className="kpi-value mt-1.5 text-slate-900 font-mono">{formatRate(weightedAvgRate)}</p>
          <p className="mt-1 text-[11px] text-slate-500">{t("overview.kpiWeightedYieldNote")}</p>
        </div>

        <div className="card bg-gradient-to-br from-white to-blue-50/40 border-blue-100/80 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-snug">
            {t("overview.kpiHistoryInterest")}
          </p>
          <p className="kpi-value mt-1.5 text-blue-900 font-mono">
            +{formatAmount(totalHistoryInterest, "HKD")}
          </p>
          <p className="mt-1 text-[11px] text-blue-700 font-semibold">
            {t("overview.maturedTerms", { count: historyRecords.length })}
          </p>
        </div>
      </section>

      {/* Admin only: member principal comparison (no interest — that lives in the interest table) */}
      {multiMember && (
        <section>
          <div className="mb-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t("overview.userBreakdown")}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">{t("overview.userBreakdownDesc")}</p>
          </div>
          <div className="fit-card-grid">
            {visibleMembers.map((u) => {
              const userAmount = userTotals[u] || 0;
              const pct = totalPrincipal > 0 ? (userAmount / totalPrincipal) * 100 : 0;
              return (
                <div
                  key={u}
                  className="card flex flex-col justify-between border-slate-200 hover:border-teal-300 transition-all p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-7 w-7 shrink-0 rounded-full bg-teal-100 text-teal-800 font-black text-xs flex items-center justify-center">
                        {u.slice(0, 2)}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 truncate">{u}</h3>
                    </div>
                    <span className="badge text-[10px] font-bold shrink-0">
                      {t("overview.share", { pct: pct.toFixed(1) })}
                    </span>
                  </div>
                  <p className="user-stat-value mt-3 text-slate-950 font-mono">
                    {formatAmount(userAmount, "HKD")}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Bank distribution — for members also show expected interest so we can skip a second interest table */}
      <section className="card shadow-sm overflow-hidden">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">{t("overview.bankMatrixTitle")}</h2>
            <p className="text-xs text-slate-500">
              {multiMember ? t("overview.bankMatrixDescAdmin") : t("overview.bankMatrixDescMember")}
            </p>
          </div>
          <Link className="text-xs font-semibold text-teal-700 hover:underline" href="/app/current">
            {t("overview.viewDetails")}
          </Link>
        </div>

        <div className={`overflow-x-auto${!showMemberColumns ? " max-w-2xl" : ""}`}>
          <SortableTable
            className={!showMemberColumns ? "compact-matrix" : undefined}
            defaultSortKey="total"
            defaultSortDir="desc"
            columns={[
              {
                key: "bank",
                label: t("overview.bank"),
                className: showMemberColumns ? "w-36" : "whitespace-nowrap",
              },
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
                className: "text-right font-bold text-slate-900 bg-slate-100/70 whitespace-nowrap",
                type: "number",
              },
              {
                key: "pct",
                label: t("overview.pctShare"),
                className: "text-right font-bold text-slate-900 whitespace-nowrap",
                type: "number",
              },
              ...(!multiMember
                ? [
                    {
                      key: "interest",
                      label: t("overview.expectedInterest"),
                      className: "text-right font-bold text-emerald-800 whitespace-nowrap",
                      type: "number" as const,
                    },
                  ]
                : []),
            ]}
            rows={activeBanks.map((b) => {
              const row = bankUserMatrix[b];
              const pct = totalPrincipal > 0 ? (row.total / totalPrincipal) * 100 : 0;
              const interest = bankActiveInterest[b] || 0;
              return {
                id: b,
                values: {
                  bank: b,
                  ...Object.fromEntries(memberCols.map((u) => [u, row[u] || 0])),
                  total: row.total,
                  pct,
                  interest,
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
                  <td
                    key="total"
                    className="text-right font-bold text-slate-950 font-mono text-xs bg-slate-50 whitespace-nowrap"
                  >
                    {formatAmount(row.total, "HKD")}
                  </td>,
                  <td key="pct" className="text-right font-semibold text-slate-600 text-xs whitespace-nowrap">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-teal-50 text-teal-800">
                      {pct.toFixed(1)}%
                    </span>
                  </td>,
                  ...(!multiMember
                    ? [
                        <td
                          key="interest"
                          className="text-right font-semibold text-emerald-700 font-mono text-xs whitespace-nowrap"
                        >
                          {interest > 0 ? `+${formatAmount(interest, "HKD")}` : "—"}
                        </td>,
                      ]
                    : []),
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
                {!multiMember && (
                  <td className="text-right font-mono text-xs text-emerald-800 whitespace-nowrap">
                    +{formatAmount(totalActiveInterest, "HKD")}
                  </td>
                )}
              </tr>
            }
          />
        </div>
      </section>

      {/* Admin only: interest by member × bank (not repeated on member cards) */}
      {multiMember && (
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
              rows={visibleMembers.map((u) => {
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
                    <td
                      key="total"
                      className="text-right font-bold text-emerald-700 font-mono text-xs bg-emerald-50/30 whitespace-nowrap"
                    >
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
      )}

      {/* Product mix — allocation cut, not a repeat of bank totals */}
      <section className="card shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900">{t("overview.productTypesTitle")}</h2>
          <p className="text-xs text-slate-500">{t("overview.productTypesDesc")}</p>
        </div>
        <div className="fit-card-grid">
          {productEntries.map(([name, data]) => {
            const pct = totalPrincipal > 0 ? (data.amount / totalPrincipal) * 100 : 0;
            return (
              <div
                key={name}
                className="border border-slate-200/80 rounded-lg p-3.5 bg-slate-50/50 flex flex-col justify-between"
              >
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
