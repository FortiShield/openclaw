/**
 * Browser-safe TypeScript types matching the CLAWDIS gateway protocol schema.
 * These are pure interfaces -- no TypeBox dependency needed in the browser.
 */

export const PROTOCOL_VERSION = 2;

// ---------------------------------------------------------------------------
// Frames
// ---------------------------------------------------------------------------

export interface RequestFrame {
  type: "req";
  id: string;
  method: string;
  params?: unknown;
}

export interface ResponseFrame {
  type: "res";
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: ErrorShape;
}

export interface EventFrame {
  type: "event";
  event: string;
  payload?: unknown;
  seq?: number;
  stateVersion?: StateVersion;
}

export type GatewayFrame = RequestFrame | ResponseFrame | EventFrame;

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

export interface ConnectParams {
  minProtocol: number;
  maxProtocol: number;
  client: {
    name: string;
    version: string;
    platform: string;
    deviceFamily?: string;
    modelIdentifier?: string;
    mode: string;
    instanceId?: string;
  };
  caps?: string[];
  auth?: { token?: string };
  locale?: string;
  userAgent?: string;
}

export interface HelloOk {
  type: "hello-ok";
  protocol: number;
  server: {
    version: string;
    commit?: string;
    host?: string;
    connId: string;
  };
  features: {
    methods: string[];
    events: string[];
  };
  snapshot: Snapshot;
  policy: {
    maxPayload: number;
    maxBufferedBytes: number;
    tickIntervalMs: number;
  };
}

// ---------------------------------------------------------------------------
// Snapshot & State
// ---------------------------------------------------------------------------

export interface PresenceEntry {
  host?: string;
  ip?: string;
  version?: string;
  platform?: string;
  deviceFamily?: string;
  modelIdentifier?: string;
  mode?: string;
  lastInputSeconds?: number;
  reason?: string;
  tags?: string[];
  text?: string;
  ts: number;
  instanceId?: string;
}

export interface StateVersion {
  presence: number;
  health: number;
}

export interface Snapshot {
  presence: PresenceEntry[];
  health: unknown;
  stateVersion: StateVersion;
  uptimeMs: number;
}

export interface ErrorShape {
  code: string;
  message: string;
  details?: unknown;
  retryable?: boolean;
  retryAfterMs?: number;
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export interface HealthSummary {
  ok: true;
  ts: number;
  durationMs: number;
  web: {
    linked: boolean;
    authAgeMs: number | null;
    connect?: {
      ok: boolean;
      status?: number | null;
      error?: string | null;
      elapsedMs?: number | null;
    };
  };
  telegram: {
    configured: boolean;
    probe?: {
      ok: boolean;
      status?: number | null;
      error?: string | null;
      elapsedMs: number;
      bot?: { id?: number | null; username?: string | null };
      webhook?: { url?: string | null; hasCustomCert?: boolean | null };
    };
  };
  heartbeatSeconds: number;
  sessions: {
    path: string;
    count: number;
    recent: Array<{
      key: string;
      updatedAt: number | null;
      age: number | null;
    }>;
  };
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export interface GatewaySessionRow {
  key: string;
  kind: "direct" | "group" | "global" | "unknown";
  updatedAt: number | null;
  sessionId?: string;
  systemSent?: boolean;
  abortedLastRun?: boolean;
  thinkingLevel?: string;
  verboseLevel?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  model?: string;
  contextTokens?: number;
  syncing?: boolean | string;
}

export interface SessionsListResult {
  ts: number;
  path: string;
  count: number;
  defaults: {
    model: string | null;
    contextTokens: number | null;
  };
  sessions: GatewaySessionRow[];
}

export interface SessionsPatchParams {
  key: string;
  thinkingLevel?: string | null;
  verboseLevel?: string | null;
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export interface ChatHistoryParams {
  sessionKey: string;
  limit?: number;
}

export interface ChatSendParams {
  sessionKey: string;
  message: string;
  thinking?: string;
  deliver?: boolean;
  attachments?: unknown[];
  timeoutMs?: number;
  idempotencyKey: string;
}

export interface ChatAbortParams {
  sessionKey: string;
  runId: string;
}

export interface ChatEvent {
  runId: string;
  sessionKey: string;
  seq: number;
  state: "delta" | "final" | "aborted" | "error";
  message?: unknown;
  errorMessage?: string;
  usage?: unknown;
  stopReason?: string;
}

// ---------------------------------------------------------------------------
// Nodes
// ---------------------------------------------------------------------------

export interface NodePairRequestEntry {
  requestId: string;
  nodeId: string;
  displayName?: string;
  platform?: string;
  version?: string;
  deviceFamily?: string;
  modelIdentifier?: string;
  caps?: string[];
  commands?: string[];
  remoteIp?: string;
  ts: number;
}

export interface NodePairedEntry {
  nodeId: string;
  displayName?: string;
  platform?: string;
  version?: string;
  deviceFamily?: string;
  modelIdentifier?: string;
  caps?: string[];
  commands?: string[];
  remoteIp?: string;
  createdAtMs: number;
  approvedAtMs: number;
}

export interface NodePairingList {
  pending: NodePairRequestEntry[];
  paired: NodePairedEntry[];
}

export interface NodeDescribeResult {
  nodeId: string;
  displayName?: string;
  platform?: string;
  version?: string;
  deviceFamily?: string;
  modelIdentifier?: string;
  caps?: string[];
  commands?: string[];
}

// ---------------------------------------------------------------------------
// Cron
// ---------------------------------------------------------------------------

export type CronSchedule =
  | { kind: "at"; atMs: number }
  | { kind: "every"; everyMs: number; anchorMs?: number }
  | { kind: "cron"; expr: string; tz?: string };

export type CronPayload =
  | { kind: "systemEvent"; text: string }
  | {
      kind: "agentTurn";
      message: string;
      thinking?: string;
      timeoutSeconds?: number;
      deliver?: boolean;
      channel?: "last" | "whatsapp" | "telegram";
      to?: string;
      bestEffortDeliver?: boolean;
    };

export interface CronJobState {
  nextRunAtMs?: number;
  runningAtMs?: number;
  lastRunAtMs?: number;
  lastStatus?: "ok" | "error" | "skipped";
  lastError?: string;
  lastDurationMs?: number;
}

export interface CronJob {
  id: string;
  name?: string;
  enabled: boolean;
  createdAtMs: number;
  updatedAtMs: number;
  schedule: CronSchedule;
  sessionTarget: "main" | "isolated";
  wakeMode: "next-heartbeat" | "now";
  payload: CronPayload;
  isolation?: { postToMainPrefix?: string };
  state: CronJobState;
}

export interface CronRunLogEntry {
  ts: number;
  jobId: string;
  action: "finished";
  status?: "ok" | "error" | "skipped";
  error?: string;
  summary?: string;
  runAtMs?: number;
  durationMs?: number;
  nextRunAtMs?: number;
}

export interface CronAddParams {
  name?: string;
  enabled?: boolean;
  schedule: CronSchedule;
  sessionTarget: "main" | "isolated";
  wakeMode: "next-heartbeat" | "now";
  payload: CronPayload;
  isolation?: { postToMainPrefix?: string };
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface ConfigGetResult {
  raw: string;
  path: string;
}

export interface VoiceWakeConfig {
  triggers: string[];
  updatedAtMs: number;
}
