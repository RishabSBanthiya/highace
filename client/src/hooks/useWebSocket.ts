import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  payload: any;
}

export function useWebSocket(url: string) {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const messageHandlers = useRef<Map<string, (payload: any) => void>>(new Map());

  useEffect(() => {
    const socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);

        // Call registered handler for this message type
        const handler = messageHandlers.current.get(message.type);
        if (handler) {
          handler(message.payload);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current = socket;

    return () => {
      socket.close();
    };
  }, [url]);

  const send = useCallback((type: string, payload: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload }));
    } else {
      console.error('WebSocket is not connected');
    }
  }, []);

  const on = useCallback((type: string, handler: (payload: any) => void) => {
    messageHandlers.current.set(type, handler);
  }, []);

  const off = useCallback((type: string) => {
    messageHandlers.current.delete(type);
  }, []);

  return { connected, lastMessage, send, on, off };
}


