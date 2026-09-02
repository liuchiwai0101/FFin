"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginLogPageClient from "./login-log-client";
import { useIsAdmin } from "@/components/user-context";

function LoginLogGate() {
  const admin = useIsAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!admin) router.replace("/app");
  }, [admin, router]);

  if (!admin) return null;
  return <LoginLogPageClient />;
}

export default function LoginLogPage() {
  return (
    <Suspense fallback={<div className="card p-6 text-sm text-slate-500">Loading…</div>}>
      <LoginLogGate />
    </Suspense>
  );
}
