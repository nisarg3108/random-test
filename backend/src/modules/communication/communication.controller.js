import communicationService from './communication.service.js';
import { listUsers } from '../../users/user.service.js';
import fileUploadService from '../../services/fileUpload.service.js';
import emailQueueService from '../../services/emailQueue.service.js';

class CommunicationController {
  // ==================== CONVERSATIONS ====================
  
  async getConversations(req, res) {
    try {
      const { type } = req.query;
      const conversations = await communicationService.getConversations(
        req.user.tenantId,
        req.user.id,
        type
      );
      res.json(conversations);
    } catch (error) {
      console.error('Error getting conversations:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  async getConversation(req, res) {
    try {
      const { id } = req.params;
      const conversation = await communicationService.getConversation(
        id,
        req.user.id,
        req.user.tenantId
      );
      
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error('Error getting conversation:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  async createConversation(req, res) {
    try {
      const conversation = await communicationService.createConversation(
        req.user.tenantId,
        req.user.id,
        req.body
      );
      res.status(201).json(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  async updateConversation(req, res) {
    try {
      const { id } = req.params;
      const conversation = await communicationService.updateConversation(
        id,
        req.user.id,
        req.user.tenantId,
        req.body
      );
      res.json(conversation);
    } catch (error) {
      console.error('Error updating conversation:', error);
      res.status(error.message === 'Unauthorized to update this conversation' ? 403 : 500)
        .json({ error: error.message });
    }
  }
  
  async deleteConversation(req, res) {
    try {
      const { id } = req.params;
      await communicationService.deleteConversation(
        id,
        req.user.id,
        req.user.tenantId
      );
      res.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      res.status(error.message === 'Unauthorized' ? 403 : 500)
        .json({ error: error.message });
    }
  }
  
  async addParticipants(req, res) {
    try {
      const { id } = req.params;
      const { participantIds } = req.body;
      
      const result = await communicationService.addParticipants(
        id,
        req.user.id,
        req.user.tenantId,
        participantIds
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error adding participants:', error);
      res.status(error.message === 'Unauthorized' ? 403 : 500)
        .json({ error: error.message });
    }
  }
  
  async removeParticipant(req, res) {
    try {
      const { id, participantId } = req.params;
      
      await communicationService.removeParticipant(
        id,
        req.user.id,
        req.user.tenantId,
        participantId
      );
      
      res.json({ message: 'Participant removed successfully' });
    } catch (error) {
      console.error('Error removing participant:', error);
      res.status(error.message === 'Unauthorized' ? 403 : 500)
        .json({ error: error.message });
    }
  }

  // ==================== USERS (FOR MESSAGING) ====================

  async getMessagingUsers(req, res) {
    try {
      const users = await listUsers(req.user.tenantId);
      res.json(users);
    } catch (error) {
      console.error('Error getting messaging users:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // ==================== MESSAGES ====================
  
  async getMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const { page, limit, before } = req.query;
      
      const result = await communicationService.getMessages(
        conversationId,
        req.user.id,
        req.user.tenantId,
        { page: parseInt(page) || 1, limit: parseInt(limit) || 50, before }
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(error.message === 'Not a participant of this conversation' ? 403 : 500)
        .json({ error: error.message });
    }
  }
  
  async sendMessage(req, res) {
    try {
      const { conversationId } = req.params;
      
      const message = await communicationService.sendMessage(
        conversationId,
        req.user.id,
        req.user.tenantId,
        req.body
      );
      
      res.status(201).json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(error.message === 'Not a participant of this conversation' ? 403 : 500)
        .json({ error: error.message });
    }
  }
  
  async updateMessage(req, res) {
    try {
      const { messageId } = req.params;
      
      const message = await communicationService.updateMessage(
        messageId,
        req.user.id,
        req.user.tenantId,
        req.body
      );
      
      res.json(message);
    } catch (error) {
      console.error('Error updating message:', error);
      res.status(error.message === 'Message not found or unauthorized' ? 404 : 500)
        .json({ error: error.message });
    }
  }
  
  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      
      const message = await communicationService.deleteMessage(
        messageId,
        req.user.id,
        req.user.tenantId
      );
      
      res.json(message);
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(error.message === 'Message not found or unauthorized' ? 404 : 500)
        .json({ error: error.message });
    }
  }
  
  async addReaction(req, res) {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      
      const reaction = await communicationService.addReaction(
        messageId,
        req.user.id,
        emoji,
        req.user.tenantId
      );
      
      res.json(reaction);
    } catch (error) {
      console.error('Error adding reaction:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  async removeReaction(req, res) {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      
      await communicationService.removeReaction(
        messageId,
        req.user.id,
        emoji,
        req.user.tenantId
      );
      
      res.json({ message: 'Reaction removed' });
    } catch (error) {
      console.error('Error removing reaction:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  async markMessageAsRead(req, res) {
    try {
      const { messageId } = req.params;
      
      await communicationService.markMessageAsRead(
        messageId,
        req.user.id,
        req.user.tenantId
      );
      
      res.json({ message: 'Message marked as read' });
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  async markConversationAsRead(req, res) {
    try {
      const { conversationId } = req.params;
      
      await communicationService.markConversationAsRead(
        conversationId,
        req.user.id
      );
      
      res.json({ message: 'Conversation marked as read' });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // Typing indicator
  async setTypingStatus(req, res) {
    try {
      const { conversationId } = req.params;
      const { isTyping } = req.body;
      
      await communicationService.setTypingStatus(
        conversationId,
        req.user.id,
        req.user.tenantId,
        isTyping
      );
      
      res.json({ message: 'Typing status updated' });
    } catch (error) {
      console.error('Error setting typing status:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // Get online users
  async getOnlineUsers(req, res) {
    try {
      const onlineUsers = communicationService.getOnlineUsers(req.user.tenantId);
      res.json(onlineUsers);
    } catch (error) {
      console.error('Error getting online users:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // ==================== ANNOUNCEMENTS ====================
  
  async getAnnouncements(req, res) {
    try {
      const { page, limit, active } = req.query;
      
      const result = await communicationService.getAnnouncements(
        req.user.tenantId,
        req.user.id,
        {
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 20,
          active: active !== 'false'
        }
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error getting announcements:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  async getAnnouncement(req, res) {
    try {
      const { id } = req.params;
      
      const announcement = await communicationService.getAnnouncement(
        id,
        req.user.tenantId,
        req.user.id
      );
      
      if (!announcement) {
        return res.status(404).json({ error: 'Announcement not found' });
      }
      
      res.json(announcement);
    } catch (error) {
      console.error('Error getting announcement:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  async createAnnouncement(req, res) {
    try {
      const announcement = await communicationService.createAnnouncement(
        req.user.tenantId,
        req.user.id,
        req.body
      );
      
      res.status(201).json(announcement);
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  async updateAnnouncement(req, res) {
    try {
      const { id } = req.params;
      
      const announcement = await communicationService.updateAnnouncement(
        id,
        req.user.tenantId,
        req.user.id,
        req.body
      );
      
      res.json(announcement);
    } catch (error) {
      console.error('Error updating announcement:', error);
      res.status(error.message === 'Announcement not found or unauthorized' ? 404 : 500)
        .json({ error: error.message });
    }
  }
  
  async deleteAnnouncement(req, res) {
    try {
      const { id } = req.params;
      
      await communicationService.deleteAnnouncement(
        id,
        req.user.tenantId,
        req.user.id
      );
      
      res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      res.status(error.message === 'Announcement not found or unauthorized' ? 404 : 500)
        .json({ error: error.message });
    }
  }
  
  async markAnnouncementAsRead(req, res) {
    try {
      const { id } = req.params;
      
      await communicationService.markAnnouncementAsRead(
        id,
        req.user.id
      );
      
      res.json({ message: 'Announcement marked as read' });
    } catch (error) {
      console.error('Error marking announcement as read:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // ==================== CHANNELS ====================
  
  async getChannels(req, res) {
    try {
      const { type, archived } = req.query;
      
      const channels = await communicationService.getChannels(
        req.user.tenantId,
        req.user.id,
        { type, archived: archived === 'true' }
      );
      
      res.json(channels);
    } catch (error) {
      console.error('Error getting channels:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  async getChannel(req, res) {
    try {
      const { id } = req.params;
      
      const channel = await communicationService.getChannel(
        id,
        req.user.tenantId,
        req.user.id
      );
      
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }
      
      res.json(channel);
    } catch (error) {
      console.error('Error getting channel:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  async createChannel(req, res) {
    try {
      const channel = await communicationService.createChannel(
        req.user.tenantId,
        req.user.id,
        req.body
      );
      
      res.status(201).json(channel);
    } catch (error) {
      console.error('Error creating channel:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  async updateChannel(req, res) {
    try {
      const { id } = req.params;
      
      const channel = await communicationService.updateChannel(
        id,
        req.user.tenantId,
        req.user.id,
        req.body
      );
      
      res.json(channel);
    } catch (error) {
      console.error('Error updating channel:', error);
      res.status(error.message === 'Unauthorized' ? 403 : 500)
        .json({ error: error.message });
    }
  }
  
  async joinChannel(req, res) {
    try {
      const { id } = req.params;
      
      const result = await communicationService.joinChannel(
        id,
        req.user.id,
        req.user.tenantId
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error joining channel:', error);
      res.status(error.message === 'Channel not found or not public' ? 404 : 500)
        .json({ error: error.message });
    }
  }
  
  async leaveChannel(req, res) {
    try {
      const { id } = req.params;
      
      await communicationService.leaveChannel(
        id,
        req.user.id
      );
      
      res.json({ message: 'Left channel successfully' });
    } catch (error) {
      console.error('Error leaving channel:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // ==================== EMAIL TEMPLATES ====================
  
  async getEmailTemplates(req, res) {
    try {
      const { active } = req.query;
      
      const templates = await communicationService.getEmailTemplates(
        req.user.tenantId,
        { active: active !== 'false' }
      );
      
      res.json(templates);
    } catch (error) {
      console.error('Error getting email templates:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  async createEmailTemplate(req, res) {
    try {
      const template = await communicationService.createEmailTemplate(
        req.user.tenantId,
        req.user.id,
        req.body
      );
      
      res.status(201).json(template);
    } catch (error) {
      console.error('Error creating email template:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  async updateEmailTemplate(req, res) {
    try {
      const { id } = req.params;
      
      const template = await communicationService.updateEmailTemplate(
        id,
        req.user.tenantId,
        req.body
      );
      
      res.json(template);
    } catch (error) {
      console.error('Error updating email template:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  async sendEmail(req, res) {
    try {
      const result = await communicationService.sendEmail(
        req.user.tenantId,
        req.body
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  async getEmailLogs(req, res) {
    try {
      const { page, limit, status } = req.query;
      
      const result = await communicationService.getEmailLogs(
        req.user.tenantId,
        {
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 50,
          status
        }
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error getting email logs:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // ==================== SEARCH ====================
  
  async searchMessages(req, res) {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: 'Query parameter required' });
      }
      
      const results = await communicationService.searchMessages(
        req.user.tenantId,
        req.user.id,
        q
      );
      
      res.json(results);
    } catch (error) {
      console.error('Error searching messages:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  // ==================== FILE UPLOADS ====================
  
  async uploadFiles(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }
      
      const attachments = fileUploadService.processUploadedFiles(
        req.files,
        req.user.tenantId,
        req.user.id
      );
      
      res.status(201).json({
        message: 'Files uploaded successfully',
        attachments,
        count: attachments.length
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  async getFile(req, res) {
    try {
      const { filename } = req.params;
      
      const file = fileUploadService.getFile(filename);
      
      if (!file.exists) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Set CORS headers for cross-origin image loading
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      
      // Send file
      res.sendFile(file.path);
    } catch (error) {
      console.error('Error getting file:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  async deleteFile(req, res) {
    try {
      const { filename } = req.params;
      
      const result = await fileUploadService.deleteFile(filename);
      
      if (!result.success) {
        return res.status(404).json({ error: result.message });
      }
      
      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  async getFileStats(req, res) {
    try {
      const { filename } = req.params;
      
      const stats = fileUploadService.getFileStats(filename);
      
      if (!stats) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      res.json(stats);
    } catch (error) {
      console.error('Error getting file stats:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== EMAIL QUEUE ====================

  async checkEmailHealth(req, res) {
    try {
      const health = await emailQueueService.checkHealth();
      
      const statusCode = health.healthy ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      console.error('Error checking email health:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getEmailQueueStats(req, res) {
    try {
      const stats = await emailQueueService.getStats(req.user.tenantId);
      res.json(stats);
    } catch (error) {
      console.error('Error getting email queue stats:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getQueuedEmails(req, res) {
    try {
      const { status, priority, limit, offset } = req.query;
      
      const result = await emailQueueService.getQueuedEmails({
        tenantId: req.user.tenantId,
        status,
        priority: priority ? parseInt(priority) : undefined,
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error getting queued emails:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async retryFailedEmails(req, res) {
    try {
      await emailQueueService.retryFailedEmails();
      res.json({ message: 'Failed emails queued for retry' });
    } catch (error) {
      console.error('Error retrying failed emails:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async retryEmail(req, res) {
    try {
      const { emailId } = req.params;
      
      await emailQueueService.retryEmail(emailId);
      res.json({ message: 'Email queued for retry' });
    } catch (error) {
      console.error('Error retrying email:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async cancelEmail(req, res) {
    try {
      const { emailId } = req.params;
      
      await emailQueueService.cancelEmail(emailId);
      res.json({ message: 'Email cancelled' });
    } catch (error) {
      console.error('Error cancelling email:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async queueEmail(req, res) {
    try {
      const { to, cc, bcc, subject, body, templateId, variables, priority, scheduledAt } = req.body;
      
      const queuedEmail = await emailQueueService.queueEmail({
        tenantId: req.user.tenantId,
        to,
        cc,
        bcc,
        subject,
        body,
        templateId,
        variables,
        priority,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date()
      });
      
      res.status(201).json(queuedEmail);
    } catch (error) {
      console.error('Error queueing email:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new CommunicationController();
