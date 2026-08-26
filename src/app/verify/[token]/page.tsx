import { createHash } from "crypto";
import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const record = await db.emailVerificationToken.findUnique({ where: { tokenHash } });
  const valid = record && !record.usedAt && record.expiresAt > new Date();
  if (valid) {
    await db.$transaction([
      db.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
      db.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      db.auditLog.create({ data: { actorId: record.userId, action: "EMAIL_VERIFIED", entityType: "User", entityId: record.userId } }),
    ]);
  }
  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Account verification</p>
        <h1>{valid ? "Email verified" : "This link is no longer valid"}</h1>
        <p className="subtitle">
          {valid
            ? "You can now sign in to your financial dashboard."
            : "Request a new verification email from the administrator."}
        </p>
        {valid && (
          <Link className="button w-full mt-6" href="/login">
            Sign in
          </Link>
        )}
      </section>
    </main>
  );
}
