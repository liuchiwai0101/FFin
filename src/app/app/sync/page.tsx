import { db } from "@/lib/db";
import { syncExcelAction, uploadExcelAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function SyncPage() {
  const [activeCount, historyCount] = await Promise.all([
    db.depositRecord.count({ where: { isCurrent: true } }),
    db.depositRecord.count({ where: { isCurrent: false } }),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Data Management</span>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
          Upload &amp; Sync Excel Sheet
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload any <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">.xlsx</code> file directly or synchronize from the local Summary file.
        </p>
      </div>

      {/* Database Status */}
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
          <span className="text-xs font-bold uppercase text-teal-800">Total Live Data</span>
          <p className="mt-1 text-2xl font-black text-teal-950">{activeCount + historyCount}</p>
          <p className="text-[11px] text-teal-700 mt-0.5">Synchronized in PostgreSQL</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Method 1: Direct File Upload */}
        <div className="card p-6 shadow-sm border-teal-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-6 w-6 rounded-full bg-teal-100 text-teal-800 text-xs font-black flex items-center justify-center">
                1
              </span>
              <h2 className="text-base font-bold text-slate-900">Direct File Upload</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Select and upload an Excel workbook (<code className="font-mono">.xlsx</code> or <code className="font-mono">.xls</code>) from your computer.
            </p>

            <form action={uploadExcelAction} className="space-y-4">
              <div className="border-2 border-dashed border-teal-200 rounded-lg p-5 bg-teal-50/30 text-center hover:bg-teal-50/60 transition-colors">
                <input
                  type="file"
                  name="file"
                  id="excel-file"
                  accept=".xlsx, .xls"
                  required
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-700 file:text-white hover:file:bg-teal-800 file:cursor-pointer cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-2">
                  Supports sheets with &quot;Bank interest&quot; structure
                </p>
              </div>

              <button className="button w-full text-xs font-bold py-2.5">
                Upload &amp; Parse File
              </button>
            </form>
          </div>
        </div>

        {/* Method 2: Local Download File Quick Sync */}
        <div className="card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-800 text-xs font-black flex items-center justify-center">
                2
              </span>
              <h2 className="text-base font-bold text-slate-900">1-Click Local Sync</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Automatically reload from your local default file path without re-selecting it.
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
    </div>
  );
}
