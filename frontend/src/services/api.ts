import axios, { AxiosInstance, AxiosError } from 'axios';

export const getBaseApiUrl = (): string => {
  let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  url = url.trim().replace(/\/+$/, ''); // Remove trailing slashes
  if (!/^https?:\/\//i.test(url)) {
    url = url.includes('localhost') || url.includes('127.0.0.1')
      ? `http://${url}`
      : `https://${url}`;
  }
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

export const API_URL = getBaseApiUrl();

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor — attach JWT token & Vault unlock token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('vaultx_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const vaultToken = localStorage.getItem('vaultx_vault_token');
      if (vaultToken) {
        config.headers['x-vault-unlock-token'] = vaultToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('vaultx_token');
      localStorage.removeItem('vaultx_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
