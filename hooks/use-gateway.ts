"use client";

import { GatewayContext } from "@/components/gateway-provider";
import { useContext } from "react";

export function useGateway() {
  const ctx = useContext(GatewayContext);
  if (ctx === null) {
    // Return a stub context during SSR to prevent errors
    return {
      state: "disconnected" as const,
      serverInfo: null,
      snapshot: null,
      request: async () => {
        throw new Error("Gateway not available during SSR");
      },
      subscribe: () => () => {},
    };
  }
  return ctx;
}
