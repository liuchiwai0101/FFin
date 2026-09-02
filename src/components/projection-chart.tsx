"use client";

import type { ProjectionYearRow } from "@/lib/projections";

type ProjectionChartProps = {
  baseCapital: number;
  rows: ProjectionYearRow[];
  conservativeLabel: string;
  targetLabel: string;
};

function formatAxis(value: number): string {
  if (value >= 1_000_000) return `HK$${(value / 1_000_000).toFixed(1)}M`;
  return `HK$${Math.round(value / 1_000)}k`;
}

function niceBounds(min: number, max: number) {
  const span = max - min || 1;
  const pad = span * 0.08;
  const lo = Math.floor((min - pad) / 50_000) * 50_000;
  const hi = Math.ceil((max + pad) / 50_000) * 50_000;
  return { min: Math.max(0, lo), max: hi };
}

export function ProjectionChart({
  baseCapital,
  rows,
  conservativeLabel,
  targetLabel,
}: ProjectionChartProps) {
  const width = 720;
  const height = 260;
  const padLeft = 24;
  const padRight = 72;
  const padTop = 28;
  const padBottom = 36;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const conservativeSeries = [baseCapital, ...rows.map((r) => r.cBase)];
  const targetSeries = [baseCapital, ...rows.map((r) => r.tBase)];
  const allValues = [...conservativeSeries, ...targetSeries];
  const { min, max } = niceBounds(Math.min(...allValues), Math.max(...allValues));

  const xAt = (year: number) => padLeft + (year / 6) * plotW;
  const yAt = (value: number) => padTop + plotH - ((value - min) / (max - min)) * plotH;

  const cPoints = conservativeSeries.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ");
  const tPoints = targetSeries.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ");

  const areaPath = [
    `M ${xAt(0)} ${yAt(targetSeries[0])}`,
    ...targetSeries.slice(1).map((v, i) => `L ${xAt(i + 1)} ${yAt(v)}`),
    `L ${xAt(6)} ${padTop + plotH}`,
    `L ${xAt(0)} ${padTop + plotH}`,
    "Z",
  ].join(" ");

  const ticks = 5;
  const yTicks = Array.from({ length: ticks }, (_, i) => min + ((max - min) * i) / (ticks - 1));

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4">
      <div className="flex items-center justify-center gap-6 mb-3 text-xs font-semibold text-slate-600">
        <span className="inline-flex items-center gap-2">
          <span className="w-8 border-t-2 border-dashed border-teal-400" />
          {conservativeLabel}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-8 border-t-2 border-emerald-600" />
          {targetLabel}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label="Compound growth projection chart"
      >
        {yTicks.map((tick) => {
          const y = yAt(tick);
          return (
            <g key={tick}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text
                x={width - padRight + 8}
                y={y + 4}
                fill="#64748b"
                fontSize="11"
                fontFamily="ui-monospace, monospace"
              >
                {formatAxis(tick)}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#targetFill)" opacity="0.35" />
        <defs>
          <linearGradient id="targetFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#ecfdf5" />
          </linearGradient>
        </defs>

        <polyline
          fill="none"
          stroke="#14b8a6"
          strokeWidth="2.5"
          strokeDasharray="6 5"
          points={cPoints}
        />
        <polyline fill="none" stroke="#059669" strokeWidth="2.5" points={tPoints} />

        {conservativeSeries.map((v, i) => (
          <circle key={`c-${i}`} cx={xAt(i)} cy={yAt(v)} r="4" fill="#14b8a6" />
        ))}
        {targetSeries.map((v, i) => (
          <circle key={`t-${i}`} cx={xAt(i)} cy={yAt(v)} r="4" fill="#059669" />
        ))}

        {Array.from({ length: 6 }, (_, i) => (
          <text
            key={i}
            x={xAt(i + 1)}
            y={height - 10}
            textAnchor="middle"
            fill="#64748b"
            fontSize="11"
            fontWeight="600"
          >
            Year {i + 1}
          </text>
        ))}
      </svg>
    </div>
  );
}
