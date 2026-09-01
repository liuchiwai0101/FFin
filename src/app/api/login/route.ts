import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  createSessionToken,
} from "@/lib/session";
import { findUserByCredentials } from "@/lib/users";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const account = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const nextRaw = String(form.get("next") ?? "/app") || "/app";
  const next = nextRaw.startsWith("/") ? nextRaw : "/app";

  const user = findUserByCredentials(account, password);
  if (!user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "1");
    url.searchParams.set("next", next);
    return NextResponse.redirect(url, 303);
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.redirect(new URL(next, request.url), 303);
}
