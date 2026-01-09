import { getToken, removeToken } from '../store/auth.store';

const API_BASE_URL = 'http://localhost:5000/api';

export const authFetch = async (endpoint, options = {}) => {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    removeToken();
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// API Client for new modules
export const apiClient = {
  get: async (endpoint, config = {}) => {
    try {
      const response = await authFetch(endpoint, { method: 'GET', ...config });
      return { data: response };
    } catch (error) {
      console.error(`GET ${endpoint}:`, error.message);
      throw error;
    }
  },
  post: async (endpoint, data, config = {}) => {
    try {
      const response = await authFetch(endpoint, { method: 'POST', body: JSON.stringify(data), ...config });
      return { data: response };
    } catch (error) {
      console.error(`POST ${endpoint}:`, error.message);
      throw error;
    }
  },
  put: async (endpoint, data, config = {}) => {
    try {
      const response = await authFetch(endpoint, { method: 'PUT', body: JSON.stringify(data), ...config });
      return { data: response };
    } catch (error) {
      console.error(`PUT ${endpoint}:`, error.message);
      throw error;
    }
  },
  delete: async (endpoint, config = {}) => {
    try {
      const response = await authFetch(endpoint, { method: 'DELETE', ...config });
      return { data: response };
    } catch (error) {
      console.error(`DELETE ${endpoint}:`, error.message);
      throw error;
    }
  }
};
