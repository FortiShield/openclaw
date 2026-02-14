"use client";

import { ConfigEditor } from "@/components/config/config-editor";
import { VoiceWakeEditor } from "@/components/config/voicewake-editor";

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

      <ConfigEditor />
      <VoiceWakeEditor />
    </div>
  );
}
