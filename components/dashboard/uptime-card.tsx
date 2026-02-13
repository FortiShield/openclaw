"use client";

import { useGateway } from "@/hooks/use-gateway";
import { formatDuration } from "@/lib/utils";
import { Clock, Server } from "lucide-react";

export function UptimeCard() {
  const { serverInfo, snapshot } = useGateway();

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Server className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Server Info
        </h3>
      </div>

      <div className="mt-4 space-y-3">
        {/* Uptime */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Uptime</span>
          </div>
          <span className="text-sm font-mono font-medium text-foreground">
            {snapshot?.uptimeMs
              ? formatDuration(snapshot.uptimeMs)
              : "--"}
          </span>
        </div>

        {/* Version */}
        {serverInfo && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Version</span>
              <span className="text-xs font-mono text-foreground">
                {serverInfo.version}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Conn ID</span>
              <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[150px]">
                {serverInfo.connId}
              </span>
            </div>
            {serverInfo.host && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Host</span>
                <span className="text-xs font-mono text-foreground">
                  {serverInfo.host}
                </span>
              </div>
            )}
            {serverInfo.commit && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Commit</span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {serverInfo.commit.slice(0, 8)}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
