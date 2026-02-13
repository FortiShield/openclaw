/**
 * Browser-native WebSocket client for the CLAWDIS gateway.
 * Mirrors the Node.js GatewayClient (src/gateway/client.ts) but uses the
 * browser WebSocket API instead of the `ws` package.
 */

import type {
  ConnectParams,
  EventFrame,
  HelloOk,
  RequestFrame,
  ResponseFrame,
  Snapshot,
} from "./protocol-types";
import { PROTOCOL_VERSION } from "./protocol-types";

type Pending = {
  resolve: (value: unknown) => void;
  reject: (err: unknown) => void;
  expectFinal: boolean;
};

export type ConnectionState = "disconnected" | "connecting" | "connected";

export type GatewayClientEvents = {
  stateChange: (state: ConnectionState) => void;
  event: (evt: EventFrame) => void;
  helloOk: (hello: HelloOk) => void;
  error: (err: Error) => void;
};

export class BrowserGatewayClient {
  private ws: WebSocket | null = null;
  private pending = new Map<string, Pending>();
  private backoffMs = 1000;
  private closed = false;
  private lastSeq: number | null = null;
  private lastTick: number | null = null;
  private tickIntervalMs = 30_000;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private _state: ConnectionState = "disconnected";
  private listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  // Public read-only state
  public helloOk: HelloOk | null = null;
  public snapshot: Snapshot | null = null;

  constructor(
    private url: string,
    private token?: string,
  ) {}

  get state(): ConnectionState {
    return this._state;
  }

  private setState(state: ConnectionState) {
    this._state = state;
    this.emit("stateChange", state);
  }

  // -----------------------------------------------------------------------
  // Event emitter
  // -----------------------------------------------------------------------

  on<K extends keyof GatewayClientEvents>(
    event: K,
    fn: GatewayClientEvents[K],
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    const wrapped = fn as (...args: unknown[]) => void;
    set.add(wrapped);
    return () => {
      set.delete(wrapped);
    };
  }

  private emit(event: string, ...args: unknown[]) {
    const set = this.listeners.get(event);
    if (set) {
      for (const fn of set) fn(...args);
    }
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  start() {
    if (this.closed) return;
    this.setState("connecting");

    try {
      this.ws = new WebSocket(this.url);
    } catch (err) {
      this.emit("error", new Error(`WebSocket creation failed: ${err}`));
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.sendConnect();
    };

    this.ws.onmessage = (evt) => {
      this.handleMessage(
        typeof evt.data === "string" ? evt.data : String(evt.data),
      );
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.flushPendingErrors(new Error("gateway connection closed"));
      this.setState("disconnected");
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.emit("error", new Error("WebSocket error"));
    };
  }

  stop() {
    this.closed = true;
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.flushPendingErrors(new Error("gateway client stopped"));
    this.setState("disconnected");
  }

  // -----------------------------------------------------------------------
  // Connection handshake
  // -----------------------------------------------------------------------

  private sendConnect() {
    const params: ConnectParams = {
      minProtocol: PROTOCOL_VERSION,
      maxProtocol: PROTOCOL_VERSION,
      client: {
        name: "clawdis-dashboard",
        version: "1.0.0",
        platform: "web",
        mode: "dashboard",
      },
      caps: [],
      auth: this.token ? { token: this.token } : undefined,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };

    this.request<HelloOk>("connect", params)
      .then((hello) => {
        this.helloOk = hello;
        this.snapshot = hello.snapshot;
        this.backoffMs = 1000;
        this.tickIntervalMs =
          typeof hello.policy?.tickIntervalMs === "number"
            ? hello.policy.tickIntervalMs
            : 30_000;
        this.lastTick = Date.now();
        this.startTickWatch();
        this.setState("connected");
        this.emit("helloOk", hello);
      })
      .catch((err) => {
        this.emit("error", new Error(`gateway connect failed: ${err}`));
        this.ws?.close(1008, "connect failed");
      });
  }

  // -----------------------------------------------------------------------
  // Message handling
  // -----------------------------------------------------------------------

  private handleMessage(raw: string) {
    try {
      const parsed = JSON.parse(raw);

      if (parsed?.type === "event") {
        const evt = parsed as EventFrame;
        const seq = typeof evt.seq === "number" ? evt.seq : null;
        if (seq !== null) {
          this.lastSeq = seq;
        }
        if (evt.event === "tick") {
          this.lastTick = Date.now();
        }
        this.emit("event", evt);
        return;
      }

      if (parsed?.type === "res") {
        const res = parsed as ResponseFrame;
        const pending = this.pending.get(res.id);
        if (!pending) return;

        // Handle ack with status accepted -- keep waiting for final
        const status = (res.payload as Record<string, unknown>)?.status;
        if (pending.expectFinal && status === "accepted") {
          return;
        }

        this.pending.delete(res.id);
        if (res.ok) {
          pending.resolve(res.payload);
        } else {
          pending.reject(
            new Error(res.error?.message ?? "unknown gateway error"),
          );
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  // -----------------------------------------------------------------------
  // Request/response
  // -----------------------------------------------------------------------

  async request<T = unknown>(
    method: string,
    params?: unknown,
    opts?: { expectFinal?: boolean },
  ): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("gateway not connected");
    }
    const id = crypto.randomUUID();
    const frame: RequestFrame = { type: "req", id, method, params };
    const expectFinal = opts?.expectFinal === true;

    const promise = new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: (value) => resolve(value as T),
        reject,
        expectFinal,
      });
    });

    this.ws.send(JSON.stringify(frame));
    return promise;
  }

  // -----------------------------------------------------------------------
  // Reconnection
  // -----------------------------------------------------------------------

  private scheduleReconnect() {
    if (this.closed) return;
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    const delay = this.backoffMs;
    this.backoffMs = Math.min(this.backoffMs * 2, 30_000);
    this.reconnectTimer = setTimeout(() => this.start(), delay);
  }

  private flushPendingErrors(err: Error) {
    for (const [, p] of this.pending) {
      p.reject(err);
    }
    this.pending.clear();
  }

  // -----------------------------------------------------------------------
  // Tick / Liveness
  // -----------------------------------------------------------------------

  private startTickWatch() {
    if (this.tickTimer) clearInterval(this.tickTimer);
    const interval = Math.max(this.tickIntervalMs, 1000);
    this.tickTimer = setInterval(() => {
      if (this.closed) return;
      if (!this.lastTick) return;
      const gap = Date.now() - this.lastTick;
      if (gap > this.tickIntervalMs * 2) {
        this.ws?.close(4000, "tick timeout");
      }
    }, interval);
  }
}
