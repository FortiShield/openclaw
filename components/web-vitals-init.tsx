"use client";

import { useEffect } from "react";

export function WebVitalsInit() {
  useEffect(() => {
    // Initialize Web Vitals tracking in browser environment only
    if (typeof window !== "undefined") {
      // Web Vitals are automatically collected by Next.js
      // and sent to the /api/metrics endpoint
    }
  }, []);

  // This component doesn't render anything
  return null;
}
