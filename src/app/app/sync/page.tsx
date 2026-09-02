"use client";

import SyncPageClient from "./sync-client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsAdmin } from "@/components/user-context";

export default function SyncPage() {
  const admin = useIsAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!admin) router.replace("/app");
  }, [admin, router]);

  if (!admin) return null;
  return <SyncPageClient />;
}
