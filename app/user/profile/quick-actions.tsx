// components/admin/quick-actions.tsx
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

type QuickAction = {
  title: string;
  href: string;
  Icon: React.ElementType;
  hint?: string;
};

const actions: QuickAction[] = [
  { title: "Payrolls", href: "/admin/payrolls", Icon: Wallet, hint: "Payments & salaries" },
  { title: "Attendance", href: "/admin/attendance", Icon: Table2, hint: "Timesheets & status" },
  { title: "Calendar", href: "/admin/calendar", Icon: CalendarDays, hint: "Events & holidays" },
  { title: "Support", href: "/user/requests", Icon: MessageSquareText, hint: "Requests & helpdesk" },
];

export function QuickActions() {
  return (
    <Card className="relative mb-6 overflow-hidden rounded-2xl border bg-white/70 p-3 shadow-sm backdrop-blur">
      {/* subtle ring */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-blue-200/40" />
      {/* soft glow */}
      <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-[520px] -translate-x-1/2 rounded-full bg-blue-400/15 blur-3xl" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 px-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">Quick Actions</p>
            <p className="text-xs text-slate-500">Jump into common tasks</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          {actions.map(({ title, href, Icon, hint }) => (
            <Button
              key={title}
              asChild
              variant="outline"
              className="
                group h-10 justify-start gap-2 rounded-xl border-slate-200 bg-white/70
                px-3 text-sm text-slate-800 shadow-sm transition
                hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow
                active:translate-y-0
              "
              title={hint ?? title}
            >
              <Link href={href}>
                <Icon className="h-4 w-4 text-slate-600 transition group-hover:text-blue-700" />
                <span className="font-medium">{title}</span>
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}