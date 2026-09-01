"use client";

import { LocaleProvider } from "@/lib/i18n/locale-provider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}
