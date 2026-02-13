"use client";

import { useGateway } from "@/hooks/use-gateway";
import { useGatewayEvent } from "@/hooks/use-gateway-events";
import { useGatewayMethod } from "@/hooks/use-gateway-method";
import type { NodePairRequestEntry, NodePairingList } from "@/lib/protocol-types";
import { formatRelativeTime } from "@/lib/utils";
import { Check, Loader2, Shield, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function PairRequests() {
  const { state, request } = useGateway();
  const { data, call } = useGatewayMethod<NodePairingList>("node.pair.list");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (state === "connected") call();
  }, [state, call]);

  // Live updates
  useGatewayEvent("node.pair.requested", () => call());
  useGatewayEvent("node.pair.resolved", () => call());

  const handleApprove = useCallback(
    async (requestId: string) => {
      setActionLoading(requestId);
      try {
        await request("node.pair.approve", { requestId });
        call();
      } catch {
        // ignore
      } finally {
        setActionLoading(null);
      }
    },
    [request, call],
  );

  const handleReject = useCallback(
    async (requestId: string) => {
      setActionLoading(requestId);
      try {
        await request("node.pair.reject", { requestId });
        call();
      } catch {
        // ignore
      } finally {
        setActionLoading(null);
      }
    },
    [request, call],
  );

  const pending = data?.pending ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">
          Pair Requests
        </h3>
        {pending.length > 0 && (
          <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-mono text-warning">
            {pending.length} pending
          </span>
        )}
      </div>

      {pending.length > 0 ? (
        <div className="space-y-2">
          {pending.map((req) => (
            <PairRequestRow
              key={req.requestId}
              req={req}
              loading={actionLoading === req.requestId}
              onApprove={() => handleApprove(req.requestId)}
              onReject={() => handleReject(req.requestId)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-xs text-muted-foreground">
            No pending pair requests
          </p>
        </div>
      )}
    </div>
  );
}

function PairRequestRow({
  req,
  loading,
  onApprove,
  onReject,
}: {
  req: NodePairRequestEntry;
  loading: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-card p-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {req.displayName ?? req.nodeId}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {req.platform && (
            <span className="text-[10px] font-mono text-muted-foreground">
              {req.platform}
            </span>
          )}
          {req.remoteIp && (
            <span className="text-[10px] font-mono text-muted-foreground">
              {req.remoteIp}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">
            {formatRelativeTime(req.ts)}
          </span>
        </div>
      </div>

      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onApprove}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors"
            aria-label="Approve"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onReject}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
            aria-label="Reject"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
