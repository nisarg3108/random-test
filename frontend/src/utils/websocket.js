class WebSocketClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectInterval = 5000;
    this.subscriptions = new Set();
    this.listeners = new Map();
    this.isConnecting = false;
    this.hasGivenUp = false;
    this.pingInterval = null;
  }

  startPingInterval() {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      this.ping();
    }, 30000);
  }

  stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  connect(token) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.hasGivenUp) {
      return Promise.reject(new Error('WebSocket connection abandoned after max attempts'));
    }

    if (this.isConnecting) {
      return Promise.reject(new Error('Connection already in progress'));
    }

    return new Promise((resolve, reject) => {
      try {
        this.isConnecting = true;
        const baseWsUrl = (import.meta.env.VITE_WS_URL || 'ws://localhost:5000').replace(/\/ws\/?$/, '').replace(/\/$/, '');
        const wsUrl = `${baseWsUrl}/ws?token=${encodeURIComponent(token)}`;
        
        if (this.reconnectAttempts === 0) {
          console.log('🔌 Attempting WebSocket connection to:', wsUrl.replace(/token=[^&]+/, 'token=***'));
        }
        
        this.ws = new WebSocket(wsUrl);
        
        // Suppress browser's native WebSocket error messages
        this.ws.addEventListener('error', (e) => {
          e.preventDefault();
          e.stopPropagation();
        });

        const connectionTimeout = setTimeout(() => {
          if (this.reconnectAttempts === 1) {
            console.warn('⚠️ WebSocket connection timeout - will retry');
          }
          this.ws.close();
          this.isConnecting = false;
          reject(new Error('Connection timeout'));
        }, 15000);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          clearTimeout(connectionTimeout);
          this.reconnectAttempts = 0;
          this.hasGivenUp = false;
          this.isConnecting = false;
          this.startPingInterval();
          
          // Resubscribe to previous subscriptions
          this.subscriptions.forEach(endpoint => {
            this.subscribe(endpoint);
          });
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('WebSocket message parse error:', error);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          this.stopPingInterval();
          if (this.reconnectAttempts === 0 && !this.hasGivenUp) {
            console.log('🔌 WebSocket disconnected. Code:', event.code);
          }
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          this.stopPingInterval();
          // Silently handle errors - only log on first attempt
          if (this.reconnectAttempts === 0) {
            console.info('ℹ️ WebSocket unavailable - using polling mode');
          }
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  handleMessage(data) {
    if (data.type === 'connected') {
      console.log('WebSocket client connected:', data.clientId);
      return;
    }

    if (data.type === 'pong') {
      return;
    }

    // Handle real-time data updates
    if (data.endpoint && data.data) {
      const listeners = this.listeners.get(data.endpoint);
      if (listeners) {
        listeners.forEach(callback => {
          try {
            callback(data.data);
          } catch (error) {
            console.error('WebSocket listener error:', error);
          }
        });
      }
    }
  }

  subscribe(endpoint) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.subscriptions.add(endpoint);
      return;
    }

    this.subscriptions.add(endpoint);
    this.ws.send(JSON.stringify({
      type: 'subscribe',
      endpoint
    }));
  }

  unsubscribe(endpoint) {
    this.subscriptions.delete(endpoint);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        endpoint
      }));
    }
  }

  on(endpoint, callback) {
    if (!this.listeners.has(endpoint)) {
      this.listeners.set(endpoint, new Set());
    }
    this.listeners.get(endpoint).add(callback);
    
    // Auto-subscribe when adding listener
    this.subscribe(endpoint);
  }

  off(endpoint, callback) {
    const listeners = this.listeners.get(endpoint);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(endpoint);
        this.unsubscribe(endpoint);
      }
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts === 1) {
        console.log(`⏱️ Will retry connection in ${this.reconnectInterval / 1000} seconds...`);
      }
      
      setTimeout(() => {
        const token = localStorage.getItem('ueorms_token');
        if (token) {
          this.connect(token).catch(() => {
            // Silently handle reconnection failures
          });
        }
      }, this.reconnectInterval);
    } else if (!this.hasGivenUp) {
      this.hasGivenUp = true;
      console.warn('⚠️ WebSocket unavailable - continuing in offline mode. Real-time features disabled.');
    }
  }

  ping() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }

  disconnect() {
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.listeners.clear();
  }
}

export const wsClient = new WebSocketClient();