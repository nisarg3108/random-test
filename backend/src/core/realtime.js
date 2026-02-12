import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import prisma from '../config/db.js';

class RealTimeServer {
  constructor() {
    this.wss = null;
    this.clients = new Map();
    this.subscriptions = new Map();
  }

  initialize(server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      clientTracking: true,
      perMessageDeflate: false
    });

    this.wss.on('connection', (ws, request) => {
      this.handleConnection(ws, request);
    });

    this.wss.on('error', (error) => {
      console.error('❌ WebSocket server error:', error);
    });

    console.log('🔌 WebSocket server initialized on path /ws');
  }

  async handleConnection(ws, request) {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        console.warn('⚠️ WebSocket connection rejected: No token provided');
        ws.close(1008, 'Token required');
        return;
      }

      const decoded = jwt.verify(token, env.jwtSecret);
      const resolvedUserId = decoded.userId || decoded.id;
      const user = await prisma.user.findUnique({
        where: { id: resolvedUserId },
        include: { tenant: true }
      });

      if (!user) {
        console.warn('⚠️ WebSocket connection rejected: Invalid user');
        ws.close(1008, 'Invalid user');
        return;
      }

      const clientId = `${user.id}_${Date.now()}`;
      this.clients.set(clientId, {
        ws,
        userId: user.id,
        tenantId: user.tenantId,
        subscriptions: new Set()
      });

      // Broadcast online status
      this.broadcastUserOnlineStatus(user.id, user.tenantId, true);

      ws.on('message', (data) => {
        this.handleMessage(clientId, data);
      });

      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      ws.send(JSON.stringify({ type: 'connected', clientId }));
      console.log(`✅ WebSocket client connected: ${user.email} (${clientId})`);

    } catch (error) {
      console.error('❌ WebSocket connection error:', error.message);
      if (ws.readyState === 1) {
        ws.close(1008, 'Authentication failed');
      }
    }
  }

  handleMessage(clientId, data) {
    try {
      const message = JSON.parse(data);
      const client = this.clients.get(clientId);

      if (!client) return;

      switch (message.type) {
        case 'subscribe':
          this.subscribe(clientId, message.endpoint);
          break;
        case 'unsubscribe':
          this.unsubscribe(clientId, message.endpoint);
          break;
        case 'ping':
          client.ws.send(JSON.stringify({ type: 'pong' }));
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  }

  subscribe(clientId, endpoint) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscriptions.add(endpoint);

    if (!this.subscriptions.has(endpoint)) {
      this.subscriptions.set(endpoint, new Set());
    }
    this.subscriptions.get(endpoint).add(clientId);
  }

  unsubscribe(clientId, endpoint) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscriptions.delete(endpoint);

    const endpointSubs = this.subscriptions.get(endpoint);
    if (endpointSubs) {
      endpointSubs.delete(clientId);
      if (endpointSubs.size === 0) {
        this.subscriptions.delete(endpoint);
      }
    }
  }

  handleDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscriptions.forEach(endpoint => {
      this.unsubscribe(clientId, endpoint);
    });

    this.clients.delete(clientId);

    const stillOnline = Array.from(this.clients.values()).some(
      c => c.userId === client.userId && c.tenantId === client.tenantId
    );

    if (!stillOnline) {
      this.broadcastUserOnlineStatus(client.userId, client.tenantId, false);
    }
  }

  broadcast(endpoint, data, tenantId = null) {
    const subscribers = this.subscriptions.get(endpoint);
    if (!subscribers) return;

    subscribers.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (!client) return;

      if (tenantId && client.tenantId !== tenantId) return;

      if (client.ws.readyState === 1) {
        client.ws.send(JSON.stringify({
          endpoint,
          data,
          timestamp: new Date().toISOString()
        }));
      }
    });
  }

  broadcastDashboardStats(tenantId, stats) {
    this.broadcast('/dashboard/stats', stats, tenantId);
  }

  broadcastActivity(tenantId, activity) {
    this.broadcast('/dashboard/activities', activity, tenantId);
  }

  broadcastInventoryUpdate(tenantId, item) {
    this.broadcast('/inventory/updates', item, tenantId);
  }

  broadcastUserUpdate(tenantId, user) {
    this.broadcast('/users/updates', user, tenantId);
  }

  // ==================== COMMUNICATION MODULE ====================

  // Broadcast new message to all participants in a conversation
  broadcastMessage(conversationId, message, tenantId) {
    this.broadcast(`/conversation/${conversationId}/messages`, message, tenantId);
  }

  // Broadcast typing indicator
  broadcastTyping(conversationId, userId, isTyping, tenantId) {
    this.broadcast(`/conversation/${conversationId}/typing`, {
      userId,
      isTyping,
      timestamp: new Date().toISOString()
    }, tenantId);
  }

  // Broadcast message read status
  broadcastMessageRead(conversationId, messageId, userId, tenantId) {
    this.broadcast(`/conversation/${conversationId}/read`, {
      messageId,
      userId,
      readAt: new Date().toISOString()
    }, tenantId);
  }

  // Broadcast message reaction
  broadcastReaction(conversationId, messageId, reaction, tenantId) {
    this.broadcast(`/conversation/${conversationId}/reactions`, {
      messageId,
      ...reaction
    }, tenantId);
  }

  // Broadcast message update (edit/delete)
  broadcastMessageUpdate(conversationId, message, tenantId) {
    this.broadcast(`/conversation/${conversationId}/message-update`, message, tenantId);
  }

  // Broadcast new announcement
  broadcastAnnouncement(announcement, tenantId) {
    this.broadcast('/announcements/new', announcement, tenantId);
  }

  // Broadcast user online status
  broadcastUserOnlineStatus(userId, tenantId, isOnline) {
    this.broadcast('/users/online-status', {
      userId,
      isOnline,
      lastSeen: new Date().toISOString()
    }, tenantId);
  }

  // Get online users for a tenant
  getOnlineUsers(tenantId) {
    const onlineUsers = new Set();
    this.clients.forEach((client) => {
      if (client.tenantId === tenantId) {
        onlineUsers.add(client.userId);
      }
    });
    return Array.from(onlineUsers);
  }

  // Send direct message to specific user
  sendToUser(userId, tenantId, data) {
    this.clients.forEach((client, clientId) => {
      if (client.userId === userId && client.tenantId === tenantId) {
        if (client.ws.readyState === 1) {
          client.ws.send(JSON.stringify(data));
        }
      }
    });
  }

  // Broadcast to all participants of a conversation
  broadcastToConversationParticipants(participantIds, tenantId, data) {
    participantIds.forEach(userId => {
      this.sendToUser(userId, tenantId, data);
    });
  }
}

export const realTimeServer = new RealTimeServer();