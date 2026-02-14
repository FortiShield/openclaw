"use client";

import { useGateway } from "@/hooks/use-gateway";
import { cn } from "@/lib/utils";
import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";

const THINKING_OPTIONS = [null, "none", "low", "medium", "high"];
const VERBOSE_OPTIONS = [null, "off", "low", "medium", "high"];

interface SessionPatchProps {
  sessionKey: string;
  field: "thinkingLevel" | "verboseLevel";
  value: string | null;
  onPatched: () => void;
}

export function SessionPatch({
  sessionKey,
  field,
  value,
  onPatched,
}: SessionPatchProps) {
  const { request } = useGateway();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const options = field === "thinkingLevel" ? THINKING_OPTIONS : VERBOSE_OPTIONS;

  const handleChange = async (newValue: string | null) => {
    setSaving(true);
    try {
      await request("sessions.patch", {
        key: sessionKey,
        [field]: newValue,
      });
      onPatched();
    } catch {
      // ignore
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (saving) {
    return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <select
          defaultValue={value ?? ""}
          onChange={(e) => {
            const v = e.target.value === "" ? null : e.target.value;
            handleChange(v);
          }}
          className="h-6 rounded border border-border bg-background px-1 text-[10px] font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {options.map((opt) => (
            <option key={opt ?? "default"} value={opt ?? ""}>
              {opt ?? "default"}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "rounded px-2 py-0.5 text-[10px] font-mono transition-colors",
        value
          ? "bg-secondary text-foreground hover:bg-accent"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {value ?? "default"}
    </button>
  );
}
