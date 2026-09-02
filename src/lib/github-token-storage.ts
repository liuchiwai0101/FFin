const TOKEN_KEY = "ffin_github_sync_token";
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeGitHubSyncToken(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === TOKEN_KEY || event.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function readGitHubSyncToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(TOKEN_KEY);
  return token && token.length > 0 ? token : null;
}

export function writeGitHubSyncToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token.trim());
  notify();
}

export function clearGitHubSyncToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  notify();
}

export function hasGitHubSyncToken(): boolean {
  return Boolean(readGitHubSyncToken());
}
