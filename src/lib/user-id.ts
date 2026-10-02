const USER_ID_KEY = "app:userId";

/**
 * Returns the anonymous user ID stored in localStorage.
 * If none exists, generates a fresh UUID, persists it, and returns it.
 *
 * Safe to call only on the client (requires `window`).
 */
export function getUserId(): string {
  const existing = localStorage.getItem(USER_ID_KEY);
  if (existing) return existing;

  const id = `user_${crypto.randomUUID()}`;
  localStorage.setItem(USER_ID_KEY, id);
  return id;
}
