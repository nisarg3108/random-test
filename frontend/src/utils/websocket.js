class WebSocketClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.subscriptions = new Set();
    this.listeners = new Map();
  }

  connect(token) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `ws://localhost:5000/ws?token=${encodeURIComponent(token)}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          
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

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
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
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        const token = localStorage.getItem('token');
        if (token) {
          this.connect(token).catch(console.error);
        }
      }, this.reconnectInterval);
    }
  }

  ping() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.listeners.clear();
  }
}

export const wsClient = new WebSocketClient();