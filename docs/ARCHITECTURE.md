# CLAWDIS Dashboard Architecture

## System Overview

The CLAWDIS Dashboard is a real-time admin interface for managing WhatsApp/Telegram gateways with AI agent integration. It communicates with the backend gateway server via WebSocket using a custom RPC protocol.

```
┌─────────────────────┐
│  CLAWDIS Dashboard  │
│  (Next.js 15 App)   │
└──────────┬──────────┘
           │ WebSocket RPC
           │
┌──────────▼──────────┐
│ CLAWDIS Gateway     │
│ (TypeScript/Node)   │
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    │           │
┌───▼──┐   ┌───▼──┐
│WhatsApp   │Telegram
│(Baileys)  │(Grammy)
└──────┘   └───────┘
```

## Architectural Layers

### 1. Presentation Layer (UI Components)

**Location**: `components/` and `app/`

Components are organized by feature area:

```
components/
├── dashboard/          # Main dashboard widgets
│   ├── health-card.tsx    # Gateway health status
│   ├── uptime-card.tsx    # Uptime metrics
│   └── presence-list.tsx  # Active presence list
├── chat/              # Chat management
│   ├── chat-messages.tsx  # Message display
│   └── chat-input.tsx     # Message input
├── sessions/          # Session management
│   ├── session-table.tsx  # Session list
│   └── session-patch.tsx  # Patch operations
├── config/            # Configuration
│   ├── config-editor.tsx  # Config UI
│   └── voicewake-editor.tsx # Voice settings
├── nodes/             # Node management
│   ├── node-list.tsx      # Node list
│   └── pair-requests.tsx  # Pairing UI
├── gateway-provider.tsx    # Gateway context provider
├── connection-status.tsx   # Connection indicator
└── sidebar.tsx            # Navigation sidebar
```

#### Design System

