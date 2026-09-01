import { AppNav } from "@/components/app-nav";
import { DepositProvider } from "@/components/deposit-provider";
import { UserProvider } from "@/components/user-context";
import { requireUser } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <UserProvider user={user}>
      <div className="app-shell">
        <AppNav user={user} />
        <main className="app-main">
          <DepositProvider>{children}</DepositProvider>
        </main>
      </div>
    </UserProvider>
  );
}
