"use client";

import { useGateway } from "@/hooks/use-gateway";
import { useGatewayMethod } from "@/hooks/use-gateway-method";
import type {
  GatewaySessionRow,
  SessionsListResult,
} from "@/lib/protocol-types";
import { cn, formatRelativeTime, formatTokens } from "@/lib/utils";
import { Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SessionPatch } from "./session-patch";

type SortField = "updatedAt" | "key" | "totalTokens";
type SortDir = "asc" | "desc";

export function SessionTable() {
  const { state } = useGateway();
  const { data, loading, call } =
    useGatewayMethod<SessionsListResult>("sessions.list");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    if (state === "connected") {
      call({ includeGlobal: true, includeUnknown: true });
    }
  }, [state, call]);

  const handleRefresh = useCallback(() => {
    call({ includeGlobal: true, includeUnknown: true });
  }, [call]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sessions = (data?.sessions ?? [])
    .filter((s) => kindFilter === "all" || s.kind === kindFilter)
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "updatedAt") {
        return ((a.updatedAt ?? 0) - (b.updatedAt ?? 0)) * dir;
      }
      if (sortField === "totalTokens") {
        return ((a.totalTokens ?? 0) - (b.totalTokens ?? 0)) * dir;
      }
      return a.key.localeCompare(b.key) * dir;
    });

  const kindCounts = (data?.sessions ?? []).reduce(
    (acc, s) => {
      acc[s.kind] = (acc[s.kind] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {["all", "direct", "group", "global"].map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setKindFilter(kind)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                kindFilter === kind
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {kind === "all" ? "All" : kind.charAt(0).toUpperCase() + kind.slice(1)}
              {kind === "all" ? ` (${data?.count ?? 0})` : kindCounts[kind] ? ` (${kindCounts[kind]})` : ""}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleRefresh}
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

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                  onClick={() => toggleSort("key")}
                >
                  Session Key
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Kind
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                  onClick={() => toggleSort("updatedAt")}
                >
                  Updated
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Thinking
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Verbose
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-right text-xs font-medium text-muted-foreground"
                  onClick={() => toggleSort("totalTokens")}
                >
                  Tokens (in/out)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Model
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <SessionRow
                  key={session.key}
                  session={session}
                  onPatched={handleRefresh}
                />
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-xs text-muted-foreground"
                  >
                    {loading ? "Loading sessions..." : "No sessions found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Defaults */}
      {data?.defaults && (
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <span>
            Default model: {data.defaults.model ?? "n/a"}
          </span>
          <span>
            Context tokens: {data.defaults.contextTokens ?? "n/a"}
          </span>
        </div>
      )}
    </div>
  );
}

function SessionRow({
  session,
  onPatched,
}: {
  session: GatewaySessionRow;
  onPatched: () => void;
}) {
  const kindColors: Record<string, string> = {
    direct: "bg-success/20 text-success",
    group: "bg-primary/20 text-primary",
    global: "bg-warning/20 text-warning",
    unknown: "bg-muted text-muted-foreground",
  };

  return (
    <tr className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
      <td className="px-4 py-3">
        <span className="text-xs font-mono text-foreground truncate block max-w-[200px]">
          {session.key}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            kindColors[session.kind] ?? kindColors.unknown,
          )}
        >
          {session.kind}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {session.updatedAt ? formatRelativeTime(session.updatedAt) : "--"}
      </td>
      <td className="px-4 py-3">
        <SessionPatch
          sessionKey={session.key}
          field="thinkingLevel"
          value={session.thinkingLevel ?? null}
          onPatched={onPatched}
        />
      </td>
      <td className="px-4 py-3">
        <SessionPatch
          sessionKey={session.key}
          field="verboseLevel"
          value={session.verboseLevel ?? null}
          onPatched={onPatched}
        />
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-xs font-mono text-foreground">
          {formatTokens(session.inputTokens)}/{formatTokens(session.outputTokens)}
        </span>
        {session.totalTokens !== undefined && session.totalTokens > 0 && (
          <div className="mt-1 h-1 w-full max-w-[80px] rounded-full bg-secondary ml-auto overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${Math.min(
                  ((session.totalTokens ?? 0) /
                    (session.contextTokens ?? 200000)) *
                    100,
                  100,
                )}%`,
              }}
            />
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="text-[10px] font-mono text-muted-foreground">
          {session.model ?? "--"}
        </span>
      </td>
    </tr>
  );
}
