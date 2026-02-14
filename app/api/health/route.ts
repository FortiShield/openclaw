import { NextResponse } from "next/server";

/**
 * Health Check Endpoint
 *
 * Used for:
 * - Kubernetes/Container health probes
 * - Monitoring services (DataDog, Sentry, etc.)
 * - Load balancer health checks
 * - CI/CD deployment verification
 */
export async function GET() {
  try {
    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: process.env.NEXT_PUBLIC_APP_VERSION || "2.0.0-beta1",
        environment: process.env.NODE_ENV || "production",
        uptime: process.uptime(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
      { status: 503 }
    );
  }
}
