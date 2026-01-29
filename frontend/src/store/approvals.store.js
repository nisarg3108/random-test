import { create } from 'zustand';
import { getToken } from './auth.store';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useApprovalsStore = create((set, get) => ({
  approvals: [],
  myRequests: [],
  loading: false,
  error: null,

  // Fetch pending approvals (for approvers)
  fetchApprovals: async () => {
    set({ loading: true, error: null });
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/approvals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch approvals');
      
      const data = await response.json();
      set({ approvals: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Fetch user's own requests
  fetchMyRequests: async () => {
    set({ loading: true, error: null });
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/approvals/my-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch requests');
      
      const data = await response.json();
      set({ myRequests: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Approve request
  approveRequest: async (approvalId, comment = '') => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment })
      });
      
      if (!response.ok) throw new Error('Failed to approve request');
      
      // Refresh approvals
      get().fetchApprovals();
      return true;
    } catch (error) {
      set({ error: error.message });
      return false;
    }
  },

  // Reject request
  rejectRequest: async (approvalId, reason = '') => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      
      if (!response.ok) throw new Error('Failed to reject request');
      
      // Refresh approvals
      get().fetchApprovals();
      return true;
    } catch (error) {
      set({ error: error.message });
      return false;
    }
  },

  clearError: () => set({ error: null }),

  // Create test workflow for testing
  createTestWorkflow: async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/approvals/create-test-workflow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to create test workflow');
      
      const data = await response.json();
      // Refresh approvals after creating test
      get().fetchApprovals();
      return data;
    } catch (error) {
      set({ error: error.message });
      return null;
    }
  },

  // Seed workflows for tenant
  seedWorkflows: async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/approvals/seed-workflows`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to seed workflows');
      
      const data = await response.json();
      return data;
    } catch (error) {
      set({ error: error.message });
      return null;
    }
  }
}));