import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { isAdmin, type AppUser } from "@/lib/users";

const memberLinks = [
  ["Overview", "/app"],
  ["Current Products", "/app/current"],
  ["Interest History", "/app/history"],
] as const;

const adminLinks = [...memberLinks, ["Sync Excel", "/app/sync"]] as const;

export function AppNav({ user }: { user: AppUser }) {
  const links = isAdmin(user) ? adminLinks : memberLinks;

  return (
    <header className="app-topbar">
      <div className="app-topbar-container">
        <div className="flex items-center gap-3">
          <Link href="/app" className="flex items-center gap-2 text-decoration-none">
            <span className="h-7 w-7 rounded-lg bg-teal-700 flex items-center justify-center text-white font-black text-xs shadow-sm">
              FF
            </span>
            <span className="text-sm font-extrabold tracking-tight text-slate-950 uppercase">
              Family Finance
            </span>
          </Link>
          <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md">
            {user.name}
            {isAdmin(user) ? " · Admin" : ""}
          </span>
        </div>

        <nav className="flex items-center flex-wrap gap-1">
          {links.map(([label, href]) => (
            <Link key={href} className="top-nav-item" href={href}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center">
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
