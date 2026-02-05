export const getApiBaseUrl = () => {
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const trimmed = raw.replace(/\/+$/, '');

  if (trimmed.endsWith('/api')) {
    return trimmed;
  }

  return `${trimmed}/api`;
};
