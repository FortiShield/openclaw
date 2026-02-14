# Performance Optimization Guide

## Core Web Vitals

The CLAWDIS Dashboard tracks three critical metrics that impact user experience:

### Largest Contentful Paint (LCP)
**Target**: < 2.5 seconds (Good)

The time when the main content becomes visible.

#### Optimization Strategies
```typescript
// 1. Use Next.js Image optimization
import Image from "next/image";
<Image src="/logo.png" alt="Logo" priority width={100} height={100} />

// 2. Minimize render-blocking JavaScript
// Split code into smaller chunks with dynamic imports
const HeavyComponent = dynamic(() => import("@/components/heavy"));

// 3. Optimize font loading
const inter = Inter({
  subsets: ["latin"],
  display: "swap",  // Show fallback while loading
  variable: "--font-inter",
});
```

### First Input Delay (FID) / Interaction to Next Paint (INP)
**Target**: < 100 ms (Good)

How quickly the page responds to user input.

#### Optimization Strategies
```typescript
// 1. Debounce event handlers
import { useCallback } from "react";

const handleSearch = useCallback(
  debounce((query: string) => {
    request("search", { query });
  }, 300),
  []
);

// 2. Use rate limiting for API calls
import { createRateLimitedFunction } from "@/lib/rate-limit";
const limitedRequest = createRateLimitedFunction(request, "search");

// 3. Move heavy computation to Web Workers
const worker = new Worker("/workers/compute.js");
worker.postMessage(heavyData);
```

### Cumulative Layout Shift (CLS)
**Target**: < 0.1 (Good)

Unexpected layout changes during page load.

#### Optimization Strategies
```typescript
// 1. Always specify dimensions for dynamic content
<div className="aspect-video bg-gray-100">
  <iframe src="..." width="100%" height="100%" />
</div>

// 2. Avoid inserting content above existing content
// Reserve space with skeleton loading
<Skeleton className="h-20 w-full mb-4" />

// 3. Use CSS containment to isolate layout shifts
<div className="contain">
  {/* Changes here won't affect other elements */}
</div>
```

## Performance Monitoring

### Web Vitals Collection

The dashboard automatically collects Core Web Vitals and sends them to `/api/metrics`:

```typescript
// lib/web-vitals.ts
initWebVitals();  // Start in your root layout

// Manual metric reporting
reportWebVitals({
  name: "LCP",
  value: 2000,
  delta: 100,
  id: "metric-1",
  url: window.location.href,
  timestamp: Date.now(),
});
```

### Browser DevTools Analysis

1. **Lighthouse Audit**
   ```bash
   # Chrome DevTools → Lighthouse tab
   # Run audit for Performance, Accessibility, SEO
   ```

2. **Performance Tab**
   - Record performance profile
   - Identify long tasks
   - Analyze JavaScript execution
   - Check layout thrashing

3. **Network Tab**
   - Monitor WebSocket connections
   - Track API call latency
   - Identify waterfall issues

## Bundle Size Optimization

### Current Configuration

```typescript
// next.config.ts
experimental: {
  optimizePackageImports: ["lucide-react", "@radix-ui/*"],
}
```

This automatically tree-shakes unused components.

### Analyze Bundle Size

```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Run analysis
ANALYZE=true pnpm build

# Review .next/static/chunks/ directory
```

### Optimization Techniques

1. **Code Splitting**
```typescript
// Automatic with App Router
// Each page gets its own chunk
app/
  ├── page.tsx        // chunk-1
  ├── chat/page.tsx   // chunk-2
  └── config/page.tsx // chunk-3
```

2. **Dynamic Imports**
```typescript
import dynamic from "next/dynamic";

// Load component only when needed
const ConfigEditor = dynamic(() => import("@/components/config/config-editor"), {
  loading: () => <Skeleton className="h-64 w-full" />,
});
```

3. **Remove Unused Dependencies**
```json
{
  "dependencies": {
    // Only include what's actually used
    "lucide-react": "^0.469.0",
    "@radix-ui/react-dialog": "^1.1.6"
  }
}
```

## Runtime Performance

### Memory Management

```typescript
// Avoid memory leaks with cleanup
useEffect(() => {
  const interval = setInterval(() => {
    updateData();
  }, 5000);

  // Always cleanup
  return () => clearInterval(interval);
}, []);
```

### Rendering Optimization

```typescript
// 1. Memoize expensive components
const MemoizedHealthCard = memo(HealthCard);

// 2. Use useCallback for stable references
const handleRefresh = useCallback(() => {
  call();
}, [call]);

// 3. Optimize list rendering
function SessionList({ sessions }: { sessions: Session[] }) {
  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <SessionItem key={session.id} session={session} />
      ))}
    </div>
  );
}
```

### Event Handling

