export type UserRole = "ADMIN" | "MEMBER";

export type AppUser = {
  id: string;
  username: string;
  name: string;
  /** Matches Excel `ownerName` column for row-level access. */
  ownerKey: string;
  role: UserRole;
};

export const APP_USERS: AppUser[] = [
  { id: "vin", username: "Vin", name: "Vin", ownerKey: "Vin", role: "ADMIN" },
  { id: "ma", username: "MA", name: "MA", ownerKey: "MA", role: "MEMBER" },
  { id: "miki", username: "Miki", name: "Miki", ownerKey: "Miki", role: "MEMBER" },
  { id: "baba", username: "BABA", name: "BABA", ownerKey: "BABA", role: "MEMBER" },
];

export function findUserById(id: string): AppUser | null {
  return APP_USERS.find((u) => u.id === id) ?? null;
}

export function isAdmin(user: AppUser): boolean {
  return user.role === "ADMIN";
}

export function canViewOwner(viewer: AppUser, ownerName: string): boolean {
  return isAdmin(viewer) || viewer.ownerKey === ownerName;
}
