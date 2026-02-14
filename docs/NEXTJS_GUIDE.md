# CLAWDIS Next.js Implementation Guide

This document outlines the Next.js implementation architecture for the CLAWDIS dashboard, which serves as the web interface for WhatsApp/Telegram AI gateway management and monitoring.

## Project Overview

**CLAWDIS** is a sophisticated TypeScript/Node.js application consisting of:
- **CLI Core** (`src/`) - WhatsApp/Telegram gateway CLI with AI agent integration
- **Web Dashboard** (`app/`) - Next.js 15 admin interface for monitoring and control
- **Mobile Apps** (`apps/`) - iOS and macOS native clients

The web dashboard uses Next.js 15 with React 19, TailwindCSS v4, and shadcn/ui components for a modern, responsive admin experience.

## Architecture Overview

### Directory Structure

```
├── app/                          # Next.js 15 App Router
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Dashboard home
│   ├── (routes)/
│   │   ├── chat/page.tsx        # Chat management
│   │   ├── sessions/page.tsx    # Session tracking
│   │   ├── config/page.tsx      # Configuration panel
│   │   └── nodes/page.tsx       # Node management
│   ├── api/
│   │   └── metrics/route.ts     # Performance metrics endpoint
│   ├── error.tsx                # Global error boundary
│   ├── not-found.tsx            # 404 handler
│   ├── loading.tsx              # Loading UI
│   └── globals.css              # Global styles with TailwindCSS v4
├── components/                   # React components
│   ├── dashboard/               # Dashboard-specific components
│   ├── chat/                    # Chat interface components
│   ├── sessions/                # Session management components
│   ├── config/                  # Configuration components
│   ├── nodes/                   # Node management components
│   ├── gateway-provider.tsx     # Gateway connection context
│   ├── connection-status.tsx    # Connection indicator
│   ├── sidebar.tsx              # Navigation sidebar
│   └── web-vitals-init.tsx      # Performance monitoring init
├── hooks/                        # Custom React hooks
│   ├── use-gateway.ts           # Gateway context hook
│   ├── use-gateway-method.ts    # RPC method calling hook
│   ├── use-gateway-events.ts    # Event subscription hook
│   └── use-websocket.ts         # WebSocket management
├── lib/                          # Utility libraries
│   ├── env.ts                   # Environment configuration
│   ├── api.ts                   # API client with error handling
│   ├── web-vitals.ts            # Web Vitals tracking
│   ├── rate-limit.ts            # Client-side rate limiting
│   ├── gateway-client.ts        # Gateway WebSocket client
│   ├── protocol-types.ts        # TypeScript protocol definitions
│   └── utils.ts                 # Common utilities
├── middleware.ts                 # Request middleware with security headers
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── public/
│   └── robots.txt               # SEO robots configuration
└── docs/                         # Documentation
    └── NEXTJS_GUIDE.md          # This file
```

## Key Features

### 1. Foundation & Configuration
- **Middleware** (`middleware.ts`) - Security headers, CSP, XSS protection
- **Error Handling** - Global error boundary with graceful fallbacks
- **Loading States** - Skeleton loading for better UX
- **404 Pages** - Custom not-found page
- **Environment Validation** (`lib/env.ts`) - Build-time env validation

### 2. Performance & Production Features
- **Web Vitals Monitoring** (`lib/web-vitals.ts`) - Core Web Vitals tracking
- **API Client** (`lib/api.ts`) - Typed API requests with timeout handling
- **Rate Limiting** (`lib/rate-limit.ts`) - Client-side request throttling
- **Metrics Endpoint** (`app/api/metrics/route.ts`) - Performance data collection
- **Image Optimization** - Automatic WebP/AVIF format selection
- **Package Import Optimization** - Tree-shaking for lucide-react and Radix UI

### 3. Core Features
- **WebSocket Integration** (`hooks/use-websocket.ts`) - Auto-reconnect, error handling
- **Gateway Communication** (`components/gateway-provider.tsx`) - RPC-based gateway API
- **Event Streaming** - Real-time health, presence, and session updates
- **Real-time Dashboard** - Live monitoring of WhatsApp/Telegram status
- **Session Management** - Active session tracking and control
- **Configuration UI** - Dynamic config editing with validation

### 4. Testing Infrastructure
- **Unit Tests** - Jest configuration with TypeScript support
- **Component Tests** - Testing library setup for React components
- **Integration Tests** - Gateway communication mocking
- **E2E Tests** - Playwright setup for full user flows

### 5. Documentation & Polish
- **Code Comments** - JSDoc annotations for all utilities
- **Component Documentation** - Storybook integration
- **API Documentation** - TypeScript types and protocol definitions
- **Performance Guide** - Web Vitals thresholds and optimization tips

## Environment Configuration

Create a `.env.local` file with the following variables:

```env
# App Configuration
NEXT_PUBLIC_APP_NAME=CLAWDIS
NEXT_PUBLIC_APP_VERSION=2.0.0-beta1
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Gateway Configuration
NEXT_PUBLIC_GATEWAY_BASE_URL=http://localhost:3001
NEXT_PUBLIC_GATEWAY_WS_URL=ws://localhost:3001

# Optional: Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+1XXXXXXXXXX

# Optional: Telegram
TELEGRAM_BOT_TOKEN=your_token_here

# Optional: Monitoring
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

## Development

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
pnpm dev

# Open browser to http://localhost:3000
```

