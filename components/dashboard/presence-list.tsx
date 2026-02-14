"use client";

import { useGateway } from "@/hooks/use-gateway";
import type { PresenceEntry } from "@/lib/protocol-types";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Monitor, Smartphone, Globe, Laptop } from "lucide-react";

function getPlatformIcon(platform?: string) {
  if (!platform) return Globe;
  const p = platform.toLowerCase();
  if (p.includes("ios") || p.includes("iphone") || p.includes("ipad"))
    return Smartphone;
  if (p.includes("mac") || p.includes("darwin")) return Laptop;
  return Monitor;
}

function PresenceRow({ entry }: { entry: PresenceEntry }) {
  const Icon = getPlatformIcon(entry.platform);
  const isRecent =
    entry.lastInputSeconds !== undefined && entry.lastInputSeconds < 300;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground truncate">
            {entry.host ?? entry.platform ?? "Unknown"}
          </span>
          {entry.mode && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              {entry.mode}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {entry.version && (
            <span className="text-[10px] font-mono text-muted-foreground">
              v{entry.version}
            </span>
          )}
          {entry.deviceFamily && (
            <span className="text-[10px] text-muted-foreground">
              {entry.deviceFamily}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            isRecent ? "bg-success animate-pulse-live" : "bg-muted-foreground",
          )}
        />
        <span className="text-[10px] font-mono text-muted-foreground">
          {formatRelativeTime(entry.ts)}
        </span>
      </div>
    </div>
  );
}

export function PresenceList() {
  const { snapshot } = useGateway();
  const presence = snapshot?.presence ?? [];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          System Presence
        </h3>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
          {presence.length} {presence.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {presence.length > 0 ? (
          presence.map((entry, i) => (
            <PresenceRow key={entry.instanceId ?? `p-${i}`} entry={entry} />
          ))
        ) : (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No presence entries
          </p>
        )}
      </div>
    </div>
  );
}
