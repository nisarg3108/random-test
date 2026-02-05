import { apiClient } from './http';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const inviteUserApi = async (data) => {
  return apiClient.post('/invites', data);
};

export const acceptInviteApi = async (data) => {
  const response = await fetch(`${API_BASE_URL}/invites/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Invite acceptance failed');
  }

  return result;
};
