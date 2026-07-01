export interface AuthUser {
  userId: string;
  username: string;
  token: string;
  expiresAt: number;
}

const AUTH_STORAGE_KEY = 'agent_auth_state';

export function getStoredAuth(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed.token || typeof parsed.expiresAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuth(user: AuthUser): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isAuthenticated(): boolean {
  const auth = getStoredAuth();
  if (!auth) return false;
  return Date.now() < auth.expiresAt;
}