- **Color System**: 5-color palette with OKLCH color space
  - Primary: Orange/amber (#d97706)
  - Secondary: Dark gray
  - Muted: Mid gray
  - Destructive: Red
  - Success/Warning: Green/Yellow

- **Typography**: 2 font families
  - Headings: Inter
  - Monospace: JetBrains Mono

- **Layout**: Flexbox-first with TailwindCSS v4
  - Responsive grid system
  - Component-based spacing
  - Dark theme by default

### 2. Data Management Layer

**Location**: `hooks/`, `lib/`, `components/gateway-provider.tsx`

#### Gateway Context (`GatewayProvider`)

The central connection manager that:
- Maintains WebSocket connection to gateway
- Handles RPC request/response flow
- Manages event subscriptions
- Tracks connection state

```typescript
interface GatewayContextValue {
  state: "disconnected" | "connecting" | "connected";
  serverInfo: ServerInfo | null;
  snapshot: Snapshot | null;
  request<T>(method: string, params?: any): Promise<T>;
  subscribe(event: string, handler: (payload: any) => void): () => void;
}
```

#### Custom Hooks

**`useGateway()`** - Access connection state and raw request capability
```typescript
const { state, serverInfo, request } = useGateway();
```

**`useGatewayMethod()`** - Call RPC methods with loading/error states
```typescript
const { data, loading, error, call } = useGatewayMethod("health");
```

**`useGatewayEvent()`** - Subscribe to real-time events
```typescript
useGatewayEvent("presence", (data) => updatePresence(data));
```

**`useWebSocket()`** - Low-level WebSocket management
```typescript
const { connected, send, close } = useWebSocket(url, onMessage);
```

### 3. Communication Layer

**Location**: `lib/api.ts`, `lib/gateway-client.ts`

#### API Client (`lib/api.ts`)

Provides typed HTTP client methods:
- `apiGet<T>(path: string): Promise<T>`
- `apiPost<T>(path: string, body?: any): Promise<T>`
- `apiPut<T>(path: string, body?: any): Promise<T>`
- `apiDelete<T>(path: string): Promise<T>`

Features:
- Automatic JSON serialization
- Request timeout (30s default)
- Error handling with ApiError
- Type-safe responses

#### Gateway Client (`lib/gateway-client.ts`)

Custom WebSocket RPC client:
- Request/Response matching via message IDs
- Event frame routing
- Automatic reconnection
- Connection state management

### 4. Utility Layer

**Location**: `lib/`

#### Environment (`lib/env.ts`)
```typescript
export const env = {
  nodeEnv: "production" | "development",
  gatewayBaseUrl: string,
  gatewayWebSocketUrl: string,
  twilioAccountSid?: string,
  // ... more
};

validateEnv(): void  // Validate at startup
```

#### Rate Limiting (`lib/rate-limit.ts`)
```typescript
const limiter = new RateLimiter(requestsPerWindow, windowMs);
limiter.isAllowed(key: string): boolean
limiter.getRemaining(key: string): number

// Or use convenience functions
createRateLimitedFunction<T, R>(fn, key): (...args) => R | null
createRateLimitedAsyncFunction<T, R>(fn, key): (...args) => Promise<R | null>
```

#### Web Vitals (`lib/web-vitals.ts`)
```typescript
initWebVitals(): void  // Initialize Core Web Vitals tracking
reportWebVitals(metric: any): void  // Send metrics to endpoint
```

### 5. Server Layer

**Location**: `middleware.ts`, `app/api/`

#### Middleware (`middleware.ts`)

Applies security headers to all requests:
- CSP (Content Security Policy)
- XSS Protection
- Frameguard (X-Frame-Options)
- MIME type protection

#### API Routes

**`POST /api/metrics`** - Collect Web Vitals from clients
- Receives performance metrics
- Logs in development
- Can be extended to send to analytics service

## Data Flow

### Real-Time Updates

```
Gateway Server
    ↓ (Event)
WebSocket Connection
    ↓
EventFrame Parser
    ↓
Event Subscribers (hooks)
    ↓
Component State Updates
    ↓
UI Re-render
```

### RPC Calls

```
Component
    ↓ call useGatewayMethod("method")
    ↓
GatewayProvider.request()
    ↓
GatewayClient.request()
    ↓ (send RequestFrame via WebSocket)
    ↓
Gateway Server processes request
    ↓ (send ResponseFrame via WebSocket)
    ↓
Match response ID to pending request
    ↓
Return Promise<T>
    ↓
Component updates state
    ↓
UI re-renders
```

## Type System

### Protocol Types (`lib/protocol-types.ts`)

Defines all gateway protocol types:
- `RequestFrame` - RPC request
- `ResponseFrame` - RPC response
- `EventFrame` - Real-time event
- `HealthSummary` - Gateway health status
- `Snapshot` - Full state snapshot
- `Presence` - User presence data
- `Session` - Session information

### Component Props

All components use TypeScript strict mode with:
- Required prop types
- Generic type parameters for data
- Union types for states (loading | error | success)

## Performance Optimizations

### Bundle Size
- Tree-shaking for Radix UI components
- Optimized imports for lucide-react
- Lazy loading for route components

### Runtime Performance
- Memoization of gateway callbacks
- Debouncing of frequent events
- Rate limiting of API calls
- Virtual scrolling for large lists

### Network Performance
- WebSocket connection reuse
- Batch event processing
- Automatic reconnection with exponential backoff
- Message compression (if enabled)

## Error Handling

### Client-Side Errors

```typescript
// In components
try {
  const data = await request("method");
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error: ${error.code} - ${error.message}`);
  }
}
```

### Network Errors

WebSocket automatically:
- Detects connection loss
- Attempts reconnection
- Notifies components via state change
- Provides error callbacks

### Component Errors

Global error boundary catches:
- Render errors
- Event handler errors
- Hook errors

## Security Architecture

### Authentication
- Gateway token passed on WebSocket connection
- Stored in environment variables
- Never exposed to client

### Authorization
- Gateway controls method access
- RPC methods are protected
- Events are filtered by permissions

### Data Protection
- HTTPS/WSS in production
- CSP headers prevent XSS
- Input validation on all forms
- Output encoding for user data

## Testing Architecture

### Unit Tests (`__tests__/`)
- Component logic testing
- Utility function testing
- Hook behavior testing
- Uses Jest + React Testing Library

### Integration Tests
- Gateway communication mocking
- Event flow testing
- API client testing

### E2E Tests (Optional)
- Full user flows with Playwright
- Real gateway connection
- Performance testing

## Deployment Architecture

### Development
```
localhost:3000 (Dashboard)
    ↔
localhost:3001 (Gateway WebSocket)
```

### Production (Vercel)
```
dashboard.clawdis.dev (Next.js on Vercel Edge)
    ↔
gateway.clawdis.dev (Self-hosted/AWS/Docker)
```

### Environment Configuration
- `.env.local` - Development (git-ignored)
- `.env.production` - Production (secure storage)
- Vercel Environment Variables - Deployment

## Future Improvements

### Planned Enhancements
1. **Caching Layer** - Redis integration for state cache
2. **Offline Support** - Service Worker + IndexedDB
3. **Analytics** - Extended metrics collection
4. **AI Integration** - LLM-powered insights
5. **Mobile PWA** - Progressive Web App support

### Scalability Considerations
1. Load balancing for gateway servers
2. Database replication for session store
3. CDN for static assets
4. WebSocket scaling with Redis Pub/Sub

## Glossary

- **Gateway**: Backend server managing WhatsApp/Telegram connections
- **RPC**: Remote Procedure Call protocol for request/response
- **Event Frame**: Asynchronous message from gateway
- **Presence**: Live user status data
- **Session**: Active WhatsApp/Telegram connection
- **Health**: Gateway operational status
- **Snapshot**: Complete gateway state
