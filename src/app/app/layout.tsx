import { AppNav } from "@/components/app-nav";
import { DepositProvider } from "@/components/deposit-provider";
import { requireUser } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="app-shell">
      <AppNav userName={user.name} />
      <main className="app-main">
        <DepositProvider>{children}</DepositProvider>
      </main>
    </div>
  );
}
