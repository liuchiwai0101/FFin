"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { useDepositData } from "@/components/deposit-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { downloadDepositBackup, parseDepositBackup } from "@/lib/deposit-backup";
import { excelClearAt } from "@/lib/excel-retention";
import { parseExcelArrayBuffer } from "@/lib/excel-parse";

export default function SyncPageClient() {
  const router = useRouter();
  const { t } = useLocale();
  const { store, replaceStore, clearStore, ready } = useDepositData();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const activeCount = store.activeItems.length;
  const historyCount = store.historyItems.length;

  function onUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const file = formData.get("file");
        if (!(file instanceof File) || file.size === 0) {
          throw new Error(t("sync.uploadFailed"));
        }
        const parsed = parseExcelArrayBuffer(await file.arrayBuffer());
        if (!parsed) {
          throw new Error(t("sync.uploadFailed"));
        }
        const payload = {
          syncedAt: new Date().toISOString(),
          activeItems: parsed.activeItems,
          historyItems: parsed.historyItems,
        };
        await replaceStore(payload);
        setMessage(
          t("sync.loaded", {
            active: payload.activeItems.length,
            history: payload.historyItems.length,
          }),
        );
        event.currentTarget.reset();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("sync.uploadFailed"));
      }
    });
  }

  function onImportBackup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const file = formData.get("backup");
        if (!(file instanceof File) || file.size === 0) {
          throw new Error(t("sync.importFailed"));
        }
        const imported = parseDepositBackup(await file.text());
        const payload = {
          ...imported,
          syncedAt: new Date().toISOString(),
        };
        await replaceStore(payload);
        setMessage(
          t("sync.imported", {
            active: payload.activeItems.length,
            history: payload.historyItems.length,
          }),
        );
        event.currentTarget.reset();
        router.refresh();
      } catch {
        setError(t("sync.importFailed"));
      }
    });
  }

  function onExportBackup() {
    setError("");
    downloadDepositBackup(store);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200/80 pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-700">{t("sync.eyebrow")}</span>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">{t("sync.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("sync.desc")}</p>
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {t("sync.deviceNote")}
        </p>
        {ready && store.syncedAt && (
          <>
            <p className="mt-2 text-xs text-teal-700 font-semibold">
              {t("sync.lastLoaded", { date: new Date(store.syncedAt).toLocaleString() })}
            </p>
            {excelClearAt(store.syncedAt) && (
              <p className="mt-1 text-xs text-amber-700 font-semibold">
                {t("sync.clearAt", {
                  date: excelClearAt(store.syncedAt)!.toLocaleString(),
                })}
              </p>
            )}
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <span className="text-xs font-bold uppercase text-slate-500">{t("sync.activeRecords")}</span>
          <p className="mt-1 text-2xl font-black text-teal-900">{ready ? activeCount : "—"}</p>
        </div>
        <div className="card p-4">
          <span className="text-xs font-bold uppercase text-slate-500">{t("sync.historyRecords")}</span>
          <p className="mt-1 text-2xl font-black text-slate-900">{ready ? historyCount : "—"}</p>
        </div>
        <div className="card p-4 bg-teal-50/50 border-teal-100">
          <span className="text-xs font-bold uppercase text-teal-800">{t("sync.totalRows")}</span>
          <p className="mt-1 text-2xl font-black text-teal-950">
            {ready ? activeCount + historyCount : "—"}
          </p>
          <p className="text-[11px] text-teal-700 mt-0.5">{t("sync.storedBrowser")}</p>
        </div>
      </div>

      {ready && !activeCount && !historyCount && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("sync.noData")}
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
            {t("sync.openOverview")}
          </Link>
        </div>
      )}

      <div className="card p-6 shadow-sm border-teal-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-6 w-6 rounded-full bg-teal-100 text-teal-800 text-xs font-black flex items-center justify-center">
            1
          </span>
          <h2 className="text-base font-bold text-slate-900">{t("sync.uploadTitle")}</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">{t("sync.uploadDesc")}</p>
        <form onSubmit={onUpload} className="space-y-3">
          <input
            type="file"
            name="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            required
            className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-teal-700 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
          />
          <button className="button w-full text-xs font-bold py-2.5" disabled={pending} type="submit">
            {pending ? t("sync.uploading") : t("sync.uploadBtn")}
          </button>
        </form>
        {ready && (activeCount > 0 || historyCount > 0) && (
          <button
            type="button"
            className="mt-3 text-xs font-semibold text-rose-600 hover:underline"
            onClick={() => {
              clearStore();
              setMessage(t("sync.cleared"));
            }}
          >
            {t("sync.clearData")}
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-800 text-xs font-black flex items-center justify-center">
              2
            </span>
            <h2 className="text-base font-bold text-slate-900">{t("sync.exportBackupTitle")}</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">{t("sync.exportBackupDesc")}</p>
          <button
            type="button"
            className="button-secondary w-full text-xs font-bold py-2.5"
            disabled={!ready || (activeCount === 0 && historyCount === 0)}
            onClick={onExportBackup}
          >
            {t("sync.exportBackupBtn")}
          </button>
        </div>

        <div className="card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-800 text-xs font-black flex items-center justify-center">
              3
            </span>
            <h2 className="text-base font-bold text-slate-900">{t("sync.importBackupTitle")}</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">{t("sync.importBackupDesc")}</p>
          <form onSubmit={onImportBackup} className="space-y-3">
            <input
              type="file"
              name="backup"
              accept=".json,application/json"
              required
              className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
            />
            <button className="button w-full text-xs font-bold py-2.5" disabled={pending} type="submit">
              {pending ? t("sync.importing") : t("sync.importBackupBtn")}
            </button>
          </form>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        <Link href="/app" className="text-teal-700 font-semibold hover:underline">
          {t("sync.backOverview")}
        </Link>
      </p>
    </div>
  );
}
