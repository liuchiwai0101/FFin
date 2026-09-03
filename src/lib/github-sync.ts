import type { DepositStore } from "@/lib/deposit-types";
import type { LoginEntry, SharedLoginLogPayload } from "@/lib/login-log";
import { mergeLoginEntries } from "@/lib/login-log";
import { readGitHubSyncToken } from "@/lib/github-token-storage";
import {
  createEmptySharedPayload,
  createSharedPayload,
  parseSharedDepositJson,
  serializeSharedPayload,
  type SharedDepositPayload,
} from "@/lib/shared-deposit-format";

type GitHubContentMeta = {
  sha: string;
  message?: string;
};

export type GitHubSyncError = {
  status: number;
  message: string;
};

type WriteResult = { ok: true } | { ok: false; error: GitHubSyncError };

let lastSyncError: GitHubSyncError | null = null;

function githubRepo(): string {
  return process.env.NEXT_PUBLIC_GITHUB_REPO || "liuchiwai0101/FFin";
}

/** Write to main branch so Fine-grained PATs scoped to default branch work. */
function githubBranch(): string {
  return process.env.NEXT_PUBLIC_GITHUB_BRANCH || "main";
}

function githubDataPath(): string {
  return process.env.NEXT_PUBLIC_GITHUB_DATA_PATH || "public/data/latest.json";
}

function githubLoginLogPath(): string {
  return process.env.NEXT_PUBLIC_GITHUB_LOGIN_LOG_PATH || "public/data/login-log.json";
}

function githubToken(): string | null {
  return readGitHubSyncToken();
}

function appBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || "";
}

/** Same-origin static file on GitHub Pages — works in China and matches deployed data. */
export function localSharedDataReadUrl(): string | null {
  if (typeof window === "undefined") return null;
  return `${window.location.origin}${appBasePath()}/data/latest.json`;
}

export function remoteSharedDataReadUrl(): string {
  const [owner, repo] = githubRepo().split("/");
  return `https://raw.githubusercontent.com/${owner}/${repo}/${githubBranch()}/${githubDataPath()}`;
}

export function sharedDataReadUrl(): string {
  const custom = process.env.NEXT_PUBLIC_SHARED_DATA_URL;
  if (custom) return custom;
  return localSharedDataReadUrl() ?? remoteSharedDataReadUrl();
}

/** Same-origin static file on GitHub Pages. */
export function localSharedLoginLogReadUrl(): string | null {
  if (typeof window === "undefined") return null;
  return `${window.location.origin}${appBasePath()}/data/login-log.json`;
}

export function remoteSharedLoginLogReadUrl(): string {
  const [owner, repo] = githubRepo().split("/");
  return `https://raw.githubusercontent.com/${owner}/${repo}/${githubBranch()}/${githubLoginLogPath()}`;
}

export function sharedLoginLogReadUrl(): string {
  return localSharedLoginLogReadUrl() ?? remoteSharedLoginLogReadUrl();
}

function uniqueUrls(...urls: Array<string | null | undefined>): string[] {
  return [...new Set(urls.filter((url): url is string => Boolean(url)))];
}

function githubHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
  };
}

async function parseGitHubError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message || response.statusText;
  } catch {
    return response.statusText || "Request failed";
  }
}

function toBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

