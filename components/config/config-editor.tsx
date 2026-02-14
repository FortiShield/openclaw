"use client";

import { useGateway } from "@/hooks/use-gateway";
import { useGatewayMethod } from "@/hooks/use-gateway-method";
import type { ConfigGetResult } from "@/lib/protocol-types";
import { cn } from "@/lib/utils";
import { Check, FileCode, Loader2, RefreshCw, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function ConfigEditor() {
  const { state, request } = useGateway();
  const { data, loading, call } =
    useGatewayMethod<ConfigGetResult>("config.get");
  const [editorValue, setEditorValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (state === "connected") call();
  }, [state, call]);

  useEffect(() => {
    if (data?.raw != null) {
      setEditorValue(data.raw);
      setIsDirty(false);
    }
  }, [data?.raw]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveResult(null);
    try {
      await request("config.set", { raw: editorValue });
      setSaveResult({ ok: true, message: "Config saved successfully" });
      setIsDirty(false);
    } catch (err) {
      setSaveResult({
        ok: false,
        message: err instanceof Error ? err.message : "Save failed",
      });
    } finally {
      setSaving(false);
    }
  }, [editorValue, request]);

  const handleRefresh = useCallback(() => {
    call();
    setSaveResult(null);
  }, [call]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Gateway Configuration
          </h3>
          {data?.path && (
            <span className="text-[10px] font-mono text-muted-foreground">
              {data.path}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
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
            Reload
          </button>
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
      </div>

      {/* Save result banner */}
      {saveResult && (
        <div
          className={cn(
            "rounded-lg px-4 py-2.5 text-xs font-medium",
            saveResult.ok
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {saveResult.ok && <Check className="mr-1.5 inline h-3 w-3" />}
          {saveResult.message}
        </div>
      )}

      {/* Editor */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <textarea
          value={editorValue}
          onChange={(e) => {
            setEditorValue(e.target.value);
            setIsDirty(true);
            setSaveResult(null);
          }}
          spellCheck={false}
          className="w-full min-h-[400px] bg-transparent p-4 text-sm font-mono text-foreground leading-relaxed focus:outline-none resize-y"
          placeholder="Loading configuration..."
        />
      </div>
    </div>
  );
}
