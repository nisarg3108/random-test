import { authFetch } from './http';

export const fetchUsers = async () => {
  return authFetch('/users');
};

export const createUserApi = async (data) => {
  return authFetch('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
