"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  MessageSquareText,
  Table2,
  Wallet,
  Sparkles,
} from "lucide-react";

const actions = [
  { title: "Payrolls", href: "/admin/payrolls", Icon: Wallet },
  { title: "Attendance", href: "/admin/attendance", Icon: Table2 },
  { title: "Calendar", href: "/admin/calendar", Icon: CalendarDays },
  { title: "Support", href: "/user/requests", Icon: MessageSquareText },
];

export function QuickActions() {
  return (
    <Card className="rounded-2xl border-b-8 bg-white/70 p-4 shadow-sm backdrop-blur">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Quick Actions</p>
          <p className="text-xs text-slate-500">Jump into common tasks</p>
        </div>
      </div>

      {/* Actions grid */}
      <div className="grid grid-cols-2 gap-3">
        {actions.map(({ title, href, Icon }) => (
          <Button
            key={title}
            asChild
            variant="outline"
            className="
              group h-11 flex-col items-center justify-center gap-1
              rounded-xl border-slate-200 bg-white/70
              text-xs font-medium text-slate-800
              transition
              hover:-translate-y-1 hover:border-blue-200
              hover:bg-blue-50/70 hover:shadow
            "
          >
            <Link href={href}>
              <Icon className="h-4 w-4 text-slate-600 group-hover:text-blue-700" />
              {title}
            </Link>
          </Button>
        ))}
      </div>
    </Card>
  );
}
