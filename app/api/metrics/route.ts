import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/metrics - Collect Web Vitals metrics
 *
 * This endpoint collects performance metrics from the client
 * for monitoring and analysis.
 */
export async function POST(request: NextRequest) {
  try {
    const metric = await request.json();

    // Log metric to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("[v0] Web Vital Metric:", metric);
    }

    // In production, you can:
    // - Send to analytics service (e.g., Vercel Analytics, Sentry, DataDog)
    // - Store in database
    // - Send to monitoring service

    return NextResponse.json(
      { success: true, id: Math.random().toString(36).substr(2, 9) },
      { status: 200 }
    );
  } catch (error) {
    console.error("[v0] Error processing metric:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process metric" },
      { status: 400 }
    );
  }
}

/**
 * Health check endpoint for monitoring
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || "2.0.0-beta1",
    },
    { status: 200 }
  );
}
