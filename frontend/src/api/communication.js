import { apiClient } from './http';

// ==================== CONVERSATIONS ====================

export const getConversations = (type = null) => {
  const params = type ? { type } : {};
  return apiClient.get('/communication/conversations', { params });
};

export const getConversation = (id) => {
  return apiClient.get(`/communication/conversations/${id}`);
};

export const createConversation = (data) => {
  return apiClient.post('/communication/conversations', data);
};

export const updateConversation = (id, data) => {
  return apiClient.put(`/communication/conversations/${id}`, data);
};

export const addParticipants = (conversationId, participantIds) => {
  return apiClient.post(`/communication/conversations/${conversationId}/participants`, { participantIds });
};

export const removeParticipant = (conversationId, participantId) => {
  return apiClient.delete(`/communication/conversations/${conversationId}/participants/${participantId}`);
};

export const markConversationAsRead = (conversationId) => {
  return apiClient.put(`/communication/conversations/${conversationId}/read`);
};

// ==================== USERS (FOR MESSAGING) ====================

export const getMessagingUsers = () => {
  return apiClient.get('/communication/users');
};

// ==================== MESSAGES ====================

export const getMessages = (conversationId, params = {}) => {
  return apiClient.get(`/communication/conversations/${conversationId}/messages`, { params });
};

export const sendMessage = (conversationId, data) => {
  return apiClient.post(`/communication/conversations/${conversationId}/messages`, data);
};

export const updateMessage = (messageId, data) => {
  return apiClient.put(`/communication/messages/${messageId}`, data);
};

export const deleteMessage = (messageId) => {
  return apiClient.delete(`/communication/messages/${messageId}`);
};

export const addReaction = (messageId, emoji) => {
  return apiClient.post(`/communication/messages/${messageId}/reactions`, { emoji });
};

export const removeReaction = (messageId, emoji) => {
  return apiClient.delete(`/communication/messages/${messageId}/reactions`, { data: { emoji } });
};

export const markMessageAsRead = (messageId) => {
  return apiClient.put(`/communication/messages/${messageId}/read`);
};

// ==================== REAL-TIME FEATURES ====================

export const setTypingStatus = (conversationId, isTyping) => {
  return apiClient.post(`/communication/conversations/${conversationId}/typing`, { isTyping });
};

export const getOnlineUsers = () => {
  return apiClient.get('/communication/online-users');
};

// ==================== ANNOUNCEMENTS ====================

export const getAnnouncements = (params = {}) => {
  return apiClient.get('/communication/announcements', { params });
};

export const getAnnouncement = (id) => {
  return apiClient.get(`/communication/announcements/${id}`);
};

export const createAnnouncement = (data) => {
  return apiClient.post('/communication/announcements', data);
};

export const updateAnnouncement = (id, data) => {
  return apiClient.put(`/communication/announcements/${id}`, data);
};

export const deleteAnnouncement = (id) => {
  return apiClient.delete(`/communication/announcements/${id}`);
};

export const markAnnouncementAsRead = (id) => {
  return apiClient.put(`/communication/announcements/${id}/read`);
};

// ==================== CHANNELS ====================

export const getChannels = (params = {}) => {
  return apiClient.get('/communication/channels', { params });
};

export const getChannel = (id) => {
  return apiClient.get(`/communication/channels/${id}`);
};

export const createChannel = (data) => {
  return apiClient.post('/communication/channels', data);
};

export const updateChannel = (id, data) => {
  return apiClient.put(`/communication/channels/${id}`, data);
};

export const joinChannel = (id) => {
  return apiClient.post(`/communication/channels/${id}/join`);
};

export const leaveChannel = (id) => {
  return apiClient.post(`/communication/channels/${id}/leave`);
};

// ==================== EMAIL TEMPLATES ====================

export const getEmailTemplates = (params = {}) => {
  return apiClient.get('/communication/email-templates', { params });
};

export const createEmailTemplate = (data) => {
  return apiClient.post('/communication/email-templates', data);
};

export const updateEmailTemplate = (id, data) => {
  return apiClient.put(`/communication/email-templates/${id}`, data);
};

export const sendEmail = (data) => {
  return apiClient.post('/communication/emails/send', data);
};

export const getEmailLogs = (params = {}) => {
  return apiClient.get('/communication/email-logs', { params });
};

// ==================== SEARCH ====================

export const searchMessages = (query) => {
  return apiClient.get('/communication/search/messages', { params: { q: query } });
};
