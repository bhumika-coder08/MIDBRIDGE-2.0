const API_BASE_URL = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('midbridge_token') || localStorage.getItem('crosslink_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('midbridge_token', token);
  } else {
    localStorage.removeItem('midbridge_token');
    localStorage.removeItem('crosslink_token');
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    (headers as any)['Content-Type'] = 'application/json';
  }

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      // Session expired
      setAuthToken(null);
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup') && window.location.pathname !== '/') {
        window.location.href = '/login?expired=1';
      }
    }
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data as T;
}

export const api = {
  get: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};
