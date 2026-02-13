"use client";

import {
  BrowserGatewayClient,
  type ConnectionState,
} from "@/lib/gateway-client";
import type { EventFrame, HelloOk, Snapshot } from "@/lib/protocol-types";
import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface GatewayContextValue {
  state: ConnectionState;
  serverInfo: HelloOk["server"] | null;
  snapshot: Snapshot | null;
  request: <T = unknown>(
    method: string,
    params?: unknown,
    opts?: { expectFinal?: boolean },
  ) => Promise<T>;
  subscribe: (
    eventName: string,
    handler: (payload: unknown) => void,
  ) => () => void;
}

export const GatewayContext = createContext<GatewayContextValue | null>(null);

const GATEWAY_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_GATEWAY_URL ?? "ws://127.0.0.1:18789")
    : "ws://127.0.0.1:18789";

const GATEWAY_TOKEN =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_GATEWAY_TOKEN ?? undefined)
    : undefined;

export function GatewayProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef<BrowserGatewayClient | null>(null);
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [serverInfo, setServerInfo] = useState<HelloOk["server"] | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  // Event subscribers: map of eventName -> Set of handlers
  const subscribersRef = useRef<
    Map<string, Set<(payload: unknown) => void>>
  >(new Map());

  useEffect(() => {
    const client = new BrowserGatewayClient(GATEWAY_URL, GATEWAY_TOKEN);
    clientRef.current = client;

    client.on("stateChange", (s) => {
      setState(s);
    });

    client.on("helloOk", (hello) => {
      setServerInfo(hello.server);
      setSnapshot(hello.snapshot);
    });

    client.on("event", (evt: EventFrame) => {
      // Update snapshot on presence/health events
      if (evt.event === "presence" && evt.payload) {
        setSnapshot((prev) =>
          prev
            ? { ...prev, presence: evt.payload as Snapshot["presence"] }
            : prev,
        );
      }
      if (evt.event === "health" && evt.payload) {
        setSnapshot((prev) =>
          prev ? { ...prev, health: evt.payload } : prev,
        );
      }

      // Notify event subscribers
      const subs = subscribersRef.current.get(evt.event);
      if (subs) {
        for (const handler of subs) {
          handler(evt.payload);
        }
      }
      // Also notify wildcard subscribers
      const wildcardSubs = subscribersRef.current.get("*");
      if (wildcardSubs) {
        for (const handler of wildcardSubs) {
          handler(evt);
        }
      }
    });

    client.start();

    return () => {
      client.stop();
      clientRef.current = null;
    };
  }, []);

  const request = useCallback(
    async <T = unknown>(
      method: string,
      params?: unknown,
      opts?: { expectFinal?: boolean },
    ): Promise<T> => {
      const client = clientRef.current;
      if (!client) throw new Error("Gateway client not initialized");
      return client.request<T>(method, params, opts);
    },
    [],
  );

  const subscribe = useCallback(
    (eventName: string, handler: (payload: unknown) => void): (() => void) => {
      if (!subscribersRef.current.has(eventName)) {
        subscribersRef.current.set(eventName, new Set());
      }
      const set = subscribersRef.current.get(eventName)!;
      set.add(handler);
      return () => {
        set.delete(handler);
        if (set.size === 0) {
          subscribersRef.current.delete(eventName);
        }
      };
    },
    [],
  );

  return (
    <GatewayContext.Provider
      value={{ state, serverInfo, snapshot, request, subscribe }}
    >
      {children}
    </GatewayContext.Provider>
  );
}
