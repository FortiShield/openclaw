"use client";

import { useGateway } from "@/hooks/use-gateway";
import { useGatewayMethod } from "@/hooks/use-gateway-method";
import type { NodePairedEntry, NodePairingList } from "@/lib/protocol-types";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Loader2, Monitor, RefreshCw, Smartphone, Laptop } from "lucide-react";
import { useEffect } from "react";

function getPlatformIcon(platform?: string) {
  const p = (platform ?? "").toLowerCase();
  if (p.includes("ios") || p.includes("iphone") || p.includes("ipad"))
    return Smartphone;
  if (p.includes("mac") || p.includes("darwin")) return Laptop;
  return Monitor;
}

export function NodeList() {
  const { state } = useGateway();
  const { data, loading, call } =
    useGatewayMethod<NodePairingList>("node.pair.list");

  useEffect(() => {
    if (state === "connected") call();
  }, [state, call]);

  const paired = data?.paired ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Paired Nodes
        </h3>
        <button
          type="button"
          onClick={() => call()}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Refresh
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {paired.map((node) => (
          <NodeCard key={node.nodeId} node={node} />
        ))}
        {paired.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground col-span-2 text-center py-8">
            No paired nodes
          </p>
        )}
      </div>
    </div>
  );
}

function NodeCard({ node }: { node: NodePairedEntry }) {
  const Icon = getPlatformIcon(node.platform);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {node.displayName ?? node.nodeId}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground truncate">
            {node.nodeId}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {node.platform && (
          <div>
            <span className="text-[10px] text-muted-foreground">Platform</span>
            <p className="text-xs font-mono text-foreground">{node.platform}</p>
          </div>
        )}
        {node.version && (
          <div>
            <span className="text-[10px] text-muted-foreground">Version</span>
            <p className="text-xs font-mono text-foreground">{node.version}</p>
          </div>
        )}
        {node.deviceFamily && (
          <div>
            <span className="text-[10px] text-muted-foreground">Device</span>
            <p className="text-xs font-mono text-foreground">
              {node.deviceFamily}
            </p>
          </div>
        )}
        <div>
          <span className="text-[10px] text-muted-foreground">Approved</span>
          <p className="text-xs font-mono text-foreground">
            {formatRelativeTime(node.approvedAtMs)}
          </p>
        </div>
      </div>

      {node.caps && node.caps.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {node.caps.map((cap) => (
            <span
              key={cap}
              className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground"
            >
              {cap}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
