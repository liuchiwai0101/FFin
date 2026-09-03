import { describe, expect, it } from "vitest";
import { pickNewestDepositStore } from "./github-sync";
import type { DepositStore } from "./deposit-types";

function store(syncedAt: string | null, count = 1): DepositStore {
  return {
    syncedAt,
    activeItems: Array.from({ length: count }, (_, index) => ({
      ownerName: "Vin",
      bank: "BOC",
      product: "TD",
      amount: index + 1,
      rate: 0,
      fromDate: null,
      toDate: null,
      months: null,
      totalAmount: index + 1,
      interest: 0,
      currency: "HKD",
      isCurrent: true,
    })),
    historyItems: [],
  };
}

describe("pickNewestDepositStore", () => {
  it("prefers the newest non-empty store", () => {
    const picked = pickNewestDepositStore([
      store("2026-09-02T10:00:00.000Z", 2),
      store("2026-09-03T10:00:00.000Z", 1),
    ]);
    expect(picked?.syncedAt).toBe("2026-09-03T10:00:00.000Z");
    expect(picked?.activeItems).toHaveLength(1);
  });

  it("returns null when every fetch fails", () => {
    expect(pickNewestDepositStore([null, null])).toBeNull();
  });
});
