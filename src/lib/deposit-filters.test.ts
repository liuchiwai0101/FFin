import { describe, expect, it } from "vitest";
import {
  matchesBankFilter,
  matchesProductTypeFilter,
  normalizeBankCode,
  productTypeId,
  uniqueBankFilters,
  uniqueProductTypeFilters,
  uniqueYearFilters,
} from "./deposit-filters";
import type { DepositRecord } from "./deposit-types";

function record(partial: Partial<DepositRecord> & Pick<DepositRecord, "ownerName" | "bank">): DepositRecord {
  return {
    id: "1",
    ownerName: partial.ownerName,
    bank: partial.bank,
    product: partial.product ?? "Time Deposit",
    amount: partial.amount ?? 1000,
    rate: partial.rate ?? 0.03,
    interest: partial.interest ?? 0,
    totalAmount: partial.totalAmount ?? partial.amount ?? 1000,
    currency: partial.currency ?? "HKD",
    isCurrent: partial.isCurrent ?? false,
    fromDate: partial.fromDate ?? null,
    toDate: partial.toDate ?? null,
    months: partial.months ?? null,
    notes: partial.notes ?? null,
  };
}

describe("normalizeBankCode", () => {
  it("maps common bank labels", () => {
    expect(normalizeBankCode("MA HSBC")).toBe("HSBC");
    expect(normalizeBankCode("SC Private")).toBe("SC");
  });
});

describe("uniqueBankFilters", () => {
  it("returns only banks present for the selected user", () => {
    const records = [
      record({ ownerName: "Miki", bank: "SC" }),
      record({ ownerName: "Vin", bank: "HSBC" }),
    ];
    expect(uniqueBankFilters(records, "Miki")).toEqual(["All", "SC"]);
    expect(uniqueBankFilters(records, "All")).toEqual(["All", "SC", "HSBC"]);
  });
});

describe("uniqueYearFilters", () => {
  it("returns ended years for the selected user", () => {
    const records = [
      record({ ownerName: "Miki", bank: "SC", toDate: new Date("2024-06-01") }),
      record({ ownerName: "Vin", bank: "HSBC", toDate: new Date("2025-01-01") }),
    ];
    expect(uniqueYearFilters(records, "Miki")).toEqual(["All", "2024"]);
  });
});

describe("uniqueProductTypeFilters", () => {
  it("returns product types present for the selected user", () => {
    const records = [
      record({ ownerName: "Miki", bank: "SC", product: "Time Deposit" }),
      record({ ownerName: "Vin", bank: "HSBC", product: "綠色債券" }),
    ];
    expect(uniqueProductTypeFilters(records, "Miki")).toEqual(["TimeDeposit"]);
    expect(uniqueProductTypeFilters(records, "All")).toEqual(["TimeDeposit", "Bond"]);
  });
});

describe("matchesBankFilter", () => {
  it("matches normalized bank codes", () => {
    expect(matchesBankFilter("MA HSBC", "HSBC")).toBe(true);
    expect(matchesBankFilter("SC Private", "HSBC")).toBe(false);
  });
});

describe("productTypeId", () => {
  it("detects bond products", () => {
    expect(productTypeId("綠色債券")).toBe("Bond");
  });

  it("matches product type filters", () => {
    expect(matchesProductTypeFilter("綠色債券", "Bond")).toBe(true);
    expect(matchesProductTypeFilter("Time Deposit", "Bond")).toBe(false);
  });
});
