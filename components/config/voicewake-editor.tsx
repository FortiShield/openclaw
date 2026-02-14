"use client";

import { useGateway } from "@/hooks/use-gateway";
import { useGatewayEvent } from "@/hooks/use-gateway-events";
import { useGatewayMethod } from "@/hooks/use-gateway-method";
import type { VoiceWakeConfig } from "@/lib/protocol-types";
import { cn } from "@/lib/utils";
import { Loader2, Mic, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function VoiceWakeEditor() {
  const { state, request } = useGateway();
  const { data, loading, call } =
    useGatewayMethod<VoiceWakeConfig>("voicewake.get");
  const [triggers, setTriggers] = useState<string[]>([]);
  const [newTrigger, setNewTrigger] = useState("");
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (state === "connected") call();
  }, [state, call]);

  useEffect(() => {
    if (data?.triggers) {
      setTriggers(data.triggers);
      setIsDirty(false);
    }
  }, [data]);

  // Live sync
  useGatewayEvent("voicewake.changed", () => call());

  const handleAdd = () => {
    const trimmed = newTrigger.trim().toLowerCase();
    if (!trimmed || triggers.includes(trimmed)) return;
    setTriggers((prev) => [...prev, trimmed]);
    setNewTrigger("");
    setIsDirty(true);
  };

  const handleRemove = (trigger: string) => {
    setTriggers((prev) => prev.filter((t) => t !== trigger));
    setIsDirty(true);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await request("voicewake.set", { triggers });
      setIsDirty(false);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }, [triggers, request]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Voice Wake Triggers
          </h3>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
            isDirty
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-secondary text-muted-foreground",
          )}
        >
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Save className="h-3 w-3" />
          )}
          Save
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {triggers.map((trigger) => (
            <div
              key={trigger}
              className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1"
            >
              <span className="text-xs font-mono text-foreground">
                {trigger}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(trigger)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {triggers.length === 0 && (
            <p className="text-xs text-muted-foreground">No triggers set</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTrigger}
            onChange={(e) => setNewTrigger(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Add trigger word..."
            className="h-8 flex-1 rounded-md border border-border bg-background px-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newTrigger.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
