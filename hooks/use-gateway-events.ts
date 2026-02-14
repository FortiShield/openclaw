"use client";

import { useGateway } from "@/hooks/use-gateway";
import { useEffect, useRef } from "react";

/**
 * Subscribe to specific gateway event types.
 * The handler is stable-ref'd so it won't cause re-subscriptions.
 */
export function useGatewayEvent(
  eventName: string,
  handler: (payload: unknown) => void,
) {
  const { subscribe } = useGateway();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    return subscribe(eventName, (payload) => {
      handlerRef.current(payload);
    });
  }, [eventName, subscribe]);
}
