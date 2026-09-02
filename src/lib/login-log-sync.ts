import { fetchSharedLoginLog, pushSharedLoginLog } from "@/lib/github-sync";
import { applyRemoteLoginLog, readLoginLog, type LoginEntry } from "@/lib/login-log";

export async function refreshLoginLogFromGitHub(): Promise<LoginEntry[]> {
  const remote = await fetchSharedLoginLog();
  return applyRemoteLoginLog(remote);
}

export async function syncLoginLogToGitHub(): Promise<boolean> {
  return pushSharedLoginLog(readLoginLog());
}
