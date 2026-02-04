import { PrismaClient } from '@prisma/client';
import { realTimeServer } from '../../core/realtime.js';
const prisma = new PrismaClient();

class CommunicationService {
  // ==================== CONVERSATIONS ====================
  
  async getConversations(tenantId, userId, type = null) {
    const where = {
      tenantId,
      participants: {
        some: { userId }
      }
    };
    
    if (type) {
      where.type = type;
    }
    
    return await prisma.conversation.findMany({
      where,
      include: {
        participants: {
          select: {
            userId: true,
            role: true,
            lastReadAt: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
            type: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    });
  }
  
  async getConversation(conversationId, userId, tenantId) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        tenantId,
        participants: {
          some: { userId }
        }
      },
      include: {
        participants: {
          select: {
            userId: true,
            role: true,
            isMuted: true,
            lastReadAt: true
          }
        }
      }
    });
    
    return conversation;
  }
  
  async createConversation(tenantId, userId, data) {
    const { type, name, description, participantIds } = data;
    
    // Ensure creator is in participants
    const allParticipants = [...new Set([userId, ...(participantIds || [])])];
    
    return await prisma.conversation.create({
      data: {
        tenantId,
        type,
        name,
        description,
        createdBy: userId,
        participants: {
          create: allParticipants.map(pId => ({
            userId: pId,
            role: pId === userId ? 'ADMIN' : 'MEMBER'
          }))
        }
      },
      include: {
        participants: true
      }
    });
  }
  
  async updateConversation(conversationId, userId, tenantId, data) {
    // Verify user is admin of conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
        role: 'ADMIN'
      }
    });
    
    if (!participant) {
      throw new Error('Unauthorized to update this conversation');
    }
    
    return await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        name: data.name,
        description: data.description,
        isArchived: data.isArchived
      }
    });
  }
  
  async addParticipants(conversationId, userId, tenantId, participantIds) {
    // Verify user is admin
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId, role: 'ADMIN' }
    });
    
    if (!participant) {
      throw new Error('Unauthorized');
    }
    
    const newParticipants = await prisma.conversationParticipant.createMany({
      data: participantIds.map(pId => ({
        conversationId,
        userId: pId
      })),
      skipDuplicates: true
    });
    
    return newParticipants;
  }
  
  async removeParticipant(conversationId, userId, tenantId, participantId) {
    // User can remove themselves or if they're admin
    const userParticipant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId }
    });
    
    if (!userParticipant || (userParticipant.role !== 'ADMIN' && userId !== participantId)) {
      throw new Error('Unauthorized');
    }
    
    return await prisma.conversationParticipant.delete({
      where: {
        conversationId_userId: {
          conversationId,
          userId: participantId
        }
      }
    });
  }
  
  // ==================== MESSAGES ====================
  
  async getMessages(conversationId, userId, tenantId, { page = 1, limit = 50, before = null }) {
    // Verify user is participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId }
    });
    
    if (!participant) {
      throw new Error('Not a participant of this conversation');
    }
    
    const where = { conversationId, isDeleted: false };
    if (before) {
      where.createdAt = { lt: new Date(before) };
    }
    
    const messages = await prisma.message.findMany({
      where,
      include: {
        reactions: {
          select: {
            userId: true,
            emoji: true
          }
        },
        readReceipts: {
          select: {
            userId: true,
            readAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });
    
    const total = await prisma.message.count({ where });
    
    return {
      messages: messages.reverse(), // Return in chronological order
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }
  
  async sendMessage(conversationId, userId, tenantId, data) {
    // Verify user is participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId }
    });
    
    if (!participant) {
      throw new Error('Not a participant of this conversation');
    }
    
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: data.content,
        type: data.type || 'TEXT',
        attachments: data.attachments,
        mentionedUserIds: data.mentionedUserIds,
        replyToId: data.replyToId
      },
      include: {
        reactions: true,
        readReceipts: true
      }
    });
    
    // Update conversation's last message time
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });
    
    // Get all participants to broadcast
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true }
    });
    
    // Broadcast message to all participants via WebSocket
    const participantIds = participants.map(p => p.userId);
    realTimeServer.broadcastMessage(conversationId, message, tenantId);
    realTimeServer.broadcastToConversationParticipants(participantIds, tenantId, {
      type: 'new-message',
      conversationId,
      message
    });
    
    return message;
  }
  
  async updateMessage(messageId, userId, tenantId, data) {
    const message = await prisma.message.findFirst({
      where: { id: messageId, senderId: userId },
      include: { conversation: true }
    });
    
    if (!message) {
      throw new Error('Message not found or unauthorized');
    }
    
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: data.content,
        isEdited: true
      }
    });
    
    // Broadcast message update
    realTimeServer.broadcastMessageUpdate(message.conversationId, updatedMessage, tenantId);
    
    return updatedMessage;
  }
  
  async deleteMessage(messageId, userId, tenantId) {
    const message = await prisma.message.findFirst({
      where: { id: messageId, senderId: userId },
      include: { conversation: true }
    });
    
    if (!message) {
      throw new Error('Message not found or unauthorized');
    }
    
    const deletedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true }
    });
    
    // Broadcast message deletion
    realTimeServer.broadcastMessageUpdate(message.conversationId, {
      ...deletedMessage,
      action: 'deleted'
    }, tenantId);
    
    return deletedMessage;
  }
  
  async addReaction(messageId, userId, emoji, tenantId) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true }
    });
    
    const reaction = await prisma.messageReaction.create({
      data: {
        messageId,
        userId,
        emoji
      }
    });
    
    // Broadcast reaction
    if (message) {
      realTimeServer.broadcastReaction(message.conversationId, messageId, {
        userId,
        emoji,
        action: 'added'
      }, tenantId);
    }
    
    return reaction;
  }
  
  async removeReaction(messageId, userId, emoji, tenantId) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true }
    });
    
    const result = await prisma.messageReaction.deleteMany({
      where: {
        messageId,
        userId,
        emoji
      }
    });
    
    // Broadcast reaction removal
    if (message) {
      realTimeServer.broadcastReaction(message.conversationId, messageId, {
        userId,
        emoji,
        action: 'removed'
      }, tenantId);
    }
    
    return result;
  }
  
  // Typing indicator
  async setTypingStatus(conversationId, userId, tenantId, isTyping) {
    realTimeServer.broadcastTyping(conversationId, userId, isTyping, tenantId);
  }
  
  // Get online users
  getOnlineUsers(tenantId) {
    return realTimeServer.getOnlineUsers(tenantId);
  }
  
  async markMessageAsRead(messageId, userId, tenantId) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true }
    });
    
    const receipt = await prisma.messageReadReceipt.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId
        }
      },
      create: {
        messageId,
        userId
      },
      update: {
        readAt: new Date()
      }
    });
    
    // Broadcast read status
    if (message) {
      realTimeServer.broadcastMessageRead(message.conversationId, messageId, userId, tenantId);
    }
    
    return receipt;
  }
  
  async markConversationAsRead(conversationId, userId) {
    return await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId
        }
      },
      data: {
        lastReadAt: new Date()
      }
    });
  }
  
  // ==================== ANNOUNCEMENTS ====================
  
  async getAnnouncements(tenantId, userId, { page = 1, limit = 20, active = true }) {
    const where = { tenantId };
    
    if (active) {
      where.isActive = true;
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ];
    }
    
    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        reads: {
          where: { userId },
          select: { readAt: true }
        },
        _count: {
          select: { reads: true }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { publishedAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    });
    
    const total = await prisma.announcement.count({ where });
    
    return {
      announcements,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }
  
  async getAnnouncement(id, tenantId, userId) {
    return await prisma.announcement.findFirst({
      where: { id, tenantId },
      include: {
        reads: {
          where: { userId }
        },
        _count: {
          select: { reads: true }
        }
      }
    });
  }
  
  async createAnnouncement(tenantId, userId, data) {
    const announcement = await prisma.announcement.create({
      data: {
        tenantId,
        title: data.title,
        content: data.content,
        priority: data.priority || 'NORMAL',
        targetType: data.targetType || 'ALL',
        targetIds: data.targetIds,
        attachments: data.attachments,
        publishedBy: userId,
        expiresAt: data.expiresAt,
        isPinned: data.isPinned || false
      }
    });
    
    // Broadcast new announcement to all users in tenant
    realTimeServer.broadcastAnnouncement(announcement, tenantId);
    
    return announcement;
  }
  
  async updateAnnouncement(id, tenantId, userId, data) {
    const announcement = await prisma.announcement.findFirst({
      where: { id, tenantId, publishedBy: userId }
    });
    
    if (!announcement) {
      throw new Error('Announcement not found or unauthorized');
    }
    
    return await prisma.announcement.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        priority: data.priority,
        targetType: data.targetType,
        targetIds: data.targetIds,
        attachments: data.attachments,
        expiresAt: data.expiresAt,
        isPinned: data.isPinned,
        isActive: data.isActive
      }
    });
  }
  
  async deleteAnnouncement(id, tenantId, userId) {
    const announcement = await prisma.announcement.findFirst({
      where: { id, tenantId, publishedBy: userId }
    });
    
    if (!announcement) {
      throw new Error('Announcement not found or unauthorized');
    }
    
    return await prisma.announcement.delete({
      where: { id }
    });
  }
  
  async markAnnouncementAsRead(announcementId, userId) {
    return await prisma.announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId,
          userId
        }
      },
      create: {
        announcementId,
        userId
      },
      update: {
        readAt: new Date()
      }
    });
  }
  
  // ==================== CHANNELS ====================
  
  async getChannels(tenantId, userId, { type = null, archived = false }) {
    const where = {
      tenantId,
      isArchived: archived
    };
    
    if (type) {
      where.type = type;
    }
    
    // Get channels user is member of or public channels
    const channels = await prisma.chatChannel.findMany({
      where: {
        AND: [
          where,
          {
            OR: [
              { type: 'PUBLIC' },
              {
                members: {
                  some: { userId }
                }
              }
            ]
          }
        ]
      },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
            isMuted: true
          }
        },
        _count: {
          select: { members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return channels;
  }
  
  async getChannel(channelId, tenantId, userId) {
    return await prisma.chatChannel.findFirst({
      where: {
        id: channelId,
        tenantId,
        OR: [
          { type: 'PUBLIC' },
          {
            members: {
              some: { userId }
            }
          }
        ]
      },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
            isMuted: true,
            joinedAt: true
          }
        }
      }
    });
  }
  
  async createChannel(tenantId, userId, data) {
    return await prisma.chatChannel.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        type: data.type || 'PUBLIC',
        departmentId: data.departmentId,
        projectId: data.projectId,
        createdBy: userId,
        members: {
          create: {
            userId,
            role: 'ADMIN'
          }
        }
      },
      include: {
        members: true
      }
    });
  }
  
  async updateChannel(channelId, tenantId, userId, data) {
    // Verify user is admin
    const member = await prisma.chatChannelMember.findFirst({
      where: { channelId, userId, role: 'ADMIN' }
    });
    
    if (!member) {
      throw new Error('Unauthorized');
    }
    
    return await prisma.chatChannel.update({
      where: { id: channelId },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        isArchived: data.isArchived
      }
    });
  }
  
  async joinChannel(channelId, userId, tenantId) {
    const channel = await prisma.chatChannel.findFirst({
      where: { id: channelId, tenantId, type: 'PUBLIC' }
    });
    
    if (!channel) {
      throw new Error('Channel not found or not public');
    }
    
    return await prisma.chatChannelMember.create({
      data: {
        channelId,
        userId
      }
    });
  }
  
  async leaveChannel(channelId, userId) {
    return await prisma.chatChannelMember.delete({
      where: {
        channelId_userId: {
          channelId,
          userId
        }
      }
    });
  }
  
  // ==================== EMAIL TEMPLATES ====================
  
  async getEmailTemplates(tenantId, { active = true }) {
    return await prisma.emailTemplate.findMany({
      where: {
        tenantId,
        isActive: active
      },
      orderBy: { name: 'asc' }
    });
  }
  
  async createEmailTemplate(tenantId, userId, data) {
    return await prisma.emailTemplate.create({
      data: {
        tenantId,
        name: data.name,
        code: data.code,
        subject: data.subject,
        body: data.body,
        variables: data.variables,
        isSystem: data.isSystem || false,
        createdBy: userId
      }
    });
  }
  
  async updateEmailTemplate(id, tenantId, data) {
    const template = await prisma.emailTemplate.findFirst({
      where: { id, tenantId, isSystem: false }
    });
    
    if (!template) {
      throw new Error('Template not found or system template cannot be edited');
    }
    
    return await prisma.emailTemplate.update({
      where: { id },
      data: {
        name: data.name,
        subject: data.subject,
        body: data.body,
        variables: data.variables,
        isActive: data.isActive
      }
    });
  }
  
  async sendEmail(tenantId, data) {
    // Log the email
    const emailLog = await prisma.emailLog.create({
      data: {
        tenantId,
        to: data.to,
        cc: data.cc,
        bcc: data.bcc,
        subject: data.subject,
        body: data.body,
        templateId: data.templateId,
        metadata: data.metadata
      }
    });
    
    // TODO: Integrate with nodemailer or email service
    // For now, just log it
    
    return emailLog;
  }
  
  async getEmailLogs(tenantId, { page = 1, limit = 50, status = null }) {
    const where = { tenantId };
    if (status) {
      where.status = status;
    }
    
    const logs = await prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });
    
    const total = await prisma.emailLog.count({ where });
    
    return {
      logs,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }
  
  // ==================== SEARCH ====================
  
  async searchMessages(tenantId, userId, query) {
    // Get conversations user is part of
    const userConversations = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true }
    });
    
    const conversationIds = userConversations.map(c => c.conversationId);
    
    return await prisma.message.findMany({
      where: {
        conversationId: { in: conversationIds },
        content: {
          contains: query,
          mode: 'insensitive'
        },
        isDeleted: false
      },
      include: {
        conversation: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }
}

export default new CommunicationService();
