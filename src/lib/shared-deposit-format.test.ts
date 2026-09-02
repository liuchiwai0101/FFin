import { describe, expect, it } from "vitest";
import { EXCEL_RETENTION_MS } from "./excel-retention";
import {
  createSharedPayload,
  isSharedPayloadExpired,
  parseSharedDepositJson,
  serializeSharedPayload,
} from "./shared-deposit-format";

describe("shared-deposit-format", () => {
  it("round-trips fixed JSON format", () => {
    const payload = createSharedPayload({
      syncedAt: null,
      activeItems: [
        {
          ownerName: "Vin",
          bank: "BOC",
          product: "Time Deposit",
          amount: 1000,
          rate: 0.02,
          fromDate: "2025-01-01",
          toDate: "2026-01-01",
          months: 12,
          totalAmount: 1020,
          interest: 20,
          currency: "HKD",
          isCurrent: true,
        },
      ],
      historyItems: [],
    });
    const store = parseSharedDepositJson(serializeSharedPayload(payload));
    expect(store.activeItems).toHaveLength(1);
    expect(store.syncedAt).toBeTruthy();
  });

  it("expires payload after 48 hours", () => {
    const syncedAt = new Date(Date.now() - EXCEL_RETENTION_MS - 1000).toISOString();
    const expired = isSharedPayloadExpired({
      version: 1,
      syncedAt,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      activeItems: [],
      historyItems: [],
    });
    expect(expired).toBe(true);
    const store = parseSharedDepositJson(
      serializeSharedPayload({
        version: 1,
        syncedAt,
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        activeItems: [{ ownerName: "Vin", bank: "BOC", product: "TD", amount: 1, rate: 0, fromDate: null, toDate: null, months: null, totalAmount: 1, interest: 0, currency: "HKD", isCurrent: true }],
        historyItems: [],
      }),
    );
    expect(store.activeItems).toHaveLength(0);
  });
});
