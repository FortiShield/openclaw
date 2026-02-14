"use client";

import { SessionTable } from "@/components/sessions/session-table";

export default function SessionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground text-balance">
          Sessions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage gateway sessions, token usage, and thinking levels
        </p>
      </div>

      <SessionTable />
    </div>
  );
}
