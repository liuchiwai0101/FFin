/** Excel data is kept for 6 hours after import, then auto-cleared. */
export const EXCEL_RETENTION_MS = 6 * 60 * 60 * 1000;

export function excelClearAt(syncedAt: string | null | undefined): Date | null {
  if (!syncedAt) return null;
  const imported = new Date(syncedAt);
  if (Number.isNaN(imported.getTime())) return null;
  return new Date(imported.getTime() + EXCEL_RETENTION_MS);
}

export function isExcelExpired(syncedAt: string | null | undefined, now = Date.now()): boolean {
  const clearAt = excelClearAt(syncedAt);
  if (!clearAt) return false;
  return now >= clearAt.getTime();
}

export function msUntilExcelClear(syncedAt: string | null | undefined, now = Date.now()): number | null {
  const clearAt = excelClearAt(syncedAt);
  if (!clearAt) return null;
  return clearAt.getTime() - now;
}
