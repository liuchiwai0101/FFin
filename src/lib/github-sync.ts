import type { DepositStore } from "@/lib/deposit-types";
import {
  createEmptySharedPayload,
  createSharedPayload,
  parseSharedDepositJson,
  serializeSharedPayload,
  type SharedDepositPayload,
} from "@/lib/shared-deposit-format";

type GitHubContentMeta = {
  sha: string;
};

function githubRepo(): string {
  return process.env.NEXT_PUBLIC_GITHUB_REPO || "liuchiwai0101/FFin";
}

function githubBranch(): string {
  return process.env.NEXT_PUBLIC_GITHUB_BRANCH || "gh-pages";
}

function githubDataPath(): string {
  return process.env.NEXT_PUBLIC_GITHUB_DATA_PATH || "data/latest.json";
}

function githubToken(): string | null {
  const token = process.env.NEXT_PUBLIC_GITHUB_SYNC_TOKEN;
  return token && token.length > 0 ? token : null;
}

export function sharedDataReadUrl(): string {
  const custom = process.env.NEXT_PUBLIC_SHARED_DATA_URL;
  if (custom) return custom;
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
  if (typeof window !== "undefined") {
    return `${window.location.origin}${basePath}/data/latest.json`;
  }
  return `${basePath}/data/latest.json`;
}

function githubHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function toBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

async function readContentSha(token: string): Promise<string | undefined> {
  const repo = githubRepo();
  const path = githubDataPath();
  const branch = githubBranch();
  const response = await fetch(
    `https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
    { headers: githubHeaders(token), cache: "no-store" },
  );
  if (!response.ok) return undefined;
  const meta = (await response.json()) as GitHubContentMeta;
  return meta.sha;
}

async function writeSharedPayload(payload: SharedDepositPayload, message: string): Promise<boolean> {
  const token = githubToken();
  if (!token) return false;

  const repo = githubRepo();
  const path = githubDataPath();
  const branch = githubBranch();
  const sha = await readContentSha(token);
  const body = serializeSharedPayload(payload);

  const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: "PUT",
    headers: {
      ...githubHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      content: toBase64Utf8(body),
      branch,
      ...(sha ? { sha } : {}),
    }),
    cache: "no-store",
  });

  return response.ok;
}

export async function fetchSharedDepositStore(): Promise<DepositStore | null> {
  try {
    const response = await fetch(`${sharedDataReadUrl()}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return null;
    return parseSharedDepositJson(await response.text());
  } catch {
    return null;
  }
}

export async function pushSharedDepositStore(store: DepositStore): Promise<DepositStore | null> {
  const payload = createSharedPayload({
    syncedAt: store.syncedAt,
    activeItems: store.activeItems,
    historyItems: store.historyItems,
  });
  const ok = await writeSharedPayload(payload, "FFin: sync shared deposit data");
  if (!ok) return null;
  return {
    syncedAt: payload.syncedAt,
    activeItems: payload.activeItems,
    historyItems: payload.historyItems,
  };
}

export async function clearSharedDepositStore(): Promise<boolean> {
  return writeSharedPayload(createEmptySharedPayload(), "FFin: clear expired shared deposit data");
}

export function isGitHubSyncConfigured(): boolean {
  return Boolean(githubToken());
}
