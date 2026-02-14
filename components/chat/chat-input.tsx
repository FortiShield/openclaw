"use client";

import { cn } from "@/lib/utils";
import { Loader2, Send, Square } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onAbort: () => void;
  disabled?: boolean;
  streaming?: boolean;
}

export function ChatInput({
  onSend,
  onAbort,
  disabled,
  streaming,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="border-t border-border bg-card p-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        />
        {streaming ? (
          <button
            type="button"
            onClick={onAbort}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            <Square className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
              input.trim() && !disabled
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-secondary text-muted-foreground",
            )}
          >
            {disabled ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        )}
      </form>
    </div>
  );
}