async function readContentSha(token: string, path = githubDataPath()): Promise<string | undefined> {
  const repo = githubRepo();
  const branch = githubBranch();
  const response = await fetch(
    `https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
    { headers: githubHeaders(token), cache: "no-store" },
  );
  if (response.status === 404) return undefined;
  if (!response.ok) return undefined;
  const meta = (await response.json()) as GitHubContentMeta;
  return meta.sha;
}

function parseSharedLoginLogJson(raw: string): LoginEntry[] {
  try {
    const parsed = JSON.parse(raw) as SharedLoginLogPayload | LoginEntry[];
    if (Array.isArray(parsed)) return mergeLoginEntries(parsed);
    if (parsed && Array.isArray(parsed.entries)) return mergeLoginEntries(parsed.entries);
    return [];
  } catch {
    return [];
  }
}

function serializeSharedLoginLog(entries: LoginEntry[]): string {
  const payload: SharedLoginLogPayload = { version: 1, entries: mergeLoginEntries(entries) };
  return JSON.stringify(payload, null, 2);
}

async function writeGitHubJsonFile(
  path: string,
  body: string,
  message: string,
): Promise<WriteResult> {
  const token = githubToken();
  if (!token) {
    return { ok: false, error: { status: 0, message: "missing_token" } };
  }

  const repo = githubRepo();
  const branch = githubBranch();
  const sha = await readContentSha(token, path);

  let response: Response;
  try {
    response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
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
  } catch (err) {
    const hint =
      err instanceof TypeError
        ? "network_or_cors"
        : err instanceof Error
          ? err.message
          : "network_error";
    return { ok: false, error: { status: 0, message: hint } };
  }

  if (!response.ok) {
    return { ok: false, error: { status: response.status, message: await parseGitHubError(response) } };
  }

  return { ok: true };
}

async function writeSharedPayload(payload: SharedDepositPayload, message: string): Promise<WriteResult> {
  const token = githubToken();
  if (!token) {
    return { ok: false, error: { status: 0, message: "missing_token" } };
  }

  const repo = githubRepo();
  const path = githubDataPath();
  const branch = githubBranch();
  const sha = await readContentSha(token);
  const body = serializeSharedPayload(payload);

  let response: Response;
  try {
    response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
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
  } catch (err) {
    const hint =
      err instanceof TypeError
        ? "network_or_cors"
        : err instanceof Error
          ? err.message
          : "network_error";
    return { ok: false, error: { status: 0, message: hint } };
  }

  if (!response.ok) {
    return { ok: false, error: { status: response.status, message: await parseGitHubError(response) } };
  }

  return { ok: true };
}

async function fetchTextFromUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(`${url}?t=${Date.now()}`, { cache: "no-store" });
    if (response.status === 404) return "";
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

async function fetchLoginLogFromUrl(url: string): Promise<LoginEntry[] | null> {
  const raw = await fetchTextFromUrl(url);
  if (raw === null) return null;
  return parseSharedLoginLogJson(raw);
}

export async function fetchSharedLoginLog(): Promise<LoginEntry[]> {
  const urls = uniqueUrls(
    localSharedLoginLogReadUrl(),
    remoteSharedLoginLogReadUrl(),
  );
  const results = await Promise.all(urls.map(fetchLoginLogFromUrl));
  const merged = mergeLoginEntries(...results.filter((entries): entries is LoginEntry[] => entries !== null));
  return merged;
}

export async function pushSharedLoginLog(entries: LoginEntry[]): Promise<boolean> {
  const remote = await fetchSharedLoginLog();
  const merged = mergeLoginEntries(entries, remote);
  const result = await writeGitHubJsonFile(
    githubLoginLogPath(),
    serializeSharedLoginLog(merged),
    "FFin: sync family login log",
  );
  if (!result.ok) {
    lastSyncError = result.error;
    return false;
  }
  lastSyncError = null;
  return true;
}

async function fetchDepositFromUrl(url: string): Promise<DepositStore | null> {
  const raw = await fetchTextFromUrl(url);
  if (raw === null) return null;
  return parseSharedDepositJson(raw);
}

export function pickNewestDepositStore(stores: Array<DepositStore | null>): DepositStore | null {
  const candidates = stores.filter((store): store is DepositStore => store !== null);
  if (candidates.length === 0) return null;

  const withData = candidates.filter(
    (store) => store.syncedAt && (store.activeItems.length > 0 || store.historyItems.length > 0),
  );
  const pool = withData.length > 0 ? withData : candidates;

  return pool.reduce<DepositStore | null>((best, current) => {
    if (!best) return current;
    if (!current.syncedAt) return best;
    if (!best.syncedAt) return current;
    return current.syncedAt > best.syncedAt ? current : best;
  }, null);
}

export async function fetchSharedDepositStore(): Promise<DepositStore | null> {
  const custom = process.env.NEXT_PUBLIC_SHARED_DATA_URL;
  const urls = uniqueUrls(custom, localSharedDataReadUrl(), remoteSharedDataReadUrl());
  const results = await Promise.all(urls.map(fetchDepositFromUrl));
  return pickNewestDepositStore(results);
}

export function getLastGitHubSyncError(): GitHubSyncError | null {
  return lastSyncError;
}

export async function pushSharedDepositStore(store: DepositStore): Promise<DepositStore | null> {
  const payload = createSharedPayload({
    syncedAt: store.syncedAt,
    activeItems: store.activeItems,
    historyItems: store.historyItems,
  });
  const result = await writeSharedPayload(payload, "FFin: sync shared deposit data");
  if (!result.ok) {
    lastSyncError = result.error;
    return null;
  }
  lastSyncError = null;
  return {
    syncedAt: payload.syncedAt,
    activeItems: payload.activeItems,
    historyItems: payload.historyItems,
  };
}

export async function clearSharedDepositStore(): Promise<boolean> {
  const token = githubToken();
  if (!token) {
    lastSyncError = { status: 0, message: "missing_token" };
    return false;
  }

  const repo = githubRepo();
  const path = githubDataPath();
  const branch = githubBranch();
  const sha = await readContentSha(token);

  if (sha) {
    let response: Response;
    try {
      response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: "DELETE",
        headers: {
          ...githubHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "FFin: admin cleared shared deposit data",
          sha,
          branch,
        }),
        cache: "no-store",
      });
    } catch (err) {
      const hint =
        err instanceof TypeError
          ? "network_or_cors"
          : err instanceof Error
            ? err.message
            : "network_error";
      lastSyncError = { status: 0, message: hint };
      return false;
    }

    if (response.ok) {
      lastSyncError = null;
      return true;
    }

    lastSyncError = { status: response.status, message: await parseGitHubError(response) };
    return false;
  }

  const result = await writeSharedPayload(createEmptySharedPayload(), "FFin: admin cleared shared deposit data");
  if (!result.ok) {
    lastSyncError = result.error;
    return false;
  }
  lastSyncError = null;
  return true;
}

export function isGitHubSyncConfigured(): boolean {
  return Boolean(githubToken());
}

export function formatGitHubSyncError(
  error: GitHubSyncError,
  translate: (key: "sync.githubTokenMissing" | "sync.githubCorsError" | "sync.githubForbidden" | "sync.githubNotFound" | "sync.githubSyncFailedDetail") => string,
): string {
  if (error.message === "missing_token") return translate("sync.githubTokenMissing");
  if (error.message === "network_or_cors") return translate("sync.githubCorsError");
  if (error.status === 403) return translate("sync.githubForbidden");
  if (error.status === 404) return translate("sync.githubNotFound");
  return translate("sync.githubSyncFailedDetail").replace("{detail}", `${error.status}: ${error.message}`);
}
