"use client";

import { NodeList } from "@/components/nodes/node-list";
import { PairRequests } from "@/components/nodes/pair-requests";

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

      <PairRequests />
      <NodeList />
    </div>
  );
}
