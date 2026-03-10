import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

api.interceptors.request.use(config => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

export default api;