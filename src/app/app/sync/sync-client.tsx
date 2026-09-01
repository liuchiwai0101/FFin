"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useDepositData } from "@/components/deposit-provider";

export default function SyncPageClient() {
  const router = useRouter();
  const { store, replaceStore, clearStore, ready } = useDepositData();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const activeCount = store.activeItems.length;
  const historyCount = store.historyItems.length;

  function onUpload(formData: FormData) {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/upload-excel", {
          method: "POST",
          body: formData,
        });
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload.error || "Upload failed.");
        }
        replaceStore(payload);
        setMessage(
          `Loaded ${payload.activeItems.length} active and ${payload.historyItems.length} history rows.`,
        );
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      }
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200/80 pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Data Management</span>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
          Upload &amp; Sync Excel Sheet
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">Summary.xlsx</code> to
          populate the dashboard for all family members. Data stays in this browser until you clear it.
        </p>
        {ready && store.syncedAt && (
          <p className="mt-2 text-xs text-teal-700 font-semibold">
            Last loaded: {new Date(store.syncedAt).toLocaleString()}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <span className="text-xs font-bold uppercase text-slate-500">Active Portfolio Records</span>
          <p className="mt-1 text-2xl font-black text-teal-900">{ready ? activeCount : "—"}</p>
        </div>
        <div className="card p-4">
          <span className="text-xs font-bold uppercase text-slate-500">Historical Interest Records</span>
          <p className="mt-1 text-2xl font-black text-slate-900">{ready ? historyCount : "—"}</p>
        </div>
        <div className="card p-4 bg-teal-50/50 border-teal-100">
          <span className="text-xs font-bold uppercase text-teal-800">Total Loaded Rows</span>
          <p className="mt-1 text-2xl font-black text-teal-950">
            {ready ? activeCount + historyCount : "—"}
          </p>
          <p className="text-[11px] text-teal-700 mt-0.5">Stored in this browser</p>
        </div>
      </div>

      {ready && !activeCount && !historyCount && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No data loaded yet. Upload your Excel file below to populate Overview, Current Products, and Interest History.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          {message}{" "}
          <Link href="/app" className="font-semibold underline">
            Open Overview
          </Link>
        </div>
      )}

      <div className="card p-6 shadow-sm border-teal-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-6 w-6 rounded-full bg-teal-100 text-teal-800 text-xs font-black flex items-center justify-center">
            1
          </span>
          <h2 className="text-base font-bold text-slate-900">Upload Excel File</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Select the latest workbook (sheet name <strong>Bank interest</strong>). This replaces all currently loaded rows.
        </p>
        <form action={onUpload} className="space-y-3">
          <input
            type="file"
            name="file"
            accept=".xlsx,.xls"
            required
            className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-teal-700 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
          />
          <button className="button w-full text-xs font-bold py-2.5" disabled={pending}>
            {pending ? "Uploading…" : "Upload & Load Data"}
          </button>
        </form>
        {ready && (activeCount > 0 || historyCount > 0) && (
          <button
            type="button"
            className="mt-3 text-xs font-semibold text-rose-600 hover:underline"
            onClick={() => {
              clearStore();
              setMessage("Cleared loaded Excel data from this browser.");
            }}
          >
            Clear loaded data
          </button>
        )}
      </div>

      <p className="text-center text-xs text-slate-400">
        <Link href="/app" className="text-teal-700 font-semibold hover:underline">
          Back to Overview
        </Link>
      </p>
    </div>
  );
}
