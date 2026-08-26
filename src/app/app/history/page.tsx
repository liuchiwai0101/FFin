import { Suspense } from "react";
import HistoryPage from "./history-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="card p-6 text-sm text-slate-500">Loading…</div>}>
      <HistoryPage />
    </Suspense>
  );
}
