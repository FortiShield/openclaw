"use client";

import { useGateway } from "@/hooks/use-gateway";
import { useGatewayEvent } from "@/hooks/use-gateway-events";
import { useGatewayMethod } from "@/hooks/use-gateway-method";
import type { CronJob } from "@/lib/protocol-types";
import { cn, formatDuration, formatRelativeTime } from "@/lib/utils";
import {
  Calendar,
  Clock,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function formatSchedule(job: CronJob): string {
  const s = job.schedule;
  if (s.kind === "cron") return s.expr;
  if (s.kind === "every") return `every ${formatDuration(s.everyMs)}`;
  if (s.kind === "at") return `at ${new Date(s.atMs).toLocaleString()}`;
  return "unknown";
}

function formatPayload(job: CronJob): string {
  const p = job.payload;
  if (p.kind === "systemEvent") return `System: ${p.text}`;
  if (p.kind === "agentTurn") return `Agent: ${p.message.slice(0, 60)}...`;
  return "unknown";
}

export function CronTable({
  onViewRuns,
}: {
  onViewRuns: (jobId: string) => void;
}) {
  const { state, request } = useGateway();
  const { data, loading, call } = useGatewayMethod<CronJob[]>("cron.list");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (state === "connected") call({ includeDisabled: true });
  }, [state, call]);

  // Live updates
  useGatewayEvent("cron", () => call({ includeDisabled: true }));

  const handleToggle = useCallback(
    async (job: CronJob) => {
      setActionLoading(job.id);
      try {
        await request("cron.update", {
          id: job.id,
          patch: { enabled: !job.enabled },
        });
        call({ includeDisabled: true });
      } catch {
        // ignore
      } finally {
        setActionLoading(null);
      }
    },
    [request, call],
  );

  const handleRemove = useCallback(
    async (jobId: string) => {
      if (!confirm("Remove this cron job?")) return;
      setActionLoading(jobId);
      try {
        await request("cron.remove", { id: jobId });
        call({ includeDisabled: true });
      } catch {
        // ignore
      } finally {
        setActionLoading(null);
      }
    },
    [request, call],
  );

  const handleRun = useCallback(
    async (jobId: string) => {
      setActionLoading(jobId);
      try {
        await request("cron.run", { id: jobId, mode: "force" });
      } catch {
        // ignore
      } finally {
        setActionLoading(null);
      }
    },
    [request],
  );

  const jobs = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Cron Jobs
          </h3>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
            {jobs.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => call({ includeDisabled: true })}
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

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Name / ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Schedule
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Payload
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Next Run
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-foreground">
                      {job.name || "Unnamed"}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground truncate max-w-[150px]">
                      {job.id}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-foreground">
                      {formatSchedule(job)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground truncate block max-w-[200px]">
                      {formatPayload(job)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          job.enabled ? "bg-success" : "bg-muted-foreground",
                        )}
                      />
                      <span className="text-xs text-muted-foreground">
                        {job.enabled ? "Active" : "Paused"}
                      </span>
                    </div>
                    {job.state.lastStatus && (
                      <span
                        className={cn(
                          "text-[10px] font-mono",
                          job.state.lastStatus === "ok" && "text-success",
                          job.state.lastStatus === "error" && "text-destructive",
                          job.state.lastStatus === "skipped" &&
                            "text-muted-foreground",
                        )}
                      >
                        Last: {job.state.lastStatus}
                        {job.state.lastDurationMs
                          ? ` (${formatDuration(job.state.lastDurationMs)})`
                          : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {job.state.nextRunAtMs
                      ? formatRelativeTime(job.state.nextRunAtMs).replace(
                          " ago",
                          "",
                        )
                      : "--"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {actionLoading === job.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleToggle(job)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title={job.enabled ? "Pause" : "Resume"}
                          >
                            {job.enabled ? (
                              <Pause className="h-3.5 w-3.5" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRun(job.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title="Run now"
                          >
                            <Clock className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onViewRuns(job.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title="View run log"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(job.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-xs text-muted-foreground"
                  >
                    {loading ? "Loading cron jobs..." : "No cron jobs configured"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
