import SyncPageClient from "./sync-client";
import { requireAdmin } from "@/lib/access";

export default async function SyncPage() {
  await requireAdmin();
  return <SyncPageClient />;
}
