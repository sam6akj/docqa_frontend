// Points at the Express API. In dev, Vite's proxy forwards /api to localhost:3000.
const API_URL = "/api";

type ApiError = { error: string | Record<string, string[]> };

export class ApiRequestError extends Error {
  status: number;
  details?: Record<string, string[]>;
  constructor(status: number, message: string, details?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// The access token lives only in memory (a module-level variable), never in
// localStorage, so it disappears on a full page reload. AuthProvider calls
// setAccessToken after a successful /refresh on startup to restore a session.
let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

async function parseError(res: Response): Promise<never> {
  let body: ApiError | null = null;
  try {
    body = await res.json();
  } catch {
    // no JSON body
  }
  const message =
    typeof body?.error === "string" ? body.error : "Something went wrong. Please try again.";
  const details = typeof body?.error === "object" ? body.error : undefined;
  throw new ApiRequestError(res.status, message, details);
}

// Wraps fetch: attaches the access token, sends the refresh cookie, and on a
// 401 tries exactly one silent refresh + retry before giving up. This is what
// keeps the user logged in across the 15-minute access-token expiry without
// asking them to log in again.
export async function apiFetch(path: string, options: RequestInit = {}, isRetry = false): Promise<Response> {
  const headers = new Headers(options.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include", // sends the httpOnly refresh_token cookie
  });

  if (res.status === 401 && !isRetry && path !== "/auth/refresh") {
    const refreshed = await tryRefresh();
    if (refreshed) return apiFetch(path, options, true);
  }

  return res;
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" });
    if (!res.ok) {
      setAccessToken(null);
      return false;
    }
    const data = await res.json();
    setAccessToken(data.accessToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}

export async function apiJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, options);
  if (!res.ok) return parseError(res);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export { tryRefresh };
