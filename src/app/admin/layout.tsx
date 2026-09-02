import { AuthGate } from "@/components/app-shell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGate admin>{children}</AuthGate>;
}