### Build for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Generate coverage report
pnpm test:coverage
```

## API Integration

The dashboard communicates with the CLAWDIS gateway via WebSocket using a custom RPC protocol. Key hooks for gateway communication:

### useGateway()
Access the gateway connection state and make RPC calls:

```typescript
import { useGateway } from "@/hooks/use-gateway";

export function MyComponent() {
  const { state, request } = useGateway();
  
  async function getHealth() {
    const health = await request("health");
    console.log(health);
  }
  
  return (
    <div>
      Connected: {state === "connected" ? "Yes" : "No"}
      <button onClick={getHealth}>Check Health</button>
    </div>
  );
}
```

### useGatewayMethod()
Call RPC methods with automatic refresh:

```typescript
import { useGatewayMethod } from "@/hooks/use-gateway-method";

export function HealthCheck() {
  const { data: health, loading, error, call } = useGatewayMethod("health");
  
  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {health && <p>Status: {health.status}</p>}
      <button onClick={call}>Refresh</button>
    </div>
  );
}
```

### useGatewayEvent()
Subscribe to real-time events:

```typescript
import { useGatewayEvent } from "@/hooks/use-gateway-events";

export function LiveStatus() {
  const [status, setStatus] = useState(null);
  
  useGatewayEvent("presence", (data) => {
    setStatus(data);
  });
  
  return <div>{JSON.stringify(status)}</div>;
}
```

## Performance Optimization

### Web Vitals Monitoring

The dashboard automatically tracks Core Web Vitals:
- **LCP** (Largest Contentful Paint) - target < 2.5s
- **FID** (First Input Delay) - target < 100ms
- **CLS** (Cumulative Layout Shift) - target < 0.1

Metrics are sent to `/api/metrics` for analysis.

### Rate Limiting

Client-side rate limiting prevents excessive API calls:

```typescript
import { apiRateLimiter, createRateLimitedAsyncFunction } from "@/lib/rate-limit";

const limitedFetch = createRateLimitedAsyncFunction(
  async (url) => fetch(url).then(r => r.json()),
  "fetch-key",
  apiRateLimiter
);

// Only allows 30 requests per minute
const result = await limitedFetch("/api/data");
```

### Image Optimization

Next.js automatically optimizes images with:
- Automatic format selection (WebP, AVIF)
- Responsive image sizing
- Lazy loading
- Placeholder support

```typescript
import Image from "next/image";

export function Logo() {
  return (
    <Image
      src="/logo.png"
      alt="CLAWDIS Logo"
      width={200}
      height={200}
      priority
    />
  );
}
```

## Security Features

### Security Headers
- **X-Content-Type-Options**: nosniff - Prevent MIME type sniffing
- **X-XSS-Protection**: 1; mode=block - Enable XSS protection
- **X-Frame-Options**: DENY - Prevent clickjacking
- **Content-Security-Policy**: Restrictive CSP for dashboard
- **Referrer-Policy**: strict-origin-when-cross-origin

### Environment Variables
- Sensitive values never exposed to client
- Public values prefixed with `NEXT_PUBLIC_`
- Server-side validation with `lib/env.ts`

### Type Safety
- Full TypeScript strict mode
- Protocol type definitions for gateway communication
- Type-safe API client with error handling

## Deployment

### Vercel
CLAWDIS is optimized for Vercel deployment:

```bash
# Deploy to Vercel
vercel deploy

# Set environment variables
vercel env add NEXT_PUBLIC_GATEWAY_BASE_URL
vercel env add NEXT_PUBLIC_GATEWAY_WS_URL
```

### Docker
For containerized deployment:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN pnpm install && pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Configure proper `NEXT_PUBLIC_APP_URL`
- Set up secure WebSocket URLs (wss://)
- Configure analytics and monitoring services

## Troubleshooting

### WebSocket Connection Issues
- Ensure `NEXT_PUBLIC_GATEWAY_WS_URL` points to accessible WebSocket server
- Check browser console for connection errors
- Verify CORS/CORS preflight is handled correctly

### Performance Issues
- Check Web Vitals in browser DevTools
- Run `pnpm test:coverage` to analyze bundle size
- Use Lighthouse for performance audits

### TypeScript Errors
- Run `pnpm lint` to check for type errors
- Ensure all dependencies are installed with `pnpm install`
- Clear `.next` directory and rebuild with `pnpm build`

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [TailwindCSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Web Vitals Guide](https://web.dev/articles/vitals)

## Contributing

When contributing to the dashboard:

1. Follow the existing component structure
2. Use TypeScript strict mode
3. Add comprehensive error handling
4. Include JSDoc comments for public APIs
5. Test changes with `pnpm test`
6. Run `pnpm lint:fix` before committing

## Support

For issues or questions:
- Check the GitHub issues
- Review CLAWDIS documentation
- Contact the development team
