import type { DepositItem } from "@/lib/excel-parse";

export type { DepositItem };

export type DepositRecord = Omit<DepositItem, "fromDate" | "toDate" | "id"> & {
  id: string;
  fromDate: Date | null;
  toDate: Date | null;
  notes?: string | null;
};

export type DepositStore = {
  syncedAt: string | null;
  activeItems: DepositItem[];
  historyItems: DepositItem[];
};
