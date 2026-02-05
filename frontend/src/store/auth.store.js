const TOKEN_KEY = 'ueorms_token';

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const isAuthenticated = () => {
  return !!getToken();
};

// 🔹 Decode JWT payload (no external library needed)
export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    // Base64url decode (handle JWT padding and URL-safe chars)
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const getUserRole = () => {
  const user = getUserFromToken();
  return user?.role || null;
};
