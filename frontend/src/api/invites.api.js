import { apiClient } from './http';

export const inviteUserApi = async (data) => {
  return apiClient.post('/invites', data);
};

export const acceptInviteApi = async (data) => {
  const response = await fetch('http://localhost:5000/api/invites/accept', {
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
