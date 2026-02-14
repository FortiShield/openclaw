"use client";

import { HealthCard } from "@/components/dashboard/health-card";
import { PresenceList } from "@/components/dashboard/presence-list";
import { UptimeCard } from "@/components/dashboard/uptime-card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground text-balance">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time overview of your CLAWDIS gateway
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HealthCard />
        </div>
        <UptimeCard />
      </div>

      <PresenceList />
    </div>
  );
}
