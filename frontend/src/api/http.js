import { getToken, removeToken } from '../store/auth.store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const authFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const isBlob = options.responseType === 'blob';
  const isFormData = options.body instanceof FormData;

  // Build headers - don't set Content-Type for FormData (browser will set it with boundary)
  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  
  // Only set Content-Type to application/json if it's not FormData and not already set
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Remove Content-Type header for FormData to let browser set it with boundary
  if (isFormData && headers['Content-Type']) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
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
      
      // Don't JSON.stringify FormData - pass it as-is
      const body = data instanceof FormData ? data : JSON.stringify(data);
      
      const response = await authFetch(url, { 
        method: 'POST', 
        body, 
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
      
      // Don't JSON.stringify FormData - pass it as-is
      const body = data instanceof FormData ? data : JSON.stringify(data);
      
      const response = await authFetch(url, { 
        method: 'PUT', 
        body, 
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
