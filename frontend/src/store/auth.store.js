const TOKEN_KEY = 'ueorms_token';
const LEGACY_TOKEN_KEYS = ['token'];

const getLegacyToken = () => {
  for (const key of LEGACY_TOKEN_KEYS) {
    const legacyToken = localStorage.getItem(key);
    if (legacyToken) {
      return { key, token: legacyToken };
    }
  }
  return null;
};

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);

  // Clean up old keys after successful login
  LEGACY_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const getToken = () => {
  const currentToken = localStorage.getItem(TOKEN_KEY);
  if (currentToken) return currentToken;

  // Backward-compatibility: migrate old token key
  const legacy = getLegacyToken();
  if (legacy?.token) {
    localStorage.setItem(TOKEN_KEY, legacy.token);
    localStorage.removeItem(legacy.key);
    return legacy.token;
  }

  return null;
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  LEGACY_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
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
