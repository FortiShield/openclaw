"use client";

import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { useEffect, useRef } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
  streaming?: boolean;
}

export function ChatMessages({ messages }: { messages: ChatMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <Bot className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            No messages yet. Select a session and start chatting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "flex gap-3",
            msg.role === "user" ? "justify-end" : "justify-start",
          )}
        >
          {msg.role !== "user" && (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary">
              <Bot className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
          )}
          <div
            className={cn(
              "max-w-[75%] rounded-xl px-4 py-2.5",
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground",
              msg.role === "system" && "bg-warning/10 text-warning",
            )}
          >
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {msg.content}
              {msg.streaming && (
                <span className="inline-block w-2 h-4 ml-0.5 bg-foreground/70 animate-pulse" />
              )}
            </p>
          </div>
          {msg.role === "user" && (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
