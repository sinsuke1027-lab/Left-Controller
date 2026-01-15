'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface SystemStatus {
  cpu: number;
  memory: number;
  disk: number;
}

export const useWebSocket = (port: number = 8002) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({ cpu: 0, memory: 0, disk: 0 });

  const connect = useCallback(() => {
    // Determine the WebSocket URL based on the current window location
    // This allows it to work from localhost or local IP (tablet)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const url = `${protocol}//${host}:${port}/ws`;

    console.log(`Connecting to WebSocket: ${url}`);

    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      ws.current.onmessage = (event) => {
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
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(connect, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.current?.close();
      };
    } catch (e) {
      console.error('Connection failed:', e);
      setTimeout(connect, 3000);
    }
  }, [port]);

  useEffect(() => {
    connect();
    return () => {
      ws.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected, cannot send message");
    }
  }, []);

  return { isConnected, sendMessage, systemStatus };
};
