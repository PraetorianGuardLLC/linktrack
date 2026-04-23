import axios from 'axios';

const api = axios.create({
  baseURL: 'https://linktrack-server-production.up.railway.app/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
