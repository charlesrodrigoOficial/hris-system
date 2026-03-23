"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { canManageAttendance } from "@/lib/auth/roles";
import {
  CalendarDays,
  ClipboardList,
  MessageSquareText,
  Table2,
  Wallet,
  Sparkles,
} from "lucide-react";

const baseActions = [
  { title: "Payrolls", href: "/admin/payrolls", Icon: Wallet },
  { title: "Calendar", href: "/admin/calendar", Icon: CalendarDays },
  { title: "Support", href: "/user/requests", Icon: MessageSquareText },
];

type QuickActionsProps = {
  className?: string;
  role?: string | null;
};

function getQuickActions(role?: string | null) {
  const attendanceAction = canManageAttendance(role)
    ? { title: "Attendance", href: "/#attendance", Icon: Table2 }
    : { title: "Reviews", href: "/user/reviews", Icon: ClipboardList };

  return [
    baseActions[0],
    attendanceAction,
    baseActions[1],
    baseActions[2],
  ];
}

export function QuickActions({ className, role }: QuickActionsProps) {
  const actions = getQuickActions(role);

  return (
    <Card
      className={cn(
        "rounded-2xl border border-sky-200/70 bg-gradient-to-r from-blue-950 via-blue-700 to-slate-200 p-4 text-slate-900 shadow-lg transition hover:-translate-y-1 hover:shadow-xl",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-200">Quick Actions</p>
          <p className="text-xs text-slate-200">Jump into common tasks</p>
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
              rounded-xl border border-sky-200 bg-white/75
              text-xs font-medium text-slate-800
              transition
              hover:-translate-y-1 hover:border-sky-300
              hover:bg-white hover:shadow
            "
          >
            <Link href={href}>
              <Icon className="h-4 w-4 text-slate-500 group-hover:text-sky-700" />
              {title}
            </Link>
          </Button>
        ))}
      </div>
    </Card>
  );
}

export function QuickActionsCompact({ className, role }: QuickActionsProps) {
  const actions = getQuickActions(role);

  return (
    <div className={cn("mt-2 grid grid-cols-2 gap-3", className)}>
      {actions.map(({ title, href, Icon }) => (
        <Button
          key={title}
          asChild
          variant="outline"
          className="
            group h-11 flex-col items-center justify-center gap-1
            rounded-xl border border-sky-200 bg-white/75
            text-xs font-medium text-slate-800
            transition
            hover:-translate-y-1 hover:border-sky-300
            hover:bg-white hover:shadow
          "
        >
          <Link href={href} aria-label={title} title={title}>
            <Icon className="h-4 w-4 text-slate-500 group-hover:text-sky-700" />
            {title}
          </Link>
        </Button>
      ))}
    </div>
  );
}
