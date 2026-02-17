import axios from 'axios';
import { getToken, removeToken } from '../store/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Request deduplication map
const pendingRequests = new Map();

// Generate unique key for request
const generateRequestKey = (config) => {
  const { method, url, params, data } = config;
  return `${method}-${url}-${JSON.stringify(params)}-${JSON.stringify(data)}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  config => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Request deduplication for GET requests
    if (config.method === 'get') {
      const requestKey = generateRequestKey(config);
      
      // If same request is already pending, return the pending promise
      if (pendingRequests.has(requestKey)) {
        return Promise.reject({
          __CANCEL__: true,
          message: 'Duplicate request',
          promise: pendingRequests.get(requestKey)
        });
      }

      // Create a promise wrapper to track this request
      const requestPromise = new Promise((resolve, reject) => {
        config.__resolveDedup = resolve;
        config.__rejectDedup = reject;
      });

      pendingRequests.set(requestKey, requestPromise);
      config.__requestKey = requestKey;
    }

    return config;
  },
  error => Promise.reject(error)
);

// Handle responses
api.interceptors.response.use(
  response => {
    // Clean up deduplication tracking
    if (response.config.__requestKey) {
      const requestKey = response.config.__requestKey;
      const promise = pendingRequests.get(requestKey);
      
      // Resolve pending duplicate requests
      if (response.config.__resolveDedup) {
        response.config.__resolveDedup(response.data);
      }
      
      pendingRequests.delete(requestKey);
    }

    return response.data;
  },
  error => {
    // Handle duplicate request cancellation
    if (error.__CANCEL__) {
      return error.promise; // Return the existing pending promise
    }

    // Clean up deduplication tracking on error
    if (error.config?.__requestKey) {
      const requestKey = error.config.__requestKey;
      
      // Reject pending duplicate requests
      if (error.config.__rejectDedup) {
        error.config.__rejectDedup(error);
      }
      
      pendingRequests.delete(requestKey);
    }

    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

export default api;
