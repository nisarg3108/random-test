import express from 'express';
import communicationController from './communication.controller.js';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { upload } from '../../services/fileUpload.service.js';

const router = express.Router();

// Apply authentication to all routes
router.use(requireAuth);

// ==================== CONVERSATIONS ====================
router.get('/conversations', communicationController.getConversations);
router.get('/conversations/:id', communicationController.getConversation);
router.post('/conversations', communicationController.createConversation);
router.put('/conversations/:id', communicationController.updateConversation);
router.delete('/conversations/:id', communicationController.deleteConversation);
router.post('/conversations/:id/participants', communicationController.addParticipants);
router.delete('/conversations/:id/participants/:participantId', communicationController.removeParticipant);
router.put('/conversations/:conversationId/read', communicationController.markConversationAsRead);

// ==================== USERS (FOR MESSAGING) ====================
router.get('/users', communicationController.getMessagingUsers);

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

// ==================== FILE UPLOADS ====================
router.post('/files/upload', upload.array('files', 5), communicationController.uploadFiles);
router.get('/files/:filename', communicationController.getFile);
router.delete('/files/:filename', communicationController.deleteFile);
router.get('/files/:filename/stats', communicationController.getFileStats);

// ==================== EMAIL QUEUE ====================
router.get('/email/health', communicationController.checkEmailHealth);
router.get('/email/queue/stats', communicationController.getEmailQueueStats);
router.get('/email/queue', communicationController.getQueuedEmails);
router.post('/email/queue', communicationController.queueEmail);
router.post('/email/queue/retry-failed', communicationController.retryFailedEmails);
router.post('/email/queue/:emailId/retry', communicationController.retryEmail);
router.post('/email/queue/:emailId/cancel', communicationController.cancelEmail);

export default router;
