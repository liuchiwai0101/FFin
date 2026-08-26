import Link from "next/link";
import { SystemRole } from "@prisma/client";
import { SignOutButton } from "@/components/sign-out-button";

const links = [
  ["Overview", "/app"],
  ["Current Products", "/app/current"],
  ["Interest History", "/app/history"],
  ["Sync Excel", "/app/sync"],
];

export function AppNav({
  userName,
  systemRole,
}: {
  userName?: string | null;
  systemRole: SystemRole;
}) {
  return (
    <header className="app-topbar">
      <div className="app-topbar-container">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <Link href="/app" className="flex items-center gap-2 text-decoration-none">
            <span className="h-7 w-7 rounded-lg bg-teal-700 flex items-center justify-center text-white font-black text-xs shadow-sm">
              FF
            </span>
            <span className="text-sm font-extrabold tracking-tight text-slate-950 uppercase">
              Family Finance
            </span>
          </Link>
          {userName && (
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md">
              {userName}
            </span>
          )}
        </div>

        {/* Center: Navigation Links */}
        <nav className="flex items-center flex-wrap gap-1">
          {links.map(([label, href]) => (
            <Link key={href} className="top-nav-item" href={href}>
              {label}
            </Link>
          ))}
          {systemRole !== SystemRole.MEMBER && (
            <Link className="top-nav-item top-nav-item-admin" href="/admin">
              CMS Portal
            </Link>
          )}
        </nav>

        {/* Right: Sign Out */}
        <div className="flex items-center">
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
