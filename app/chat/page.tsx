"use client";

import { ChatInput } from "@/components/chat/chat-input";
import {
  ChatMessages,
  type ChatMessage,
} from "@/components/chat/chat-messages";
import { useGateway } from "@/hooks/use-gateway";
import { useGatewayEvent } from "@/hooks/use-gateway-events";
import { useGatewayMethod } from "@/hooks/use-gateway-method";
import type {
  ChatEvent,
  SessionsListResult,
} from "@/lib/protocol-types";
import { generateId } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export default function ChatPage() {
  const { state, request } = useGateway();
  const { data: sessionsData, call: loadSessions } =
    useGatewayMethod<SessionsListResult>("sessions.list");

  const [selectedSession, setSelectedSession] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const currentRunIdRef = useRef<string | null>(null);

  // Load sessions on connect
  useEffect(() => {
    if (state === "connected") {
      loadSessions({ includeGlobal: true });
    }
  }, [state, loadSessions]);

  // Load chat history when session changes
  useEffect(() => {
    if (!selectedSession || state !== "connected") return;

    setLoadingHistory(true);
    request("chat.history", { sessionKey: selectedSession, limit: 100 })
      .then((result) => {
        const history = result as Array<{
          role: string;
          content: string;
          ts?: number;
        }>;
        if (Array.isArray(history)) {
          setMessages(
            history.map((h, i) => ({
              id: `hist-${i}`,
              role: (h.role === "user" ? "user" : "assistant") as "user" | "assistant",
              content: typeof h.content === "string" ? h.content : JSON.stringify(h.content),
              timestamp: h.ts,
            })),
          );
        }
      })
      .catch(() => {
        setMessages([]);
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, [selectedSession, state, request]);

  // Listen for chat events
  useGatewayEvent("chat", (payload) => {
    const evt = payload as ChatEvent;
    if (evt.sessionKey !== selectedSession) return;

    if (evt.state === "delta") {
      setStreaming(true);
      setMessages((prev) => {
        const existing = prev.find((m) => m.id === `stream-${evt.runId}`);
        if (existing) {
          return prev.map((m) =>
            m.id === `stream-${evt.runId}`
              ? {
                  ...m,
                  content:
                    m.content +
                    (typeof evt.message === "string"
                      ? evt.message
                      : ""),
                  streaming: true,
                }
              : m,
          );
        }
        return [
          ...prev,
          {
            id: `stream-${evt.runId}`,
            role: "assistant",
            content: typeof evt.message === "string" ? evt.message : "",
            streaming: true,
          },
        ];
      });
    }

    if (evt.state === "final" || evt.state === "aborted" || evt.state === "error") {
      setStreaming(false);
      currentRunIdRef.current = null;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === `stream-${evt.runId}`
            ? {
                ...m,
                streaming: false,
                content:
                  evt.state === "error"
                    ? m.content + `\n\n[Error: ${evt.errorMessage ?? "unknown"}]`
                    : evt.state === "final" && typeof evt.message === "string"
                      ? evt.message
                      : m.content,
              }
            : m,
        ),
      );
    }
  });

  const handleSend = useCallback(
    async (message: string) => {
      if (!selectedSession) return;

      const idempotencyKey = generateId();
      const userMsg: ChatMessage = {
        id: `user-${idempotencyKey}`,
        role: "user",
        content: message,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const result = await request(
          "chat.send",
          {
            sessionKey: selectedSession,
            message,
            idempotencyKey,
          },
          { expectFinal: true },
        );
        const res = result as { runId?: string };
        if (res?.runId) {
          currentRunIdRef.current = res.runId;
          setStreaming(true);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${idempotencyKey}`,
            role: "system",
            content: "Failed to send message",
          },
        ]);
      }
    },
    [selectedSession, request],
  );

  const handleAbort = useCallback(() => {
    if (currentRunIdRef.current && selectedSession) {
      request("chat.abort", {
        sessionKey: selectedSession,
        runId: currentRunIdRef.current,
      }).catch(() => {});
    }
  }, [selectedSession, request]);

  const sessions = sessionsData?.sessions ?? [];

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Session selector */}
      <div className="flex items-center gap-3 pb-4">
        <label
          htmlFor="session-select"
          className="text-sm font-medium text-foreground"
        >
          Session
        </label>
        <select
          id="session-select"
          value={selectedSession}
          onChange={(e) => {
            setSelectedSession(e.target.value);
            setMessages([]);
          }}
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Select a session...</option>
          {sessions.map((s) => (
            <option key={s.key} value={s.key}>
              {s.key} ({s.kind})
            </option>
          ))}
        </select>
        {loadingHistory && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        <ChatMessages messages={messages} />
        <ChatInput
          onSend={handleSend}
          onAbort={handleAbort}
          disabled={!selectedSession || state !== "connected"}
          streaming={streaming}
        />
      </div>
    </div>
  );
}
