"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type Notif = {
  id: string;
  title: string;
  message: string;
  href: string | null;
  isRead: boolean;
  createdAt: string;
};

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const [items, setItems] = React.useState<Notif[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  async function load() {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    const data = await res.json();
    setItems(data.items ?? []);
    setUnreadCount(data.unreadCount ?? 0);
  }

  React.useEffect(() => {
    load();
    const t = setInterval(load, 30000); // refresh every 30s
    return () => clearInterval(t);
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    // Optimistic UI update (instant)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && load()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 rounded-full bg-red-500 px-1 text-[10px] leading-4 text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {items.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">No notifications yet.</div>
        ) : (
          items.map((n) => (
            <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1">
              <div className="flex w-full items-center justify-between">
                <span className={`text-sm font-medium ${n.isRead ? "opacity-70" : ""}`}>
                  {n.title}
                </span>
                <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
              </div>

              <span className={`text-xs ${n.isRead ? "text-muted-foreground" : ""}`}>
                {n.message}
              </span>

              <div className="flex gap-2 pt-1">
                {n.href ? (
                  <Link
                    href={n.href}
                    onClick={() => markRead(n.id)}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                ) : (
                  <button
                    onClick={() => markRead(n.id)}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}