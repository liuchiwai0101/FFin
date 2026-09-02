"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { DepositProvider } from "@/components/deposit-provider";
import { UserProvider, useViewer } from "@/components/user-context";
import { readSessionUser } from "@/lib/client-auth";
import { isAdmin } from "@/lib/users";

function subscribeNoop() {
  return () => {};
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
      Loading…
    </div>
  );
}

function Redirect({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(href);
  }, [href, router]);
  return <Loading />;
}

export function AuthGate({
  children,
  admin = false,
}: {
  children: React.ReactNode;
  admin?: boolean;
}) {
  const ready = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const session = useSyncExternalStore(subscribeNoop, readSessionUser, () => null);

  if (!ready) return <Loading />;
  if (!session) return <Redirect href="/login" />;
  if (admin && !isAdmin(session)) return <Redirect href="/app" />;

  return <UserProvider user={session}>{children}</UserProvider>;
}

function AppChrome({ children }: { children: React.ReactNode }) {
  const user = useViewer();
  return (
    <DepositProvider>
      <div className="app-shell">
        <AppNav user={user} />
        <main className="app-main">{children}</main>
      </div>
    </DepositProvider>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AppChrome>{children}</AppChrome>
    </AuthGate>
  );
}
