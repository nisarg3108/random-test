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
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

export const getUserRole = () => {
  const user = getUserFromToken();
  return user?.role || null;
};
