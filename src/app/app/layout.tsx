import { AppShell } from "@/components/app-shell";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
