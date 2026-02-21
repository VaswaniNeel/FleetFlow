/**
 * Centralized API client for FleetFlow backend.
 * Handles base URL, JSON headers, and JWT Authorization.
 */

export const AUTH_TOKEN_KEY = 'fleetflow_token';

function getBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
}

export function getToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

function getHeaders(includeAuth = true): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (includeAuth) {
    const token = getToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { message?: string })?.message ?? `Request failed: ${res.status}`);
  }
  return data as T;
}

export const apiClient = {
  getBaseUrl,

  get<T = unknown>(path: string, options?: RequestInit): Promise<T> {
    const url = path.startsWith('http') ? path : `${getBaseUrl()}/api${path.startsWith('/') ? path : `/${path}`}`;
    return fetch(url, {
      ...options,
      headers: { ...getHeaders(), ...(options?.headers as Record<string, string>) },
    }).then(handleResponse<T>);
  },

  post<T = unknown>(path: string, body: unknown, options?: RequestInit): Promise<T> {
    const url = path.startsWith('http') ? path : `${getBaseUrl()}/api${path.startsWith('/') ? path : `/${path}`}`;
    return fetch(url, {
      method: 'POST',
      ...options,
      headers: { ...getHeaders(), ...(options?.headers as Record<string, string>) },
      body: JSON.stringify(body),
    }).then(handleResponse<T>);
  },

  put<T = unknown>(path: string, body: unknown, options?: RequestInit): Promise<T> {
    const url = path.startsWith('http') ? path : `${getBaseUrl()}/api${path.startsWith('/') ? path : `/${path}`}`;
    return fetch(url, {
      method: 'PUT',
      ...options,
      headers: { ...getHeaders(), ...(options?.headers as Record<string, string>) },
      body: JSON.stringify(body),
    }).then(handleResponse<T>);
  },

  patch<T = unknown>(path: string, body: unknown, options?: RequestInit): Promise<T> {
    const url = path.startsWith('http') ? path : `${getBaseUrl()}/api${path.startsWith('/') ? path : `/${path}`}`;
    return fetch(url, {
      method: 'PATCH',
      ...options,
      headers: { ...getHeaders(), ...(options?.headers as Record<string, string>) },
      body: JSON.stringify(body),
    }).then(handleResponse<T>);
  },

  delete(path: string, options?: RequestInit): Promise<void> {
    const url = path.startsWith('http') ? path : `${getBaseUrl()}/api${path.startsWith('/') ? path : `/${path}`}`;
    return fetch(url, {
      method: 'DELETE',
      ...options,
      headers: getHeaders(),
    }).then(async (res) => {
      if (res.status === 204) return;
      return handleResponse(res);
    });
  },
};
