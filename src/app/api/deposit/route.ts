import { NextRequest, NextResponse } from "next/server";
import type { DepositStore } from "@/lib/deposit-types";
import {
  clearDepositStore,
  loadActiveDepositStore,
  replaceDepositStore,
} from "@/lib/deposit-store";
import { findUserById, isAdmin } from "@/lib/users";

export const runtime = "nodejs";

function corsHeaders() {
  const origin = process.env.CORS_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-FFin-User-Id",
  };
}

function withCors(response: NextResponse) {
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

function sessionUser(request: NextRequest) {
  const id = request.headers.get("X-FFin-User-Id");
  return id ? findUserById(id) : null;
}

function isDepositStore(value: unknown): value is DepositStore {
  if (!value || typeof value !== "object") return false;
  const store = value as Record<string, unknown>;
  return Array.isArray(store.activeItems) && Array.isArray(store.historyItems);
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET() {
  const store = loadActiveDepositStore();
  return withCors(NextResponse.json(store));
}

export async function PUT(request: NextRequest) {
  const user = sessionUser(request);
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }
  if (!isAdmin(user)) {
    return withCors(NextResponse.json({ error: "Forbidden" }, { status: 403 }));
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return withCors(NextResponse.json({ error: "Invalid JSON" }, { status: 400 }));
  }

  if (!isDepositStore(body)) {
    return withCors(NextResponse.json({ error: "Invalid store payload" }, { status: 400 }));
  }

  const store = replaceDepositStore(body);
  return withCors(NextResponse.json(store));
}

export async function DELETE(request: NextRequest) {
  const user = sessionUser(request);
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }
  if (!isAdmin(user)) {
    return withCors(NextResponse.json({ error: "Forbidden" }, { status: 403 }));
  }

  const store = clearDepositStore();
  return withCors(NextResponse.json(store));
}
