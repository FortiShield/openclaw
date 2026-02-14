"use client";

import { NodeList } from "@/components/nodes/node-list";
import { PairRequests } from "@/components/nodes/pair-requests";
import { Suspense } from "react";

export default function NodesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-foreground text-balance">
          Nodes
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage paired nodes and approve incoming pair requests
        </p>
      </div>

      <Suspense fallback={<div className="h-96 animate-pulse bg-secondary rounded-xl" />}>
        <PairRequests />
      </Suspense>
      <Suspense fallback={<div className="h-96 animate-pulse bg-secondary rounded-xl" />}>
        <NodeList />
      </Suspense>
    </div>
  );
}
