import { APP_USERS, type AppUser } from "./users";

export function findUserByCredentials(account: string, password: string): AppUser | null {
  const normalized = account.trim().toLowerCase();
  const user = APP_USERS.find(
    (u) =>
      u.username.toLowerCase() === normalized ||
      `${u.username.toLowerCase()}@family.local` === normalized,
  );
  if (!user || password !== `${user.username}123`) return null;
  return user;
}
