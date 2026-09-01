import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { isAdmin, type AppUser } from "@/lib/users";

export type { AppUser };

export async function requireUser(): Promise<AppUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser();
  if (!isAdmin(user)) redirect("/app");
  return user;
}

export async function requireStaff(): Promise<AppUser> {
  return requireUser();
}
