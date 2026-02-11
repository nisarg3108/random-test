import { getToken, removeToken } from '../store/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const authFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const isBlob = options.responseType === 'blob';

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
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
  }

  // Return blob for file downloads, otherwise parse as JSON
  return isBlob ? response.blob() : response.json();
};

// API Client for new modules
export const apiClient = {
  get: async (endpoint, config = {}) => {
    try {
      let url = endpoint;
      
      // Handle query parameters
      if (config.params) {
        const searchParams = new URLSearchParams();
        Object.entries(config.params).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            searchParams.append(key, value);
          }
        });
        const queryString = searchParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }
      
      // Pass responseType to authFetch for blob handling
      const response = await authFetch(url, { 
        method: 'GET', 
        responseType: config.responseType,
        ...config 
      });
      return { data: response };
    } catch (error) {
      console.error(`GET ${endpoint}:`, error.message);
      throw error;
    }
  },
  post: async (endpoint, data, config = {}) => {
    try {
      let url = endpoint;
      
      // Handle query parameters
      if (config.params) {
        const searchParams = new URLSearchParams();
        Object.entries(config.params).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            searchParams.append(key, value);
          }
        });
        const queryString = searchParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }
      
      const response = await authFetch(url, { 
        method: 'POST', 
        body: JSON.stringify(data), 
        responseType: config.responseType,
        ...config 
      });
      return { data: response };
    } catch (error) {
      console.error(`POST ${endpoint}:`, error.message);
      throw error;
    }
  },
  put: async (endpoint, data, config = {}) => {
    try {
      let url = endpoint;
      
      // Handle query parameters
      if (config.params) {
        const searchParams = new URLSearchParams();
        Object.entries(config.params).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            searchParams.append(key, value);
          }
        });
        const queryString = searchParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }
      
      const response = await authFetch(url, { 
        method: 'PUT', 
        body: JSON.stringify(data), 
        responseType: config.responseType,
        ...config 
      });
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
