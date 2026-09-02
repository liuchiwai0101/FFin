"use client";

import { useMemo, useState } from "react";
import { domToJpeg } from "modern-screenshot";
import { ProjectionChart } from "@/components/projection-chart";
import { useLocale } from "@/lib/i18n/locale-provider";
import {
  DEFAULT_CONSERVATIVE_RATES,
  DEFAULT_TARGET_RATE,
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

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function ProjectionPlanner({ liveBaseCapital }: ProjectionPlannerProps) {
  const { t, formatAmount } = useLocale();
  const baseCapital = liveBaseCapital;

  const [conservativeRates, setConservativeRates] = useState<number[]>([
    ...DEFAULT_CONSERVATIVE_RATES,
  ]);
  const [targetRates, setTargetRates] = useState<number[]>(
    Array(6).fill(DEFAULT_TARGET_RATE),
  );
  const [downloading, setDownloading] = useState(false);

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

  async function downloadReport() {
    const root = document.getElementById("projection-planner-root");
    if (!root || downloading) return;
    setDownloading(true);
    try {
      const dataUrl = await domToJpeg(root, {
        quality: 0.92,
        scale: Math.min(2, window.devicePixelRatio || 1),
        backgroundColor: "#ffffff",
        filter: (node) => !(node instanceof Element && node.classList.contains("no-export")),
      });
      const date = new Date().toISOString().slice(0, 10);
      downloadDataUrl(dataUrl, `compound-growth-${date}.jpg`);
    } catch (err) {
      console.error("Projection report export failed:", err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section
      id="projection-planner-root"
      className="card shadow-sm border-teal-100 space-y-3 !p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="h-5 w-5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black flex items-center justify-center shrink-0">
              6Y
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              {t("overview.projectionsTitle")}
            </h2>
            <span className="text-[10px] text-slate-500">
              {t("overview.projectionsDesc")}{" "}
              <strong className="text-slate-800 font-mono">{formatAmount(baseCapital, "HKD")}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] shrink-0">
          <span className="inline-flex items-center gap-1 text-slate-600">
            <span className="h-2 w-2 rounded-full bg-teal-400" /> {t("overview.conservativeYield")}
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-800 font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />{" "}
            {t("overview.targetYield", { rate: (avgTargetRate * 100).toFixed(1) })}
          </span>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-2">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 truncate">
              {t("overview.strategyASummary")}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                className="no-export h-5 w-5 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 cursor-pointer flex items-center justify-center"
                onClick={resetConservativeRates}
                title={t("overview.resetSheetRates")}
                aria-label={t("overview.resetSheetRates")}
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
              <span className="badge text-[9px] px-1.5 py-0 bg-teal-50 text-teal-800 border border-teal-100">
                {t("overview.lowRisk")}
              </span>
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2 text-[10px]">
            <div>
              <span className="text-slate-400">{t("overview.finalBalance")}: </span>
              <span className="font-black text-slate-900 font-mono text-sm">
                {formatAmount(finalConservative, "HKD")}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400">{t("overview.totalInterest")}: </span>
              <span className="font-black text-emerald-700 font-mono text-sm">
                +{formatAmount(totalConservativeProfit, "HKD")}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-2">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 truncate">
              {t("overview.strategyBSummary")}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              <div className="flex gap-0.5 no-export">
                {TARGET_RATE_PRESETS.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    className={`px-1.5 py-0 rounded text-[10px] font-bold cursor-pointer ${
                      targetRates.every((r) => Math.abs(r - rate) < 0.0001)
                        ? "bg-emerald-600 text-white"
                        : "bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                    }`}
                    onClick={() => applyTargetPreset(rate)}
                  >
                    {(rate * 100).toFixed(0)}%
                  </button>
                ))}
              </div>
              <span className="badge text-[9px] px-1.5 py-0 bg-emerald-50 text-emerald-800 border border-emerald-100">
                {t("overview.optimized")}
              </span>
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2 text-[10px]">
            <div>
              <span className="text-slate-400">{t("overview.finalBalance")}: </span>
              <span className="font-black text-slate-900 font-mono text-sm">
                {formatAmount(finalTarget, "HKD")}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400">{t("overview.totalInterest")}: </span>
              <span className="font-black text-emerald-700 font-mono text-sm">
                +{formatAmount(totalTargetProfit, "HKD")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ProjectionChart
        baseCapital={baseCapital}
        rows={projectionRows}
        conservativeLabel={t("overview.chartConservative")}
        targetLabel={t("overview.chartTarget")}
      />

      <div id="projection-breakdown">
        <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
          {t("overview.detailedBreakdown")}
        </h3>
        <div className="projection-table-wrap">
          <table className="projection-table">
            <thead>
              <tr className="bg-slate-50 text-left text-[9px] font-bold uppercase tracking-wide text-slate-500">
                <th className="px-2 py-1.5">{t("overview.yearCol")}</th>
                <th className="px-2 py-1.5">{t("overview.colConservativeRate")}</th>
                <th className="px-2 py-1.5">{t("overview.colConservativeBalance")}</th>
                <th className="px-2 py-1.5">{t("overview.colConservativeInterest")}</th>
                <th className="px-2 py-1.5">{t("overview.colTargetRate")}</th>
                <th className="px-2 py-1.5">{t("overview.colTargetBalance")}</th>
                <th className="px-2 py-1.5">{t("overview.colTargetInterest")}</th>
              </tr>
            </thead>
            <tbody>
              {projectionRows.map((row, idx) => (
                <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 w-8 shrink-0">{t(YEAR_KEYS[idx])}</span>
                      <div className="h-1 w-10 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-teal-500"
                          style={{ width: `${((idx + 1) / 6) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-14 rounded border border-slate-200 px-1 py-0.5 font-mono text-center text-[10px]"
                      value={rateToPercentInput(row.cRate)}
                      onChange={(e) => setConservativeRate(idx, e.target.value)}
                      aria-label={`${t(YEAR_KEYS[idx])} ${t("overview.conservative")}`}
                    />
                  </td>
                  <td className="px-2 py-1.5 font-mono font-semibold text-slate-900 whitespace-nowrap">
                    {formatAmount(row.cBase, "HKD")}
                  </td>
                  <td className="px-2 py-1.5 font-mono font-semibold text-emerald-700 whitespace-nowrap">
                    +{formatAmount(row.cInterest, "HKD")}
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className="w-14 rounded border border-emerald-200 px-1 py-0.5 font-mono text-center text-[10px]"
                      value={rateToPercentInput(row.tRate)}
                      onChange={(e) => setTargetRate(idx, e.target.value)}
                      aria-label={`${t(YEAR_KEYS[idx])} ${t("overview.target")}`}
                    />
                  </td>
                  <td className="px-2 py-1.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {formatAmount(row.tBase, "HKD")}
                  </td>
                  <td className="px-2 py-1.5 font-mono font-bold text-emerald-700 whitespace-nowrap">
                    +{formatAmount(row.tInterest, "HKD")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="no-export flex flex-wrap items-center justify-end gap-1.5">
        <button
          type="button"
          className="button-secondary !px-2.5 !py-1 text-[10px]"
          onClick={() =>
            document.getElementById("projection-breakdown")?.scrollIntoView({ behavior: "smooth" })
          }
        >
          {t("overview.reSimulate")}
        </button>
        <button
          type="button"
          className="button !px-2.5 !py-1 text-[10px] inline-flex items-center gap-1"
          onClick={downloadReport}
          disabled={downloading}
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {downloading ? t("common.exporting") : t("overview.downloadReport")}
        </button>
      </div>
    </section>
  );
}
