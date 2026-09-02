import type { LoginEntry } from "@/lib/login-log";

type LoginLogTableProps = {
  entries: LoginEntry[];
  formatTime: (iso: string) => string;
  labels: {
    when: string;
    account: string;
    role: string;
    device: string;
    admin: string;
    member: string;
  };
  compact?: boolean;
};

export function LoginLogTable({ entries, formatTime, labels, compact = false }: LoginLogTableProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className={`overflow-x-auto ${compact ? "" : "max-h-[32rem] overflow-y-auto"}`}>
      <table className="w-full text-left text-xs">
        <thead className={compact ? "" : "sticky top-0 bg-white z-10"}>
          <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider">
            <th className="py-2 pr-3 font-bold">{labels.when}</th>
            <th className="py-2 pr-3 font-bold">{labels.account}</th>
            <th className="py-2 pr-3 font-bold">{labels.role}</th>
            <th className="py-2 font-bold">{labels.device}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={`${entry.loggedAt}-${entry.userId}-${entry.accountEntered}`} className="border-b border-slate-100">
              <td className="py-2 pr-3 whitespace-nowrap text-slate-700">{formatTime(entry.loggedAt)}</td>
              <td className="py-2 pr-3 text-slate-900 font-semibold">
                {entry.name} ({entry.accountEntered})
              </td>
              <td className="py-2 pr-3 text-slate-600">
                {entry.role === "ADMIN" ? labels.admin : labels.member}
              </td>
              <td className="py-2 text-slate-600">
                {entry.timezone} · {entry.language}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
