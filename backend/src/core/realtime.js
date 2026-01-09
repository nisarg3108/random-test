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
      path: '/ws'
    });

    this.wss.on('connection', (ws, request) => {
      this.handleConnection(ws, request);
    });

    console.log('🔌 WebSocket server initialized');
  }

  async handleConnection(ws, request) {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(1008, 'Token required');
        return;
      }

      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { tenant: true }
      });

      if (!user) {
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

      ws.on('message', (data) => {
        this.handleMessage(clientId, data);
      });

      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      ws.send(JSON.stringify({ type: 'connected', clientId }));

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1008, 'Authentication failed');
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
}

export const realTimeServer = new RealTimeServer();