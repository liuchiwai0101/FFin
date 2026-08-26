import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").toLowerCase().trim();
  const limit = await checkRateLimit("passwordReset", `${requestIp(request)}:${email}`);
  if (!limit.success) return NextResponse.json({ error: "Too many requests. Try later." }, { status: 429 });
  const user = await db.user.findUnique({ where: { email } });
  if (user) {
    const token = randomBytes(32).toString("hex");
    await db.passwordResetToken.create({ data: { userId: user.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
    await sendPasswordResetEmail(user.email, token);
    await db.auditLog.create({ data: { actorId: user.id, action: "PASSWORD_RESET_REQUESTED", entityType: "User", entityId: user.id } });
  }
  return NextResponse.json({ ok: true });
}
