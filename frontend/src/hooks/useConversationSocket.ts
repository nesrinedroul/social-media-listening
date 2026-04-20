/* eslint-disable react-hooks/immutability */
import { useEffect, useRef, useCallback } from 'react';
import { WS_BASE } from '../api/client';
import type { WsEvent } from '../types';

interface UseConversationSocketOptions {
  onEvent: (event: WsEvent) => void;
  enabled?: boolean;
}

export function useConversationSocket({ onEvent, enabled = true }: UseConversationSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token || !enabled) return;

    const ws = new WebSocket(`${WS_BASE}/ws/conversations/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      // Send heartbeat every 30 seconds to keep agent online
      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'heartbeat' }));
        }
      }, 30_000);
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as WsEvent;
        onEventRef.current(data);
      } catch {
        // ignore malformed
      }
    };

    ws.onclose = () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      // Reconnect after 3 seconds
      if (enabled) setTimeout(connect, 3_000);
    };

    ws.onerror = () => ws.close();
  }, [enabled]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [connect]);

  const sendReply = useCallback((conversation_id: string, text: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'send_reply', conversation_id, text }));
  }, []);

  return { sendReply };
}