import { describe, expect, it } from "vitest";
import { createDepositBackup, parseDepositBackup } from "./deposit-backup";
import type { DepositStore } from "./deposit-types";

const sampleStore: DepositStore = {
  syncedAt: "2026-01-01T00:00:00.000Z",
  activeItems: [
    {
      ownerName: "Miki",
      bank: "BOC",
      product: "Time Deposit",
      amount: 1000,
      rate: 0.02,
      interest: 20,
      fromDate: "2025-01-01",
      toDate: "2026-01-01",
    },
  ],
  historyItems: [],
};

describe("deposit-backup", () => {
  it("round-trips wrapped backup format", () => {
    const backup = createDepositBackup(sampleStore);
    expect(parseDepositBackup(JSON.stringify(backup))).toEqual(sampleStore);
  });

  it("accepts raw store JSON", () => {
    expect(parseDepositBackup(JSON.stringify(sampleStore))).toEqual(sampleStore);
  });

  it("rejects invalid JSON", () => {
    expect(() => parseDepositBackup("{")).toThrow("invalid_json");
  });
});
