export type UserRole = "ADMIN" | "MEMBER";

export type AppUser = {
  id: string;
  username: string;
  name: string;
  /** Matches Excel `ownerName` column for row-level access. */
  ownerKey: string;
  role: UserRole;
};

export const DEMO_OWNER_KEYS = ["Alex", "Sam", "Lily"] as const;

export const APP_USERS: AppUser[] = [
  { id: "vin", username: "Vin", name: "Vin", ownerKey: "Vin", role: "ADMIN" },
  { id: "ma", username: "MA", name: "MA", ownerKey: "MA", role: "MEMBER" },
  { id: "miki", username: "Miki", name: "Miki", ownerKey: "Miki", role: "MEMBER" },
  { id: "baba", username: "BABA", name: "BABA", ownerKey: "BABA", role: "MEMBER" },
  { id: "demo", username: "demo", name: "Demo", ownerKey: "Alex", role: "ADMIN" },
];

export function findUserById(id: string): AppUser | null {
  return APP_USERS.find((u) => u.id === id) ?? null;
}

export function isAdmin(user: AppUser): boolean {
  return user.role === "ADMIN";
}

export function isDemoUser(user: AppUser | { id: string }): boolean {
  return user.id === "demo";
}

export function canViewOwner(viewer: AppUser, ownerName: string): boolean {
  return isAdmin(viewer) || viewer.ownerKey === ownerName;
}
