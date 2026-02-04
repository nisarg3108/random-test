import express from 'express';
import communicationController from './communication.controller.js';
import { requireAuth } from '../../core/auth/auth.middleware.js';

const router = express.Router();

// Apply authentication to all routes
router.use(requireAuth);

// ==================== CONVERSATIONS ====================
router.get('/conversations', communicationController.getConversations);
router.get('/conversations/:id', communicationController.getConversation);
router.post('/conversations', communicationController.createConversation);
router.put('/conversations/:id', communicationController.updateConversation);
router.post('/conversations/:id/participants', communicationController.addParticipants);
router.delete('/conversations/:id/participants/:participantId', communicationController.removeParticipant);
router.put('/conversations/:conversationId/read', communicationController.markConversationAsRead);

// ==================== MESSAGES ====================
router.get('/conversations/:conversationId/messages', communicationController.getMessages);
router.post('/conversations/:conversationId/messages', communicationController.sendMessage);
router.put('/messages/:messageId', communicationController.updateMessage);
router.delete('/messages/:messageId', communicationController.deleteMessage);
router.post('/messages/:messageId/reactions', communicationController.addReaction);
router.delete('/messages/:messageId/reactions', communicationController.removeReaction);
router.put('/messages/:messageId/read', communicationController.markMessageAsRead);

// ==================== REAL-TIME FEATURES ====================
router.post('/conversations/:conversationId/typing', communicationController.setTypingStatus);
router.get('/online-users', communicationController.getOnlineUsers);

// ==================== ANNOUNCEMENTS ====================
router.get('/announcements', communicationController.getAnnouncements);
router.get('/announcements/:id', communicationController.getAnnouncement);
router.post('/announcements', communicationController.createAnnouncement);
router.put('/announcements/:id', communicationController.updateAnnouncement);
router.delete('/announcements/:id', communicationController.deleteAnnouncement);
router.put('/announcements/:id/read', communicationController.markAnnouncementAsRead);

// ==================== CHANNELS ====================
router.get('/channels', communicationController.getChannels);
router.get('/channels/:id', communicationController.getChannel);
router.post('/channels', communicationController.createChannel);
router.put('/channels/:id', communicationController.updateChannel);
router.post('/channels/:id/join', communicationController.joinChannel);
router.post('/channels/:id/leave', communicationController.leaveChannel);

// ==================== EMAIL TEMPLATES ====================
router.get('/email-templates', communicationController.getEmailTemplates);
router.post('/email-templates', communicationController.createEmailTemplate);
router.put('/email-templates/:id', communicationController.updateEmailTemplate);
router.post('/emails/send', communicationController.sendEmail);
router.get('/email-logs', communicationController.getEmailLogs);

// ==================== SEARCH ====================
router.get('/search/messages', communicationController.searchMessages);

export default router;
