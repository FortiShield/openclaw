"use client";

import { cn } from "@/lib/utils";
import {
  Activity,
  Calendar,
  MessageSquare,
  Monitor,
  Network,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/", icon: Activity },
  { name: "Sessions", href: "/sessions", icon: Monitor },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Nodes", href: "/nodes", icon: Network },
  { name: "Config", href: "/config", icon: Settings },
  { name: "Cron", href: "/cron", icon: Calendar },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <span className="text-sm font-bold font-mono">C</span>
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">
          CLAWDIS
        </span>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground">
          v2.0
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        {navigation.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-4 py-3">
        <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">
          Gateway Dashboard
        </p>
      </div>
    </aside>
  );
}
