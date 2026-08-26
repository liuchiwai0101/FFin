import { redirect } from "next/navigation";
import { getSessionUser, HARDCODED_USER } from "@/lib/session";

export type AppUser = typeof HARDCODED_USER;

export async function requireUser(): Promise<AppUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireStaff(): Promise<AppUser> {
  return requireUser();
}
