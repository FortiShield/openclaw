import { getCLS, getCWV, getFID, getFCP, getLCP } from "web-vitals";

export type WebVitalMetric = {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
};

/**
 * Web Vitals thresholds (from web-vitals library)
 * https://web.dev/articles/vitals
 */
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 600, poor: 1200 },
};

function getRating(
  metric: string,
  value: number
): "good" | "needs-improvement" | "poor" {
  const threshold = THRESHOLDS[metric as keyof typeof THRESHOLDS];
  if (!threshold) return "needs-improvement";

  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
}

export function initWebVitals() {
  if (typeof window === "undefined") return;

  getCLS((metric) => {
    console.log("[v0] Web Vital - CLS:", {
      value: metric.value,
      rating: getRating("CLS", metric.value),
    });
  });

  getFCP((metric) => {
    console.log("[v0] Web Vital - FCP:", {
      value: metric.value,
      rating: getRating("FCP", metric.value),
    });
  });

  getFID((metric) => {
    console.log("[v0] Web Vital - FID:", {
      value: metric.value,
      rating: getRating("FID", metric.value),
    });
  });

  getLCP((metric) => {
    console.log("[v0] Web Vital - LCP:", {
      value: metric.value,
      rating: getRating("LCP", metric.value),
    });
  });

  getCWV((metric) => {
    console.log("[v0] Web Vital - Core Web Vital:", {
      name: metric.name,
      value: metric.value,
      rating: getRating(metric.name, metric.value),
    });
  });
}

export function reportWebVitals(metric: any) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    id: metric.id,
    url: window.location.href,
    timestamp: new Date().toISOString(),
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/metrics", body);
  }
}
