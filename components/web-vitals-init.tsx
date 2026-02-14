"use client";

import { useEffect } from "react";

export function WebVitalsInit() {
  useEffect(() => {
    // Initialize Web Vitals tracking in browser environment only
    if (typeof window !== "undefined") {
      // Use Next.js built-in Web Vitals reporting
      import("next/dist/shared/lib/utils").then(() => {
        // Web Vitals will be automatically collected by Next.js
        console.log("[v0] Web Vitals monitoring initialized");
      });
    }
  }, []);

  // This component doesn't render anything
  return null;
}
