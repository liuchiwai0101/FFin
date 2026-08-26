import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  if (password.length < 12) return NextResponse.json({ error: "Use a password with at least 12 characters." }, { status: 400 });
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: createHash("sha256").update(token).digest("hex") } });
  if (!record || record.usedAt || record.expiresAt <= new Date()) return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: await bcrypt.hash(password, 12) } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.auditLog.create({ data: { actorId: record.userId, action: "PASSWORD_RESET", entityType: "User", entityId: record.userId } }),
  ]);
  return NextResponse.json({ ok: true });
}
