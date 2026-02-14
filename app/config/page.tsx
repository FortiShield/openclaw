"use client";

import { ConfigEditor } from "@/components/config/config-editor";
import { VoiceWakeEditor } from "@/components/config/voicewake-editor";
import { Suspense } from "react";

export default function ConfigPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-foreground text-balance">
          Configuration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edit gateway configuration (JSON5) and voice wake triggers
        </p>
      </div>

      <Suspense fallback={<div className="h-96 animate-pulse bg-secondary rounded-xl" />}>
        <ConfigEditor />
      </Suspense>
      <Suspense fallback={<div className="h-96 animate-pulse bg-secondary rounded-xl" />}>
        <VoiceWakeEditor />
      </Suspense>
    </div>
  );
}
