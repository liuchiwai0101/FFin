import { AppNav } from "@/components/app-nav";
import { requireStaff } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  return (
    <div className="app-shell">
      <AppNav userName={user.name} />
      <main className="app-main">{children}</main>
    </div>
  );
}
