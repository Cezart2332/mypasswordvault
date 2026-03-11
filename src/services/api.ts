import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let _accessToken: string | null = null;
let _authFailCallback: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function setAuthFailCallback(cb: () => void) {
  _authFailCallback = cb;
}

api.interceptors.request.use(config => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// On 401: attempt a silent token refresh once, then retry the original request.
// Skipped for the refresh endpoint itself to avoid infinite loops.
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const is401 = error.response?.status === 401;
    const isRefreshEndpoint = originalRequest?.url?.includes('/auth/refresh');
    if (is401 && !isRefreshEndpoint && !originalRequest._retried) {
      originalRequest._retried = true;
      try {
        const { data } = await api.post('/auth/refresh');
        _accessToken = data.token;
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch {
        _accessToken = null;
        _authFailCallback?.();
      }
    }
    return Promise.reject(error);
  },
);

export default api;