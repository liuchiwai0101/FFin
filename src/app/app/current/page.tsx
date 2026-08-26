import { Suspense } from "react";
import CurrentProductsPage from "./current-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="card p-6 text-sm text-slate-500">Loading…</div>}>
      <CurrentProductsPage />
    </Suspense>
  );
}
