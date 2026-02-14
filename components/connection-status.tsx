"use client";

import { useGateway } from "@/hooks/use-gateway";
import { cn } from "@/lib/utils";

export function ConnectionStatus() {
  const { state, serverInfo } = useGateway();

  const isConnected = state === "connected";
  const isConnecting = state === "connecting";

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isConnected && "bg-success animate-pulse-live",
          isConnecting && "bg-warning",
          !isConnected && !isConnecting && "bg-destructive"
        )}
      />
      <span className="text-xs font-medium text-muted-foreground">
        {isConnected
          ? "Connected"
          : isConnecting
            ? "Connecting..."
            : "Disconnected"}
      </span>
      {serverInfo && (
        <span className="text-[10px] font-mono text-muted-foreground">
          {serverInfo.version}
        </span>
      )}
    </div>
  );
}
