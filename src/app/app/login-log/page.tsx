"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginLogPageClient from "./login-log-client";
import { useIsAdmin, useViewer } from "@/components/user-context";
import { isDemoUser } from "@/lib/users";

function LoginLogGate() {
  const admin = useIsAdmin();
  const viewer = useViewer();
  const router = useRouter();

  useEffect(() => {
    if (!admin || isDemoUser(viewer)) router.replace("/app");
  }, [admin, viewer, router]);

  if (!admin || isDemoUser(viewer)) return null;
  return <LoginLogPageClient />;
}

export default function LoginLogPage() {
  return (
    <Suspense fallback={<div className="card p-6 text-sm text-slate-500">Loading…</div>}>
      <LoginLogGate />
    </Suspense>
  );
}
