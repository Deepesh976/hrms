// src/api/axios.js
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add token to every request
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle token expiry only for critical endpoints (not notifications)
    if (error.response && error.response.status === 401) {
      // Don't redirect for non-critical requests (like notifications)
      const isCriticalEndpoint = !error.config.url.includes('/notifications');

      if (isCriticalEndpoint && !error.config.__skipRedirect) {
        // Token expired or invalid - redirect to login
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
