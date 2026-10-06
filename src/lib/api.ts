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
  }
  const message =
    typeof body?.error === "string" ? body.error : "Something went wrong. Please try again.";
  const details = typeof body?.error === "object" ? body.error : undefined;
  throw new ApiRequestError(res.status, message, details);
}

let refreshPromise: Promise<boolean> | null = null;

export function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include", 
        });
        if (!res.ok) {
          setAccessToken(null);
          window.dispatchEvent(new Event("auth:expired"));
          return false;
        }
        const data = await res.json();
        setAccessToken(data.accessToken);
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function send(path: string, options: RequestInit, token: string | null) {
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${API_URL}${path}`, { ...options, headers, credentials: "include" });
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const tokenUsed = accessToken;
  let res = await send(path, options, tokenUsed);

  if (res.status === 401 && !path.startsWith("/auth/")) {
    const alreadyRefreshed = accessToken !== null && accessToken !== tokenUsed;
    const ok = alreadyRefreshed || (await tryRefresh());
    if (ok) res = await send(path, options, accessToken);
  }
  return res;
}

export async function apiJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, options);
  if (!res.ok) return parseError(res);
  if (res.status === 204) return undefined as T;
  return res.json();
}