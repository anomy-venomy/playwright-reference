/**
 * Thin fetch wrapper. Every backend call goes through here so errors have one shape:
 * an ApiError with the HTTP status, an error code, a message and optional per-field details.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string>,
  ) {
    super(message);
  }
}

type UnauthorizedListener = () => void;
let onUnauthorized: UnauthorizedListener | null = null;

/** Called by AuthContext so an expired session anywhere logs the user out of the UI. */
export function setUnauthorizedListener(listener: UnauthorizedListener | null) {
  onUnauthorized = listener;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

export async function request<T>(path: string, { method = 'GET', body, signal }: RequestOptions = {}): Promise<T> {
  const isFormData = body instanceof FormData;
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      signal,
      headers: body && !isFormData ? { 'Content-Type': 'application/json' } : undefined,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the server. Check your connection and try again.');
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const error = json?.error;
    if (response.status === 401 && !path.startsWith('/auth/')) onUnauthorized?.();
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? `Request failed with status ${response.status}`,
      error?.details,
    );
  }

  return json as T;
}

export function toQueryString(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}
