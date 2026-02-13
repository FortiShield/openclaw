"use client";

import { GatewayContext } from "@/components/gateway-provider";
import { useContext } from "react";

export function useGateway() {
  const ctx = useContext(GatewayContext);
  if (!ctx) {
    throw new Error("useGateway must be used within a GatewayProvider");
  }
  return ctx;
}
