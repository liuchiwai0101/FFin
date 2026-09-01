import { describe, expect, it } from "vitest";
import {
  APP_USERS,
  canViewOwner,
  defaultPassword,
  findUserByCredentials,
  findUserById,
  isAdmin,
} from "./users";

describe("users", () => {
  it("uses username + 123 as default password", () => {
    expect(defaultPassword("Vin")).toBe("Vin123");
    expect(defaultPassword("MA")).toBe("MA123");
  });

  it("authenticates all family accounts", () => {
    for (const user of APP_USERS) {
      expect(findUserByCredentials(user.username, defaultPassword(user.username))).toEqual(user);
    }
  });

  it("rejects invalid credentials", () => {
    expect(findUserByCredentials("Vin", "wrong")).toBeNull();
    expect(findUserByCredentials("unknown", "Vin123")).toBeNull();
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
