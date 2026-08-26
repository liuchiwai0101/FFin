"use client";

import { useMemo, useState, type ReactNode } from "react";

export type SortValue = string | number | null | undefined;
export type SortType = "string" | "number" | "date";

export type SortableColumn = {
  key: string;
  label: ReactNode;
  className?: string;
  sortable?: boolean;
  type?: SortType;
};

export type SortableRow = {
  id: string;
  values: Record<string, SortValue>;
  /** Pre-built `<td>` elements (one per column). */
  cells: ReactNode[];
};

type SortDir = "asc" | "desc";

type SortableTableProps = {
  columns: SortableColumn[];
  rows: SortableRow[];
  footer?: ReactNode;
  emptyMessage?: string;
  className?: string;
  defaultSortKey?: string;
  defaultSortDir?: SortDir;
};

function compareValues(a: SortValue, b: SortValue, type: SortType, dir: SortDir): number {
  const emptyA = a === null || a === undefined || a === "";
  const emptyB = b === null || b === undefined || b === "";
  if (emptyA && emptyB) return 0;
  if (emptyA) return 1;
  if (emptyB) return -1;

  let result = 0;
  if (type === "number" || type === "date") {
    const na = typeof a === "number" ? a : Number(a);
    const nb = typeof b === "number" ? b : Number(b);
    const fa = Number.isFinite(na) ? na : 0;
    const fb = Number.isFinite(nb) ? nb : 0;
    result = fa - fb;
  } else {
    result = String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }

  return dir === "asc" ? result : -result;
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className="sort-icon" aria-hidden="true">
      <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
        <path
          d="M5 1L8.5 5.5H1.5L5 1Z"
          fill={active && dir === "asc" ? "currentColor" : "#cbd5e1"}
        />
        <path
          d="M5 13L1.5 8.5H8.5L5 13Z"
          fill={active && dir === "desc" ? "currentColor" : "#cbd5e1"}
        />
      </svg>
    </span>
  );
}

export function SortableTable({
  columns,
  rows,
  footer,
  emptyMessage = "No rows to display.",
  className,
  defaultSortKey,
  defaultSortDir = "asc",
}: SortableTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey ?? null);
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir);

  const activeColumn = columns.find((c) => c.key === sortKey);

  const sortedRows = useMemo(() => {
    if (!sortKey || !activeColumn || activeColumn.sortable === false) {
      return rows;
    }
    const type = activeColumn.type ?? "string";
    return [...rows].sort((ra, rb) =>
      compareValues(ra.values[sortKey], rb.values[sortKey], type, sortDir),
    );
  }, [rows, sortKey, sortDir, activeColumn]);

  function toggleSort(column: SortableColumn) {
    if (column.sortable === false) return;
    if (sortKey === column.key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(column.key);
    setSortDir(column.type === "number" || column.type === "date" ? "desc" : "asc");
  }

  return (
    <table className={className}>
      <thead>
        <tr>
          {columns.map((column) => {
            const sortable = column.sortable !== false;
            const active = sortKey === column.key;
            const alignRight = column.className?.includes("text-right");
            const alignCenter = column.className?.includes("text-center");

            if (!sortable) {
              return (
                <th key={column.key} className={column.className}>
                  {column.label}
                </th>
              );
            }

            return (
              <th
                key={column.key}
                className={column.className}
                aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
              >
                <button
                  type="button"
                  className={`sort-th-btn ${alignRight ? "justify-end" : alignCenter ? "justify-center" : "justify-start"} ${active ? "is-active" : ""}`}
                  onClick={() => toggleSort(column)}
                >
                  <span>{column.label}</span>
                  <SortIcon active={active} dir={sortDir} />
                </button>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sortedRows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="text-center text-slate-500 py-8">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          sortedRows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
              {row.cells}
            </tr>
          ))
        )}
      </tbody>
      {footer ? <tfoot>{footer}</tfoot> : null}
    </table>
  );
}
