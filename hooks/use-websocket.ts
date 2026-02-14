import { useEffect, useRef, useCallback, useState } from "react";
import { env } from "@/lib/env";

export type WebSocketMessageHandler<T> = (data: T) => void;
export type WebSocketEventHandler = () => void;

interface WebSocketOptions {
  onOpen?: WebSocketEventHandler;
  onClose?: WebSocketEventHandler;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectAttempts?: number;
}

export function useWebSocket<T = any>(
  url: string,
  onMessage: WebSocketMessageHandler<T>,
  options: WebSocketOptions = {}
) {
  const {
    onOpen,
    onClose,
    onError,
    reconnect = true,
    reconnectInterval = 3000,
    reconnectAttempts = 5,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const wsUrl = url || env.gatewayWebSocketUrl;
      console.log("[v0] WebSocket connecting to:", wsUrl);

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("[v0] WebSocket connected");
        setConnected(true);
        setError(null);
        reconnectAttemptRef.current = 0;
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as T;
          onMessage(data);
        } catch (err) {
          console.error("[v0] Failed to parse WebSocket message:", event.data);
        }
      };

      ws.onerror = (error) => {
        console.error("[v0] WebSocket error:", error);
        setError("WebSocket connection error");
        onError?.(error);
      };

      ws.onclose = () => {
        console.log("[v0] WebSocket disconnected");
        setConnected(false);
        onClose?.();

        // Attempt reconnect
        if (reconnect && reconnectAttemptRef.current < reconnectAttempts) {
          reconnectAttemptRef.current += 1;
          console.log(
            `[v0] Attempting to reconnect (${reconnectAttemptRef.current}/${reconnectAttempts})...`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("[v0] Failed to create WebSocket:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  }, [url, onMessage, onOpen, onClose, onError, reconnect, reconnectInterval, reconnectAttempts]);

  // Cleanup and connection management
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn("[v0] WebSocket not connected, cannot send message");
    }
  }, []);

  const close = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  return {
    connected,
    error,
    send,
    close,
  };
}
