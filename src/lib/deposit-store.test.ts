import { describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { EXCEL_RETENTION_MS } from "./excel-retention";

describe("deposit-store expiry", () => {
  it("clears expired shared data on load", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ffin-store-"));
    const previous = process.cwd();
    process.chdir(tempDir);
    try {
      fs.mkdirSync(path.join(tempDir, "data"), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, "data", "latest.json"),
        JSON.stringify({
          syncedAt: new Date(Date.now() - EXCEL_RETENTION_MS - 1000).toISOString(),
          activeItems: [
            {
              ownerName: "Vin",
              bank: "BOC",
              product: "Time Deposit",
              amount: 100,
              rate: 0.02,
              interest: 2,
            },
          ],
          historyItems: [],
        }),
      );
      const { loadActiveDepositStore } = await import("./deposit-store");
      const active = loadActiveDepositStore();
      expect(active.activeItems).toHaveLength(0);
      expect(active.syncedAt).toBeNull();
    } finally {
      process.chdir(previous);
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
