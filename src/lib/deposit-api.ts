import { getAuthHeaders } from "@/lib/client-auth";
import type { DepositStore } from "@/lib/deposit-types";

export function depositApiUrl(): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
  return base ? `${base}/api/deposit` : "/api/deposit";
}

export async function fetchSharedDepositStore(): Promise<DepositStore | null> {
  try {
    const response = await fetch(depositApiUrl(), {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as DepositStore;
  } catch {
    return null;
  }
}

export async function pushSharedDepositStore(store: DepositStore): Promise<DepositStore | null> {
  try {
    const response = await fetch(depositApiUrl(), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(store),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as DepositStore;
  } catch {
    return null;
  }
}

export async function clearSharedDepositStore(): Promise<boolean> {
  try {
    const response = await fetch(depositApiUrl(), {
      method: "DELETE",
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}
