"use client";

import { useGatewayMethod } from "@/hooks/use-gateway-method";
import { useGatewayEvent } from "@/hooks/use-gateway-events";
import { useGateway } from "@/hooks/use-gateway";
import type { HealthSummary } from "@/lib/protocol-types";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";
import { Heart, Loader2, MessageCircle, Send } from "lucide-react";
import { useEffect } from "react";

export function HealthCard() {
  const { state } = useGateway();
  const { data: health, loading, call } =
    useGatewayMethod<HealthSummary>("health");

  useEffect(() => {
    if (state === "connected") {
      call();
    }
  }, [state, call]);

  // Refresh on health events
  useGatewayEvent("health", () => {
    call();
  });

  if (loading && !health) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading health...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Gateway Health
          </h3>
        </div>
        {health && (
          <span className="text-[10px] font-mono text-muted-foreground">
            {formatDuration(health.durationMs)} check
          </span>
        )}
      </div>

      {health ? (
        <div className="mt-4 grid grid-cols-2 gap-4">
          {/* WhatsApp */}
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-success" />
              <span className="text-xs font-medium text-foreground">
                WhatsApp
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  health.web.linked ? "bg-success" : "bg-destructive",
                )}
              />
              <span className="text-xs text-muted-foreground">
                {health.web.linked ? "Linked" : "Not linked"}
              </span>
            </div>
            {health.web.authAgeMs !== null && (
              <p className="mt-1 text-[10px] font-mono text-muted-foreground">
                Auth age: {formatDuration(health.web.authAgeMs)}
              </p>
            )}
          </div>

          {/* Telegram */}
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-foreground">
                Telegram
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  health.telegram.configured
                    ? "bg-success"
                    : "bg-muted-foreground",
                )}
              />
              <span className="text-xs text-muted-foreground">
                {health.telegram.configured ? "Configured" : "Not configured"}
              </span>
            </div>
            {health.telegram.probe?.bot?.username && (
              <p className="mt-1 text-[10px] font-mono text-muted-foreground">
                @{health.telegram.probe.bot.username}
              </p>
            )}
          </div>

          {/* Sessions summary */}
          <div className="col-span-2 rounded-lg border border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">
                Sessions
              </span>
              <span className="text-lg font-bold font-mono text-foreground">
                {health.sessions.count}
              </span>
            </div>
            <p className="mt-1 text-[10px] font-mono text-muted-foreground">
              Heartbeat: {health.heartbeatSeconds}s
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          {state === "connected"
            ? "No health data available"
            : "Waiting for connection..."}
        </p>
      )}
    </div>
  );
}
