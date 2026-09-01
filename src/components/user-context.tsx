"use client";

import { createContext, useContext, type ReactNode } from "react";
import { isAdmin, type AppUser } from "@/lib/users";

const UserContext = createContext<AppUser | null>(null);

export function UserProvider({ user, children }: { user: AppUser; children: ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useViewer(): AppUser {
  const user = useContext(UserContext);
  if (!user) throw new Error("useViewer must be used within UserProvider");
  return user;
}

export function useIsAdmin(): boolean {
  return isAdmin(useViewer());
}
