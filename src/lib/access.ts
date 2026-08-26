import { SystemRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

export async function requireStaff() {
  const user = await requireUser();
  if (user.systemRole !== SystemRole.ADMIN && user.systemRole !== SystemRole.SUPPORT) {
    redirect("/app");
  }
  return user;
}
