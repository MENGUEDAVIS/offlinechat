import { useState, useEffect, useCallback, useRef } from 'react';

type MessageHandler = (data: any) => void;
type ErrorHandler = (event: Event) => void;
type ConnectionHandler = (event: Event) => void;

interface WebSocketOptions {
  onMessage?: MessageHandler;
  onError?: ErrorHandler;
  onOpen?: ConnectionHandler;
  onClose?: ConnectionHandler;
  reconnectInterval?: number;
  reconnectAttempts?: number;
}

export const useWebSocket = (options: WebSocketOptions = {}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [error, setError] = useState<Event | null>(null);
  const reconnectCount = useRef(0);
  const maxReconnectAttempts = options.reconnectAttempts || 5;
  const reconnectInterval = options.reconnectInterval || 5000;

  // Initialize WebSocket connection
  const connect = useCallback(() => {
    // Check if we're online first
    if (!navigator.onLine) {
      console.log('Currently offline. WebSocket connection deferred.');
      return;
    }
    
    // Don't create a new connection if we already have an active one
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket connection already active or connecting.');
      return;
    }
    
    // Reset reconnect count when attempting a new connection
    reconnectCount.current = 0;

    // Determine the correct WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = (event) => {
      setIsConnected(true);
      reconnectCount.current = 0;
      if (options.onOpen) options.onOpen(event);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLastMessage(data);
      if (options.onMessage) options.onMessage(data);
    };
    
    ws.onerror = (event) => {
      setError(event);
      if (options.onError) options.onError(event);
    };
    
    ws.onclose = (event) => {
      setIsConnected(false);
      if (options.onClose) options.onClose(event);
      
      // Attempt to reconnect if not manually closed
      if (event.code !== 1000) {
        if (reconnectCount.current < maxReconnectAttempts) {
          reconnectCount.current += 1;
          setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectCount.current}/${maxReconnectAttempts})...`);
            // Only try to reconnect if we're online
            if (navigator.onLine) {
              connect();
            } else {
              console.log('Cannot reconnect while offline.');
            }
          }, reconnectInterval);
        } else {
          console.log('Maximum reconnection attempts reached. Please refresh the page.');
        }
      }
    };
    
    setSocket(ws);
    
    // Cleanup function
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [options.onMessage, options.onOpen, options.onClose, options.onError, maxReconnectAttempts, reconnectInterval]);

  // Connect on component mount
  useEffect(() => {
    const cleanup = connect();
    
    // Listen for online/offline events
    const handleOnline = () => {
      console.log('Back online, reconnecting WebSocket...');
      // Only reconnect if we don't have an active connection
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        connect();
      }
    };
    
    const handleOffline = () => {
      console.log('Went offline, WebSocket will disconnect.');
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      if (cleanup) cleanup();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connect, socket]);

  // Send message function
  const sendMessage = useCallback((data: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, [socket]);

  // Manual disconnect function
  const disconnect = useCallback(() => {
    if (socket) {
      socket.close(1000); // Normal closure
    }
  }, [socket]);

  return {
    isConnected,
    lastMessage,
    error,
    sendMessage,
    disconnect
  };
};
