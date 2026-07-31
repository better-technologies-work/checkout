import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const traceHash = error.response?.headers?.['x-trace-hash'];
    console.error(`[API Error] traceHash: ${traceHash}`, error.response?.data);
    return Promise.reject(error.response?.data || error);
  },
);

export default api;
