import { describe, expect, it } from "vitest";
import {
  APP_USERS,
  canViewOwner,
  findUserById,
  isAdmin,
} from "./users";
import { findUserByCredentials } from "./users-auth";

const TEST_PASSWORDS = {
  Vin: "test-vin-password",
  MA: "test-ma-password",
  Miki: "test-miki-password",
  BABA: "test-baba-password",
};

process.env.FFIN_PASSWORDS = JSON.stringify(TEST_PASSWORDS);

describe("users", () => {
  it("authenticates configured accounts", () => {
    for (const user of APP_USERS) {
      expect(
        findUserByCredentials(user.username, TEST_PASSWORDS[user.username as keyof typeof TEST_PASSWORDS]),
      ).toEqual(user);
    }
  });

  it("rejects invalid credentials", () => {
    expect(findUserByCredentials("Vin", "wrong")).toBeNull();
    expect(findUserByCredentials("unknown", TEST_PASSWORDS.Vin)).toBeNull();
    const previous = process.env.FFIN_PASSWORDS;
    delete process.env.FFIN_PASSWORDS;
    expect(findUserByCredentials("Vin", TEST_PASSWORDS.Vin)).toBeNull();
    process.env.FFIN_PASSWORDS = previous;
  });

  it("grants Vin admin access to all owners", () => {
    const vin = findUserById("vin");
    expect(vin).not.toBeNull();
    expect(isAdmin(vin!)).toBe(true);
    expect(canViewOwner(vin!, "MA")).toBe(true);
    expect(canViewOwner(vin!, "BABA")).toBe(true);
  });

  it("restricts members to their own owner rows", () => {
    const ma = findUserById("ma");
    expect(ma).not.toBeNull();
    expect(isAdmin(ma!)).toBe(false);
    expect(canViewOwner(ma!, "MA")).toBe(true);
    expect(canViewOwner(ma!, "Vin")).toBe(false);
  });
});
