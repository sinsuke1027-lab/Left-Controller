'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface SystemStatus {
  cpu: number;
  memory: number;
  disk: number;
}

export const useWebSocket = (host: string, port: number = 8002) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({ cpu: 0, memory: 0, disk: 0 });

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  const connect = useCallback(() => {
    // If host is explicitly provided (e.g. from device settings), use it.
    // Otherwise fallback to window.location (current behavior)
    const targetHost = host || window.location.hostname;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${targetHost}:${port}/ws`;

    console.log(`Connecting to WebSocket: ${url}`);

    try {
      if (ws.current) {
        ws.current.close();
      }

      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        if (!isMounted.current) return;
        console.log('WebSocket connected');
        setIsConnected(true);
        // Clear any pending reconnects
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
      };

      ws.current.onmessage = (event) => {
        if (!isMounted.current) return;
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'status' && message.data) {
            setSystemStatus(message.data);
          }
        } catch (e) {
          console.error("Error parsing message", e);
        }
      };

      ws.current.onclose = () => {
        if (!isMounted.current) return;
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Auto-reconnect after 3s
        if (!reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
                console.log('Attempting auto-reconnect...');
                connect();
            }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        console.warn('WebSocket connection error:', error);
        // Error invokes close, which triggers onclose -> reconnect
        // ws.current?.close(); 
      };
    } catch (e) {
      console.error('Connection failed:', e);
      // Retry on immediate failure too
      if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => connect(), 3000);
      }
    }
  }, [host, port]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    connect();
    return () => {
      isMounted.current = false;
      if (ws.current) ws.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  // Manual Reconnect Function
  const reconnect = useCallback(() => {
      if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
      }
      connect();
  }, [connect]);

  const sendMessage = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected, cannot send message");
    }
  }, []);

  return { isConnected, sendMessage, systemStatus, reconnect };
};
