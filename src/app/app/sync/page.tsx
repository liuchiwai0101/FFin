import Link from "next/link";
import { loadDepositStore } from "@/lib/deposit-store";
import { syncExcelAction, uploadExcelAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function SyncPage() {
  const store = loadDepositStore();
  const activeCount = store.activeItems.length;
  const historyCount = store.historyItems.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200/80 pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Data Management</span>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
          Upload &amp; Sync Excel Sheet
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          All dashboard numbers come from the latest Excel upload. There is no database — upload again anytime to refresh.
        </p>
        {store.syncedAt && (
          <p className="mt-2 text-xs text-teal-700 font-semibold">
            Last loaded: {new Date(store.syncedAt).toLocaleString()}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <span className="text-xs font-bold uppercase text-slate-500">Active Portfolio Records</span>
          <p className="mt-1 text-2xl font-black text-teal-900">{activeCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Current deposits &amp; bond positions</p>
        </div>
        <div className="card p-4">
          <span className="text-xs font-bold uppercase text-slate-500">Historical Interest Records</span>
          <p className="mt-1 text-2xl font-black text-slate-900">{historyCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Matured deposits &amp; coupons</p>
        </div>
        <div className="card p-4 bg-teal-50/50 border-teal-100">
          <span className="text-xs font-bold uppercase text-teal-800">Total Loaded Rows</span>
          <p className="mt-1 text-2xl font-black text-teal-950">{activeCount + historyCount}</p>
          <p className="text-[11px] text-teal-700 mt-0.5">From Excel (local JSON cache)</p>
        </div>
      </div>

      {!activeCount && !historyCount && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No data loaded yet. Upload <code className="font-mono text-xs">Summary.xlsx</code> below to populate Overview, Current Products, and Interest History.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-6 shadow-sm border-teal-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-6 w-6 rounded-full bg-teal-100 text-teal-800 text-xs font-black flex items-center justify-center">
                1
              </span>
              <h2 className="text-base font-bold text-slate-900">Upload Excel File</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Select your latest workbook. This replaces all currently loaded rows.
            </p>
            <form action={uploadExcelAction} className="space-y-3">
              <input
                type="file"
                name="file"
                accept=".xlsx,.xls"
                required
                className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-teal-700 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
              />
              <button className="button w-full text-xs font-bold py-2.5">Upload &amp; Load Data</button>
            </form>
          </div>
        </div>

        <div className="card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-800 text-xs font-black flex items-center justify-center">
                2
              </span>
              <h2 className="text-base font-bold text-slate-900">1-Click Local Sync</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Reload from the local default file path without picking a file.
            </p>
            <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 text-xs space-y-1.5 mb-4">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Default Path:</p>
              <code className="block font-mono text-[11px] bg-white p-2 rounded border border-slate-200 text-slate-800 break-all">
                data/Summary.xlsx
              </code>
              <p className="text-[11px] text-slate-500">
                Or set <span className="font-mono">EXCEL_PATH</span> in your environment.
              </p>
            </div>
            <form action={syncExcelAction}>
              <button className="button-secondary w-full text-xs font-bold py-2.5">
                Re-Sync from Default Path
              </button>
            </form>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        <Link href="/app" className="text-teal-700 font-semibold hover:underline">
          Back to Overview
        </Link>
      </p>
    </div>
  );
}