```typescript
// Use event delegation for large lists
function ListContainer() {
  const handleClick = (e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (target.classList.contains("list-item")) {
      const id = target.dataset.id;
      onSelectItem(id);
    }
  };

  return (
    <div onClick={handleClick}>
      {items.map((item) => (
        <div key={item.id} data-id={item.id} className="list-item">
          {item.name}
        </div>
      ))}
    </div>
  );
}
```

## Network Performance

### WebSocket Optimization

```typescript
// Rate limit WebSocket messages
import { wsRateLimiter } from "@/lib/rate-limit";

const limitedSend = createRateLimitedFunction(
  (data) => ws.send(JSON.stringify(data)),
  "ws-send",
  wsRateLimiter
);

// Only allow 100 messages per second
limitedSend(largePayload);
```

### Request Optimization

```typescript
// Batch API requests
async function batchRequests(requests: Request[]) {
  const results = await Promise.allSettled(
    requests.map((req) => apiPost(req.endpoint, req.data))
  );
  return results;
}

// Or use SWR for automatic caching
import useSWR from "swr";

function Component() {
  const { data } = useSWR("/api/sessions", fetcher, {
    revalidateOnFocus: false,  // Don't refetch on window focus
    dedupingInterval: 60000,   // Cache for 60s
  });
}
```

## Caching Strategies

### Browser Caching

```typescript
// Cache API responses with SWR
const { data, error } = useSWR("/api/health", fetcher, {
  // Refresh every 30 seconds
  refreshInterval: 30000,
  // But don't show stale data
  dedupingInterval: 5000,
  // Keep data even on error
  keepPreviousData: true,
});
```

### HTTP Caching Headers

```typescript
// app/api/metrics/route.ts
export async function GET() {
  return NextResponse.json(
    { /* data */ },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}
```

## Load Testing

### Simulate High Traffic

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:3000/

# Using wrk (better for WebSocket)
wrk -t12 -c400 -d30s --latency http://localhost:3000/
```

### Identify Bottlenecks

1. **High CPU Usage**
   - Reduce computations
   - Use Web Workers for heavy tasks
   - Implement caching

2. **High Memory Usage**
   - Check for memory leaks
   - Implement pagination
   - Use virtual scrolling for large lists

3. **High Latency**
   - Optimize database queries
   - Implement CDN
   - Reduce payload sizes

## Lighthouse Best Practices

### Performance Score (90+)

- ✅ Minimize unused JavaScript
- ✅ Defer offscreen images
- ✅ Minify CSS and JavaScript
- ✅ Enable text compression
- ✅ Remove unused CSS

### Accessibility Score (90+)

- ✅ Proper heading hierarchy
- ✅ Image alt text
- ✅ Form labels
- ✅ Color contrast ratios
- ✅ ARIA attributes where needed

### Best Practices (90+)

- ✅ HTTPS enabled
- ✅ No deprecated APIs
- ✅ Proper error handling
- ✅ Security headers

### SEO Score (90+)

- ✅ Mobile friendly
- ✅ Meta descriptions
- ✅ robots.txt
- ✅ Proper status codes

## Production Deployment Checklist

- [ ] Run `pnpm build` and verify no errors
- [ ] Run Lighthouse audit (target 90+ all scores)
- [ ] Test on slow 3G network (Chrome DevTools)
- [ ] Test on low-end mobile device
- [ ] Verify all env variables are set
- [ ] Enable gzip compression on server
- [ ] Set up CDN for static assets
- [ ] Configure caching headers
- [ ] Set up monitoring/alerting
- [ ] Test fallback error pages

## Monitoring in Production

### Key Metrics to Track

1. **Real User Monitoring (RUM)**
   - Actual Web Vitals from users
   - Browser compatibility issues
   - Geographic performance variance

2. **Synthetic Monitoring**
   - Automated performance tests
   - Alert on degradation
   - Track trends over time

3. **Error Rate**
   - JavaScript errors
   - API errors
   - Network errors

### Tools

- **Vercel Analytics**: Built-in, no setup
- **Sentry**: Error tracking
- **DataDog**: Full observability
- **New Relic**: APM monitoring

## Common Performance Issues

### Issue: Slow Page Load
**Solution**: 
- Enable compression
- Reduce image sizes
- Implement caching
- Use CDN

### Issue: Slow API Responses
**Solution**:
- Add database indexes
- Implement pagination
- Use caching layer
- Load balance

### Issue: WebSocket Connection Drops
**Solution**:
- Implement auto-reconnect
- Add heartbeat
- Check firewall rules
- Increase timeout

### Issue: High Memory Usage
**Solution**:
- Check for memory leaks
- Implement pagination
- Use virtual scrolling
- Profile with DevTools

## Resources

- [web.dev/vitals](https://web.dev/articles/vitals)
- [Next.js Performance](https://nextjs.org/learn/performance)
- [React Performance](https://react.dev/reference/react/useMemo)
- [MDN Performance Guide](https://developer.mozilla.org/en-US/docs/Web/Performance)
