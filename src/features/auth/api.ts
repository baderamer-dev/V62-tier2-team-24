const TOKEN_KEY = "app:token";
const USER_KEY = "app:user";

export interface AuthUser {
  userId: string;
  username: string;
  email: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

// ── Token storage ─────────────────────────────────────────────────────────────

export function saveSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Ensure the stored userId matches the authenticated user's ID
  localStorage.setItem("app:userId", user.userId);
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Reset to a fresh anonymous ID so the next guest session never inherits
  // the logged-out user's paths or identity.
  localStorage.removeItem("app:userId");
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ── Auth header helper ────────────────────────────────────────────────────────

export function authHeaders(): HeadersInit {
  const token = getToken();
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function signup(
  username: string,
  email: string,
  password: string,
): Promise<AuthUser> {
  // userId is now generated server-side — don't send the local anonymous ID
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await response.json() as {
    token?: string;
    user?: AuthUser;
    error?: string;
    message?: string;
    details?: unknown;
  };

  if (!response.ok) {
    throw new AuthError(
      data.message ?? "Signup failed. Please try again.",
      data.error,
      response.status,
    );
  }

  saveSession(data.token!, data.user!);
  return data.user!;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthUser> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json() as {
    token?: string;
    user?: AuthUser;
    error?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new AuthError(
      data.message ?? "Login failed. Please check your credentials.",
      data.error,
      response.status,
    );
  }

  saveSession(data.token!, data.user!);
  return data.user!;
}

export function logout(): void {
  clearSession();
}

export async function getMe(): Promise<AuthUser> {
  const response = await fetch("/api/auth/me", {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new AuthError("Session expired. Please log in again.", "UNAUTHORIZED", response.status);
  }

  return response.json() as Promise<AuthUser>;
}
