"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { formatRate } from "@/lib/finance";
import {
  DEFAULT_CONSERVATIVE_RATES,
  DEFAULT_TARGET_RATE,
  SHEET_BASE_CAPITAL,
  TARGET_RATE_PRESETS,
  buildProjectionRows,
  percentToRate,
  rateToPercentInput,
} from "@/lib/projections";

type ProjectionPlannerProps = {
  liveBaseCapital: number;
};

const YEAR_KEYS = [
  "overview.year1",
  "overview.year2",
  "overview.year3",
  "overview.year4",
  "overview.year5",
  "overview.year6",
] as const;

export function ProjectionPlanner({ liveBaseCapital }: ProjectionPlannerProps) {
  const { t, formatAmount } = useLocale();
  const baseCapital = liveBaseCapital > 0 ? liveBaseCapital : SHEET_BASE_CAPITAL;

  const [conservativeRates, setConservativeRates] = useState<number[]>([
    ...DEFAULT_CONSERVATIVE_RATES,
  ]);
  const [targetRates, setTargetRates] = useState<number[]>(
    Array(6).fill(DEFAULT_TARGET_RATE),
  );

  const projectionRows = useMemo(
    () => buildProjectionRows(baseCapital, conservativeRates, targetRates),
    [baseCapital, conservativeRates, targetRates],
  );

  const finalConservative = projectionRows.at(-1)?.cBase ?? baseCapital;
  const finalTarget = projectionRows.at(-1)?.tBase ?? baseCapital;
  const totalConservativeProfit = finalConservative - baseCapital;
  const totalTargetProfit = finalTarget - baseCapital;
  const avgTargetRate =
    targetRates.reduce((sum, rate) => sum + rate, 0) / targetRates.length;

  function setConservativeRate(index: number, value: string) {
    setConservativeRates((prev) => {
      const next = [...prev];
      next[index] = percentToRate(value);
      return next;
    });
  }

  function setTargetRate(index: number, value: string) {
    setTargetRates((prev) => {
      const next = [...prev];
      next[index] = percentToRate(value);
      return next;
    });
  }

  function applyTargetPreset(rate: number) {
    setTargetRates(Array(6).fill(rate));
  }

  function resetConservativeRates() {
    setConservativeRates([...DEFAULT_CONSERVATIVE_RATES]);
  }

  return (
    <section className="card shadow-sm border-teal-100 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-teal-100 text-teal-800 text-xs font-black flex items-center justify-center">
              6Y
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {t("overview.projectionsTitle")}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t("overview.projectionsDesc")}{" "}
            <strong className="text-slate-800 font-mono">{formatAmount(baseCapital, "HKD")}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-600" /> {t("overview.conservativeYield")}
          </span>
          <span className="inline-flex items-center gap-1.5 text-emerald-800 font-bold">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />{" "}
            {t("overview.targetYield", { rate: (avgTargetRate * 100).toFixed(1) })}
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-teal-100 bg-teal-50/30 p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              {t("overview.strategyA")}
            </span>
            <button
              type="button"
              className="text-[11px] font-semibold text-teal-700 hover:underline cursor-pointer"
              onClick={resetConservativeRates}
            >
              {t("overview.resetSheetRates")}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">{t("overview.rateHintA")}</p>
        </div>

        <div className="rounded-lg border border-emerald-100 bg-emerald-50/30 p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              {t("overview.strategyB", { rate: (avgTargetRate * 100).toFixed(1) })}
            </span>
            <div className="flex flex-wrap gap-1">
              {TARGET_RATE_PRESETS.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                    targetRates.every((r) => Math.abs(r - rate) < 0.0001)
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                  }`}
                  onClick={() => applyTargetPreset(rate)}
                >
                  {(rate * 100).toFixed(0)}%
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-500">{t("overview.rateHintB")}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50/40 to-slate-50 p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              {t("overview.strategyA")}
            </span>
            <span className="badge text-[10px]">{t("overview.lowRisk")}</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-[11px] text-slate-400">{t("overview.year6Capital")}</span>
              <p className="text-xl font-black text-slate-900 font-mono">
                {formatAmount(finalConservative, "HKD")}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400">{t("overview.year6Interest")}</span>
              <p className="text-base font-black text-teal-700 font-mono">
                +{formatAmount(totalConservativeProfit, "HKD")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-4.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              {t("overview.strategyB", { rate: (avgTargetRate * 100).toFixed(1) })}
            </span>
            <span className="badge bg-emerald-200 text-emerald-900 text-[10px]">
              {t("overview.optimized")}
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-[11px] text-slate-400">{t("overview.year6Capital")}</span>
              <p className="text-xl font-black text-emerald-950 font-mono">
                {formatAmount(finalTarget, "HKD")}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400">{t("overview.year6Interest")}</span>
              <p className="text-base font-black text-emerald-700 font-mono">
                +{formatAmount(totalTargetProfit, "HKD")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projectionRows.map((row, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-sm hover:border-teal-300 transition-all space-y-2.5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-extrabold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {t(YEAR_KEYS[idx])}
              </span>
              <span className="text-[11px] text-slate-400">{t("overview.stage", { n: idx + 1 })}</span>
            </div>

            <div className="flex items-center justify-between text-xs gap-2">
              <div className="min-w-0 flex-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  {t("overview.conservative")} ({formatRate(row.cRate)})
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-16 rounded border border-slate-200 px-1.5 py-0.5 text-[11px] font-mono"
                    value={rateToPercentInput(row.cRate)}
                    onChange={(e) => setConservativeRate(idx, e.target.value)}
                    aria-label={`${t(YEAR_KEYS[idx])} ${t("overview.conservative")}`}
                  />
                  <span className="text-[10px] text-slate-400">%</span>
                </div>
                <span className="font-mono font-bold text-slate-900 text-xs block mt-1">
                  {formatAmount(row.cBase, "HKD")}
                </span>
              </div>
              <span className="font-mono text-[11px] font-semibold text-teal-700 shrink-0">
                +{formatAmount(row.cInterest, "HKD")}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs bg-emerald-50/50 p-1.5 rounded border border-emerald-100/60 gap-2">
              <div className="min-w-0 flex-1">
                <label className="text-[10px] font-bold text-emerald-900 uppercase block mb-1">
                  {t("overview.targetRate", { rate: formatRate(row.tRate) })}
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="w-16 rounded border border-emerald-200 px-1.5 py-0.5 text-[11px] font-mono"
                    value={rateToPercentInput(row.tRate)}
                    onChange={(e) => setTargetRate(idx, e.target.value)}
                    aria-label={`${t(YEAR_KEYS[idx])} ${t("overview.target")}`}
                  />
                  <span className="text-[10px] text-emerald-700">%</span>
                </div>
                <span className="font-mono font-black text-slate-950 text-xs block mt-1">
                  {formatAmount(row.tBase, "HKD")}
                </span>
              </div>
              <span className="font-mono text-[11px] font-extrabold text-emerald-700 shrink-0">
                +{formatAmount(row.tInterest, "HKD")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
