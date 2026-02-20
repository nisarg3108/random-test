// WebSocket connection test utility
export const testWebSocketConnection = async () => {
  const token = localStorage.getItem('ueorms_token');
  
  if (!token) {
    console.error('No token found for WebSocket test');
    return false;
  }

  return new Promise((resolve) => {
    const baseWsUrl = (import.meta.env.VITE_WS_URL || 'ws://localhost:5000').replace(/\/ws\/?$/, '');
    const wsUrl = `${baseWsUrl}/ws?token=${encodeURIComponent(token)}`;
    const testWs = new WebSocket(wsUrl);
    
    const timeout = setTimeout(() => {
      console.error('WebSocket connection test timed out');
      testWs.close();
      resolve(false);
    }, 5000);

    testWs.onopen = () => {
      console.log('✅ WebSocket connection test successful');
      clearTimeout(timeout);
      testWs.close();
      resolve(true);
    };

    testWs.onerror = (error) => {
      console.error('❌ WebSocket connection test failed:', error);
      clearTimeout(timeout);
      resolve(false);
    };

    testWs.onclose = (event) => {
      if (event.code !== 1000) {
        console.error('❌ WebSocket closed with error code:', event.code, event.reason);
      }
    };
  });
};