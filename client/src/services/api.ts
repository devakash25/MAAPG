import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('maapg-auth');
  if (stored) {
    const { state } = JSON.parse(stored);
    if (state?.accessToken) {
      config.headers.Authorization = `Bearer ${state.accessToken}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('maapg-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
