import { apiClient } from './http';

export const passwordResetAPI = {
  requestReset: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  verifyOTP: async (email, otp) => {
    const response = await apiClient.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  resetPassword: async (email, otp, newPassword) => {
    const response = await apiClient.post('/auth/reset-password', { 
      email, 
      otp, 
      newPassword 
    });
    return response.data;
  }
};