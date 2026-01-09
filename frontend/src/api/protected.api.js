import { authFetch } from './http';

export const getProtectedData = async () => {
  return authFetch('/protected');
};
