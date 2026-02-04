import { apiClient } from './http';

export const crmAPI = {
  // Customers
  getCustomers: () => apiClient.get('/crm/customers'),
  getCustomer: (id) => apiClient.get(`/crm/customers/${id}`),
  createCustomer: (data) => apiClient.post('/crm/customers', data),
  updateCustomer: (id, data) => apiClient.put(`/crm/customers/${id}`, data),
  deleteCustomer: (id) => apiClient.delete(`/crm/customers/${id}`),

  // Contacts
  getContacts: () => apiClient.get('/crm/contacts'),
  getContact: (id) => apiClient.get(`/crm/contacts/${id}`),
  createContact: (data) => apiClient.post('/crm/contacts', data),
  updateContact: (id, data) => apiClient.put(`/crm/contacts/${id}`, data),
  deleteContact: (id) => apiClient.delete(`/crm/contacts/${id}`),

  // Leads
  getLeads: () => apiClient.get('/crm/leads'),
  createLead: (data) => apiClient.post('/crm/leads', data),
  updateLead: (id, data) => apiClient.put(`/crm/leads/${id}`, data),
  convertLead: (id) => apiClient.post(`/crm/leads/${id}/convert`),

  // Deals
  getDeals: () => apiClient.get('/crm/deals'),
  createDeal: (data) => apiClient.post('/crm/deals', data),
  updateDeal: (id, data) => apiClient.put(`/crm/deals/${id}`, data),
  deleteDeal: (id) => apiClient.delete(`/crm/deals/${id}`),

  // Communications
  getCommunications: (params = {}) => apiClient.get('/crm/communications', { params }),
  createCommunication: (data) => apiClient.post('/crm/communications', data)
};
