export const DEMO_USER_ID = "demo";

export const FAMILY_DEPOSIT_STORAGE_KEY = "ffin_deposit_store_v1";
export const DEMO_DEPOSIT_STORAGE_KEY = "ffin_deposit_store_v1_demo";

export function isDemoUser(userId: string | null | undefined): boolean {
  return userId === DEMO_USER_ID;
}

export function depositStorageKey(userId: string | null | undefined): string {
  return isDemoUser(userId) ? DEMO_DEPOSIT_STORAGE_KEY : FAMILY_DEPOSIT_STORAGE_KEY;
}
