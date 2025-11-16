import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '',
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  // Do NOT attach Authorization for auth endpoints
  const url = typeof config.url === 'string' ? config.url : '';
  const isAuthEndpoint = url.startsWith('/auth');

  if (!isAuthEndpoint) {
    const token = localStorage.getItem('token');
    // Guard against oversized headers from an abnormally large token
    if (token && token.length < 4096) {
      if (!config.headers) config.headers = {};
      config.headers.Authorization = `Bearer ${token}`;
    } else if (token && token.length >= 4096) {
      // Token is suspiciously large; clear it to avoid 431
      localStorage.removeItem('token');
    }
  }

  return config;
});

export default api;


