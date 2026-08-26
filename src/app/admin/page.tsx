import { SortableTable } from "@/components/sortable-table";
import { db } from "@/lib/db";

export default async function AdminPage() {
  const [users, accountsCount, transactionsCount, events] = await Promise.all([
    db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        systemRole: true,
        createdAt: true,
        _count: { select: { accounts: true, transactions: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.account.count(),
    db.transaction.count(),
    db.auditLog.findMany({
      include: { actor: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div>
      <header className="mb-8">
        <p className="eyebrow">Operations</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Platform Status</h1>
        <p className="subtitle">
          Operational metadata and activity log.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Registered Users" value={String(users.length)} />
        <Stat label="Total Accounts" value={String(accountsCount)} />
        <Stat label="Total Transactions" value={String(transactionsCount)} />
      </section>

      <section className="mt-8">
        <div className="card overflow-x-auto">
          <h2 className="mb-3 font-semibold text-base">Users Overview</h2>
          <SortableTable
            defaultSortKey="createdAt"
            defaultSortDir="desc"
            columns={[
              { key: "user", label: "User" },
              { key: "role", label: "Portal Role" },
              { key: "accounts", label: "Accounts", type: "number" },
              { key: "transactions", label: "Transactions", type: "number" },
              { key: "createdAt", label: "Created", type: "date" },
            ]}
            rows={users.map((user) => ({
              id: user.id,
              values: {
                user: user.name ?? user.email,
                role: user.systemRole,
                accounts: user._count.accounts,
                transactions: user._count.transactions,
                createdAt: user.createdAt.getTime(),
              },
              cells: [
                <td key="user">
                  <strong>{user.name ?? "Unnamed"}</strong>
                  <br />
                  <span className="text-slate-500 text-xs">{user.email}</span>
                </td>,
                <td key="role">
                  <span className="badge">{user.systemRole}</span>
                </td>,
                <td key="accounts">{user._count.accounts}</td>,
                <td key="transactions">{user._count.transactions}</td>,
                <td key="createdAt" className="text-slate-500 text-xs">
                  {user.createdAt.toLocaleDateString()}
                </td>,
              ],
            }))}
            emptyMessage="No users found."
          />
        </div>
      </section>

      <section className="card mt-6 overflow-x-auto">
        <h2 className="mb-3 font-semibold text-base">Audit Activity</h2>
        <SortableTable
          defaultSortKey="time"
          defaultSortDir="desc"
          columns={[
            { key: "time", label: "Time", type: "date" },
            { key: "actor", label: "Actor" },
            { key: "action", label: "Action" },
            { key: "target", label: "Target Entity" },
          ]}
          rows={events.map((event) => ({
            id: event.id,
            values: {
              time: event.createdAt.getTime(),
              actor: event.actor?.name ?? event.actor?.email ?? "System",
              action: event.action,
              target: `${event.entityType} ${event.entityId ?? ""}`,
            },
            cells: [
              <td key="time" className="text-slate-500 text-xs whitespace-nowrap">
                {event.createdAt.toLocaleString()}
              </td>,
              <td key="actor" className="font-medium text-slate-800">
                {event.actor?.name ?? event.actor?.email ?? "System"}
              </td>,
              <td key="action">
                <span className="font-mono text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                  {event.action}
                </span>
              </td>,
              <td key="target" className="text-slate-600 text-xs">
                {event.entityType} {event.entityId ? `(${event.entityId})` : ""}
              </td>,
            ],
          }))}
          emptyMessage="No audit events yet."
        />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}
