import { useEffect, useRef, useState, useCallback } from 'react';
import { getToken } from '../store/auth.store';
import { getOnlineUsers } from '../api/communication';

const WS_URL = (import.meta.env.VITE_WS_URL || 'ws://localhost:5000').replace(/\/ws\/?$/, '');

export const useWebSocket = () => {
  const ws = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const reconnectTimeout = useRef(null);
  const messageHandlers = useRef(new Map());

  const connect = useCallback(() => {
    const token = getToken();
    if (!token) {
      console.log('No token found, skipping WebSocket connection');
      return;
    }

    try {
      const baseWsUrl = WS_URL.replace(/\/$/, '');
      const wsUrl = `${baseWsUrl}/ws?token=${token}`;
      console.log('Connecting to WebSocket:', wsUrl.replace(/token=[^&]+/, 'token=***'));
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Clear any pending reconnect
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = null;
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          
          // Call registered handlers based on message type or endpoint
          if (data.type) {
            const handler = messageHandlers.current.get(data.type);
            if (handler) handler(data);
          }
          
          if (data.endpoint) {
            const handler = messageHandlers.current.get(data.endpoint);
            if (handler) handler(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        if (!reconnectTimeout.current) {
          reconnectTimeout.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        // Silently handle WebSocket errors - fallback to polling
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    
    setIsConnected(false);
  }, []);

  const send = useCallback((data) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  const subscribe = useCallback((endpoint) => {
    send({ type: 'subscribe', endpoint });
  }, [send]);

  const unsubscribe = useCallback((endpoint) => {
    send({ type: 'unsubscribe', endpoint });
  }, [send]);

  const registerHandler = useCallback((type, handler) => {
    messageHandlers.current.set(type, handler);
    return () => messageHandlers.current.delete(type);
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    send,
    subscribe,
    unsubscribe,
    registerHandler,
    connect,
    disconnect
  };
};

// Hook specifically for messaging
export const useMessagingWebSocket = (conversationId) => {
  const { isConnected, subscribe, unsubscribe, registerHandler } = useWebSocket();
  const [newMessage, setNewMessage] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [readReceipts, setReadReceipts] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [messageUpdates, setMessageUpdates] = useState(null);

  useEffect(() => {
    if (!conversationId || !isConnected) return;

    // Subscribe to conversation events
    subscribe(`/conversation/${conversationId}/messages`);
    subscribe(`/conversation/${conversationId}/typing`);
    subscribe(`/conversation/${conversationId}/read`);
    subscribe(`/conversation/${conversationId}/reactions`);
    subscribe(`/conversation/${conversationId}/message-update`);

    // Register handlers
    const unregisterMessage = registerHandler('new-message', (data) => {
      if (data.conversationId === conversationId) {
        setNewMessage(data.message);
      }
    });

    const unregisterTyping = registerHandler(`/conversation/${conversationId}/typing`, (data) => {
      const { userId, isTyping } = data.data;
      setTypingUsers(prev => {
        if (isTyping) {
          return [...new Set([...prev, userId])];
        } else {
          return prev.filter(id => id !== userId);
        }
      });
    });

    const unregisterRead = registerHandler(`/conversation/${conversationId}/read`, (data) => {
      setReadReceipts(prev => [...prev, data.data]);
    });

    const unregisterReactions = registerHandler(`/conversation/${conversationId}/reactions`, (data) => {
      setReactions(prev => [...prev, data.data]);
    });

    const unregisterUpdates = registerHandler(`/conversation/${conversationId}/message-update`, (data) => {
      setMessageUpdates(data.data);
    });

    return () => {
      unsubscribe(`/conversation/${conversationId}/messages`);
      unsubscribe(`/conversation/${conversationId}/typing`);
      unsubscribe(`/conversation/${conversationId}/read`);
      unsubscribe(`/conversation/${conversationId}/reactions`);
      unsubscribe(`/conversation/${conversationId}/message-update`);
      unregisterMessage();
      unregisterTyping();
      unregisterRead();
      unregisterReactions();
      unregisterUpdates();
    };
  }, [conversationId, isConnected, subscribe, unsubscribe, registerHandler]);

  return {
    isConnected,
    newMessage,
    typingUsers,
    readReceipts,
    reactions,
    messageUpdates,
    clearNewMessage: () => setNewMessage(null),
    clearReactions: () => setReactions([]),
    clearReadReceipts: () => setReadReceipts([])
  };
};

// Hook for announcements
export const useAnnouncementsWebSocket = () => {
  const { isConnected, subscribe, unsubscribe, registerHandler } = useWebSocket();
  const [newAnnouncement, setNewAnnouncement] = useState(null);

  useEffect(() => {
    if (!isConnected) return;

    subscribe('/announcements/new');

    const unregister = registerHandler('/announcements/new', (data) => {
      setNewAnnouncement(data.data);
    });

    return () => {
      unsubscribe('/announcements/new');
      unregister();
    };
  }, [isConnected, subscribe, unsubscribe, registerHandler]);

  return {
    isConnected,
    newAnnouncement,
    clearNewAnnouncement: () => setNewAnnouncement(null)
  };
};

// Hook for online users status
export const useOnlineUsersWebSocket = () => {
  const { isConnected, subscribe, unsubscribe, registerHandler } = useWebSocket();
  const [onlineUsers, setOnlineUsers] = useState([]);

  const normalizeOnlineUsers = (data) => {
    if (!Array.isArray(data)) return [];
    return data
      .map((item) => (typeof item === 'string' ? item : item?.id))
      .filter(Boolean);
  };

  useEffect(() => {
    if (!isConnected) return;

    subscribe('/users/online-status');

    let isMounted = true;

    const fetchOnlineUsers = () => {
      getOnlineUsers()
        .then((response) => {
          if (isMounted) {
            setOnlineUsers(normalizeOnlineUsers(response.data));
          }
        })
        .catch((error) => {
          console.error('Error loading online users:', error);
        });
    };

    fetchOnlineUsers();
    const intervalId = setInterval(fetchOnlineUsers, 30000); // Increased from 10s to 30s

    const unregister = registerHandler('/users/online-status', (data) => {
      const { userId, isOnline } = data.data;
      setOnlineUsers(prev => {
        if (isOnline) {
          return [...new Set([...prev, userId])];
        } else {
          return prev.filter(id => id !== userId);
        }
      });
    });

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      unsubscribe('/users/online-status');
      unregister();
    };
  }, [isConnected, subscribe, unsubscribe, registerHandler]);

  return {
    isConnected,
    onlineUsers
  };
};

export default useWebSocket;
