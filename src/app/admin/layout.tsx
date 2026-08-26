import Link from "next/link";
import { requireStaff } from "@/lib/access";
import { SignOutButton } from "@/components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  return <div className="min-h-screen bg-slate-100"><header className="border-b border-slate-200 bg-slate-950 px-5 py-4 text-white"><div className="mx-auto flex max-w-6xl items-center justify-between"><div><Link href="/admin" className="font-bold">CMS portal</Link><span className="ml-3 text-xs text-slate-400">{user.systemRole.toLowerCase()}</span></div><div className="flex gap-4"><Link className="text-sm text-slate-300 hover:text-white" href="/app">Member portal</Link><SignOutButton /></div></div></header><main className="mx-auto max-w-6xl p-5 sm:p-8">{children}</main></div>;
}
